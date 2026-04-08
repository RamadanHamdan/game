// lib/licenseClientDirect.js
// CLIENT-SIDE direct Supabase access — digunakan di Android/Capacitor
// karena API routes Next.js tidak berjalan di static export
//
// CATATAN KEAMANAN:
// - Menggunakan anon key (bukan service_role) — aman untuk expose ke client
// - Pastikan Supabase RLS (Row Level Security) sudah dikonfigurasi dengan benar
// - Tabel licenses: anon bisa SELECT tapi tidak INSERT/UPDATE/DELETE
// - Tabel license_activations: anon bisa SELECT + INSERT tapi tidak UPDATE/DELETE

import { createClient } from '@supabase/supabase-js';
import { SignJWT } from 'jose';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const JWT_SECRET_RAW = process.env.NEXT_PUBLIC_LICENSE_JWT_SECRET || 'fallback-dev-secret';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_RAW);

let _client = null;

function getClient() {
    if (!_client) {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            throw new Error('NEXT_PUBLIC_SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_ANON_KEY belum diisi di .env.local');
        }
        _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: { persistSession: false }
        });
    }
    return _client;
}

/**
 * Normalisasi key: hapus dash, uppercase, lalu format ulang
 */
function normalizeKey(key) {
    const cleaned = key.replace(/-/g, '').toUpperCase().trim();
    if (cleaned.length === 16) {
        return `${cleaned.slice(0,4)}-${cleaned.slice(4,8)}-${cleaned.slice(8,12)}-${cleaned.slice(12,16)}`;
    }
    return cleaned;
}

/**
 * Sign JWT token (versi client — menggunakan NEXT_PUBLIC_ secret)
 */
async function signToken(payload) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('12h')
        .sign(JWT_SECRET);
}

/**
 * Aktivasi lisensi secara langsung dari client — untuk Android/Capacitor
 * Menggantikan fetch('/api/license/activate') yang tidak bekerja di static export
 */
export async function activateLicenseDirect(rawKey, fingerprint) {
    const supabase = getClient();
    const normalizedKey = normalizeKey(rawKey);

    console.log('[LicenseDirect] Trying key:', normalizedKey);
    console.log('[LicenseDirect] Supabase URL:', SUPABASE_URL ? 'OK' : 'MISSING');
    console.log('[LicenseDirect] Anon Key:', SUPABASE_ANON_KEY ? 'OK' : 'MISSING');

    // 1. Cari lisensi
    const { data: license, error: licenseError } = await supabase
        .from('licenses')
        .select('*')
        .eq('key', normalizedKey)
        .maybeSingle(); // maybeSingle() tidak error jika 0 rows (vs single() yang error)

    console.log('[LicenseDirect] Query result:', { license, error: licenseError });

    if (licenseError) {
        console.error('[LicenseDirect] Supabase error:', licenseError);
        // Cek apakah error dari RLS (Row Level Security)
        if (licenseError.code === '42501' || licenseError.message?.includes('permission') || licenseError.message?.includes('policy')) {
            return { success: false, error: 'Akses database ditolak. Hubungi administrator untuk mengatur izin Supabase RLS.' };
        }
        return { success: false, error: `Database error: ${licenseError.message}` };
    }

    if (!license) {
        return { success: false, error: 'Kode lisensi tidak ditemukan. Periksa kembali kode Anda.' };
    }

    // 2. Cek apakah lisensi aktif
    if (!license.is_active) {
        return { success: false, error: 'Lisensi ini telah dinonaktifkan. Hubungi administrator.' };
    }

    // 3. Cek expiry
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
        return {
            success: false,
            error: `Lisensi sudah kadaluarsa sejak ${new Date(license.expires_at).toLocaleDateString('id-ID')}.`
        };
    }

    // 4. Cek apakah device ini sudah pernah aktivasi
    const { data: existingActivation } = await supabase
        .from('license_activations')
        .select('*')
        .eq('license_id', license.id)
        .eq('device_fingerprint', fingerprint)
        .maybeSingle();

    if (existingActivation) {
        if (existingActivation.is_blocked) {
            return { success: false, error: 'Perangkat ini telah diblokir oleh administrator.' };
        }
        // Device lama — update last_seen (jika RLS mengizinkan, jika tidak skip saja)
        await supabase
            .from('license_activations')
            .update({ last_seen_at: new Date().toISOString() })
            .eq('id', existingActivation.id);
    } else {
        // 5. Cek batas device jika device baru
        const { count: deviceCount } = await supabase
            .from('license_activations')
            .select('*', { count: 'exact', head: true })
            .eq('license_id', license.id)
            .eq('is_blocked', false);

        if ((deviceCount || 0) >= license.max_devices) {
            return {
                success: false,
                error: `Lisensi ini sudah mencapai batas maksimum ${license.max_devices} perangkat. Hubungi administrator.`
            };
        }

        // 6. Insert aktivasi baru
        const { error: insertError } = await supabase
            .from('license_activations')
            .insert({
                license_id: license.id,
                device_fingerprint: fingerprint,
                last_seen_at: new Date().toISOString(),
                activated_at: new Date().toISOString(),
                is_blocked: false,
            });

        if (insertError) {
            console.error('[LicenseDirect] Insert activation error:', insertError);
            return { success: false, error: 'Gagal mendaftarkan perangkat. Coba lagi.' };
        }
    }

    // 7. Sign JWT token
    const token = await signToken({
        licenseId: license.id,
        licenseKey: license.key,
        schoolName: license.school_name,
        fingerprint,
        licenseType: license.license_type,
    });

    return {
        success: true,
        token,
        school: {
            name: license.school_name,
            type: license.license_type,
            expiresAt: license.expires_at,
        }
    };
}
