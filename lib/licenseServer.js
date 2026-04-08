// lib/licenseServer.js
// SERVER-SIDE ONLY — jangan import di component client-side
// Berisi: JWT sign/verify, Supabase client, generate key

import { SignJWT, jwtVerify } from 'jose';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// ── Supabase Admin Client (service role — hanya untuk server) ────────────────
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let _supabase = null;

export function getSupabase() {
    if (!_supabase) {
        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('[License] SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum diisi di .env.local');
        }
        _supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { persistSession: false }
        });
    }
    return _supabase;
}

// ── JWT Helpers ───────────────────────────────────────────────────────────────
const JWT_SECRET_RAW = process.env.LICENSE_JWT_SECRET || 'fallback-dev-secret-do-not-use-in-prod';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_RAW);
const JWT_EXPIRY = '12h'; // Token expired setiap 12 jam → harus verify ulang

export async function signLicenseToken(payload) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(JWT_EXPIRY)
        .sign(JWT_SECRET);
}

export async function verifyLicenseToken(token) {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return { valid: true, payload };
    } catch (e) {
        return { valid: false, error: e.message };
    }
}

// ── License Key Generator ─────────────────────────────────────────────────────
// Format: XXXX-XXXX-XXXX-XXXX (16 karakter alfanumerik + 3 dash)
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Hindari 0/O, 1/I yang mirip

export function generateLicenseKey() {
    const segment = () =>
        Array.from({ length: 4 }, () => CHARSET[Math.floor(Math.random() * CHARSET.length)]).join('');
    return `${segment()}-${segment()}-${segment()}-${segment()}`;
}

// ── Database Operations ───────────────────────────────────────────────────────

/**
 * Buat lisensi baru untuk sekolah
 */
export async function createLicense({ schoolName, schoolEmail, licenseType = 'annual', maxDevices = 5, expiresAt = null }) {
    const supabase = getSupabase();
    const key = generateLicenseKey();

    const { data, error } = await supabase
        .from('licenses')
        .insert({
            id: uuidv4(),
            key,
            school_name: schoolName,
            school_email: schoolEmail,
            license_type: licenseType,
            max_devices: maxDevices,
            expires_at: expiresAt,
            is_active: true,
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
}

/**
 * Cari lisensi berdasarkan key — return null jika tidak ada
 * Menangani key dengan atau tanpa dash (GY7AN77H... atau GY7A-N77H-...)
 */
export async function findLicenseByKey(key) {
    const supabase = getSupabase();

    // Normalisasi: hapus semua dash, uppercase, trim
    let cleaned = key.replace(/-/g, '').toUpperCase().trim();

    // Re-format menjadi XXXX-XXXX-XXXX-XXXX (format yang disimpan di DB)
    if (cleaned.length === 16) {
        cleaned = `${cleaned.slice(0,4)}-${cleaned.slice(4,8)}-${cleaned.slice(8,12)}-${cleaned.slice(12,16)}`;
    }

    const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('key', cleaned)
        .single();

    if (error || !data) return null;
    return data;
}

/**
 * Hitung berapa device yang sudah aktif untuk sebuah lisensi
 */
export async function countActiveDevices(licenseId) {
    const supabase = getSupabase();
    const { count, error } = await supabase
        .from('license_activations')
        .select('*', { count: 'exact', head: true })
        .eq('license_id', licenseId)
        .eq('is_blocked', false);

    if (error) throw new Error(error.message);
    return count || 0;
}

/**
 * Cari atau buat aktivasi untuk device tertentu
 */
export async function upsertActivation(licenseId, deviceFingerprint) {
    const supabase = getSupabase();

    // Cek apakah device ini sudah pernah aktivasi sebelumnya
    const { data: existing } = await supabase
        .from('license_activations')
        .select('*')
        .eq('license_id', licenseId)
        .eq('device_fingerprint', deviceFingerprint)
        .single();

    if (existing) {
        if (existing.is_blocked) {
            throw new Error('Perangkat ini telah diblokir oleh administrator.');
        }
        // Update last_seen_at
        await supabase
            .from('license_activations')
            .update({ last_seen_at: new Date().toISOString() })
            .eq('id', existing.id);
        return existing;
    }

    // Device baru — insert
    const { data, error } = await supabase
        .from('license_activations')
        .insert({
            id: uuidv4(),
            license_id: licenseId,
            device_fingerprint: deviceFingerprint,
            last_seen_at: new Date().toISOString(),
            activated_at: new Date().toISOString(),
            is_blocked: false,
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
}

/**
 * Revoke lisensi (set is_active = false)
 */
export async function revokeLicense(key) {
    const supabase = getSupabase();
    const { error } = await supabase
        .from('licenses')
        .update({ is_active: false })
        .eq('key', key.toUpperCase().trim());

    if (error) throw new Error(error.message);
    return true;
}
