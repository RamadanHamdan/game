// lib/licenseClientDirect.js
// CLIENT-SIDE direct Supabase REST API access (tanpa library @supabase/supabase-js)
// Menggunakan raw fetch ke Supabase REST API — bekerja di Android & Web
//

// ── Polyfill untuk Android WebView lama (sebelum Chrome 98) ──────────────────
// structuredClone digunakan oleh library jose untuk JSON cloning
if (typeof globalThis !== 'undefined' && typeof globalThis.structuredClone !== 'function') {
    globalThis.structuredClone = function structuredClone(obj) {
        if (obj === undefined) return undefined;
        return JSON.parse(JSON.stringify(obj));
    };
}

// CATATAN KEAMANAN:
// - Menggunakan anon key (bukan service_role) — aman untuk expose ke client
// - Pastikan Supabase RLS dikonfigurasi dengan benar
// - anon: bisa SELECT tabel licenses, SELECT+INSERT license_activations

import { SignJWT } from 'jose';

const SUPABASE_URL    = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const JWT_SECRET_RAW  = process.env.NEXT_PUBLIC_LICENSE_JWT_SECRET || 'fallback-dev-secret';
const JWT_SECRET      = new TextEncoder().encode(JWT_SECRET_RAW);

// ── Supabase REST helper ──────────────────────────────────────────────────────

function supabaseHeaders() {
    if (!SUPABASE_URL || !SUPABASE_ANON) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_ANON_KEY belum diisi');
    }
    return {
        'apikey':        SUPABASE_ANON,
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'Content-Type':  'application/json',
        'Accept':        'application/json',
    };
}

/**
 * SELECT satu row dari tabel Supabase
 * @param {string} table  - nama tabel
 * @param {Record<string,string>} filters - kondisi WHERE { column: value }
 */
async function supabaseSelect(table, filters = {}) {
    const params = new URLSearchParams();
    for (const [col, val] of Object.entries(filters)) {
        // Supabase REST: ?column=eq.value
        params.set(col, `eq.${val}`);
    }
    // LIMIT 1
    params.set('limit', '1');

    const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;
    console.log('[LicenseDirect] SELECT', url);

    const res = await fetch(url, {
        method: 'GET',
        headers: supabaseHeaders(),
    });

    const text = await res.text();
    console.log('[LicenseDirect] SELECT response:', res.status, text.slice(0, 200));

    if (!res.ok) {
        let errMsg = `HTTP ${res.status}`;
        try { errMsg = JSON.parse(text)?.message || errMsg; } catch {}
        throw new Error(`Supabase SELECT error: ${errMsg}`);
    }

    const rows = JSON.parse(text);
    return rows.length > 0 ? rows[0] : null;
}

/**
 * COUNT rows dari tabel Supabase
 */
async function supabaseCount(table, filters = {}) {
    const params = new URLSearchParams();
    for (const [col, val] of Object.entries(filters)) {
        params.set(col, `eq.${val}`);
    }

    const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;
    const res = await fetch(url, {
        method: 'GET',
        headers: {
            ...supabaseHeaders(),
            // Prefer: count=exact — kembalikan count di header
            'Prefer': 'count=exact',
            'Range-Unit': 'items',
            'Range': '0-0',
        },
    });

    // Count ada di header Content-Range: 0-0/N
    const contentRange = res.headers.get('Content-Range') || '0-0/0';
    const total = parseInt(contentRange.split('/')[1] || '0', 10);
    return total;
}

/**
 * INSERT satu row ke tabel Supabase
 */
async function supabaseInsert(table, data) {
    const url = `${SUPABASE_URL}/rest/v1/${table}`;
    console.log('[LicenseDirect] INSERT', table, data);

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            ...supabaseHeaders(),
            'Prefer': 'return=minimal',
        },
        body: JSON.stringify(data),
    });

    const text = await res.text();
    console.log('[LicenseDirect] INSERT response:', res.status, text.slice(0, 200));

    if (!res.ok) {
        let errMsg = `HTTP ${res.status}`;
        try { errMsg = JSON.parse(text)?.message || errMsg; } catch {}
        throw new Error(`Supabase INSERT error: ${errMsg}`);
    }
}

/**
 * UPDATE satu row di tabel Supabase
 */
async function supabaseUpdate(table, filters = {}, data) {
    const params = new URLSearchParams();
    for (const [col, val] of Object.entries(filters)) {
        params.set(col, `eq.${val}`);
    }

    const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;
    const res = await fetch(url, {
        method: 'PATCH',
        headers: {
            ...supabaseHeaders(),
            'Prefer': 'return=minimal',
        },
        body: JSON.stringify(data),
    });

    // Update bisa berhasil meskipun RLS block — tidak throw error di sini
    console.log('[LicenseDirect] UPDATE response:', res.status);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeKey(key) {
    const cleaned = key.replace(/-/g, '').toUpperCase().trim();
    if (cleaned.length === 16) {
        return `${cleaned.slice(0,4)}-${cleaned.slice(4,8)}-${cleaned.slice(8,12)}-${cleaned.slice(12,16)}`;
    }
    return cleaned;
}

async function signToken(payload) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('12h')
        .sign(JWT_SECRET);
}

// ── Main Export ───────────────────────────────────────────────────────────────

/**
 * Aktivasi lisensi langsung via Supabase REST API (tanpa library, tanpa server)
 * Bekerja di: web browser, Android (Capacitor), iOS
 */
export async function activateLicenseDirect(rawKey, fingerprint) {
    console.log('[LicenseDirect] Start activation');
    console.log('[LicenseDirect] SUPABASE_URL:', SUPABASE_URL ? 'OK' : 'MISSING');
    console.log('[LicenseDirect] SUPABASE_ANON:', SUPABASE_ANON ? 'OK' : 'MISSING');

    const normalizedKey = normalizeKey(rawKey);
    console.log('[LicenseDirect] Normalized key:', normalizedKey);

    // 1. Cari lisensi
    const license = await supabaseSelect('licenses', { key: normalizedKey });

    if (!license) {
        return { success: false, error: 'Kode lisensi tidak ditemukan. Periksa kembali kode Anda.' };
    }

    // 2. Cek aktif
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

    // 4. Cek device ini sudah pernah aktivasi?
    const existingActivation = await supabaseSelect('license_activations', {
        license_id:         license.id,
        device_fingerprint: fingerprint,
    });

    if (existingActivation) {
        if (existingActivation.is_blocked) {
            return { success: false, error: 'Perangkat ini telah diblokir oleh administrator.' };
        }
        // Update last_seen (best-effort, tidak throw jika RLS block)
        await supabaseUpdate(
            'license_activations',
            { id: existingActivation.id },
            { last_seen_at: new Date().toISOString() }
        );
    } else {
        // 5. Cek batas device
        const deviceCount = await supabaseCount('license_activations', {
            license_id: license.id,
            is_blocked:  false,
        });

        if (deviceCount >= (license.max_devices || 1)) {
            return {
                success: false,
                error: `Lisensi ini sudah mencapai batas maksimum ${license.max_devices} perangkat.`
            };
        }

        // 6. Insert aktivasi baru
        await supabaseInsert('license_activations', {
            license_id:         license.id,
            device_fingerprint: fingerprint,
            last_seen_at:       new Date().toISOString(),
            activated_at:       new Date().toISOString(),
            is_blocked:         false,
        });
    }

    // 7. Sign JWT
    const token = await signToken({
        licenseId:   license.id,
        licenseKey:  license.key,
        schoolName:  license.school_name,
        fingerprint,
        licenseType: license.license_type,
    });

    return {
        success: true,
        token,
        school: {
            name:      license.school_name,
            type:      license.license_type,
            expiresAt: license.expires_at,
        }
    };
}
