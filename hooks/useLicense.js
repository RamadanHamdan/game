'use client';
// hooks/useLicense.js
// Custom hook untuk manajemen status lisensi di seluruh aplikasi

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    getToken,
    saveToken,
    clearToken,
    getLicenseInfo,
    getBrowserFingerprint,
    formatLicenseKeyInput,
} from '@/lib/licenseClient';

const HEARTBEAT_INTERVAL_MS = 10 * 60 * 1000; // 10 menit
const DEV_BYPASS = process.env.NEXT_PUBLIC_LICENSE_DEV_BYPASS === 'true';

/**
 * Deteksi apakah berjalan di dalam Capacitor (Android/iOS)
 *
 * PENTING: capacitor.config.ts menggunakan androidScheme: 'http',
 * sehingga di Android URL adalah http://localhost — BUKAN capacitor:// atau file://
 * Gunakan window.Capacitor.isNativePlatform() sebagai deteksi utama.
 */
function isCapacitorApp() {
    // 1. Env flag eksplisit — paling reliable, set NEXT_PUBLIC_IS_CAPACITOR=true saat build
    if (process.env.NEXT_PUBLIC_IS_CAPACITOR === 'true') return true;

    if (typeof window === 'undefined') return false;

    // 2. Capacitor official API — bekerja di semua versi & semua androidScheme
    if (typeof window.Capacitor !== 'undefined' && typeof window.Capacitor.isNativePlatform === 'function') {
        return window.Capacitor.isNativePlatform();
    }

    // 3. Fallback untuk Capacitor versi lama / androidScheme non-http
    return window.location.protocol === 'capacitor:'
        || window.location.protocol === 'file:'
        || window.__capacitor === true;
}

// ── Verify token secara lokal (client-side JWT verify) ──────────────────────
async function verifyTokenLocal(token) {
    try {
        // Import jwtVerify dinamis agar tidak error di server
        const { jwtVerify } = await import('jose');
        const secret = new TextEncoder().encode(
            process.env.NEXT_PUBLIC_LICENSE_JWT_SECRET || 'fallback-dev-secret'
        );
        const { payload } = await jwtVerify(token, secret);
        return {
            valid: true,
            school: {
                name: payload.schoolName,
                type: payload.licenseType,
            }
        };
    } catch (e) {
        return { valid: false, error: e.message };
    }
}

export function useLicense() {
    const [status, setStatus] = useState('checking'); // 'checking' | 'licensed' | 'unlicensed'
    const [schoolInfo, setSchoolInfo] = useState(null);
    const [error, setError] = useState(null);
    const [isActivating, setIsActivating] = useState(false);
    const heartbeatRef = useRef(null);

    // ── Verify Token ────────────────────────────────────────────────────────
    const verifyToken = useCallback(async (silent = false) => {
        // Bypass mode untuk development
        if (DEV_BYPASS) {
            setStatus('licensed');
            setSchoolInfo({ name: '[DEV MODE]', type: 'dev' });
            return true;
        }

        const token = getToken();
        if (!token) {
            setStatus('unlicensed');
            return false;
        }

        try {
            let result;

            if (isCapacitorApp()) {
                // Android: verifikasi token secara lokal (no server needed)
                result = await verifyTokenLocal(token);
            } else {
                // Web: verifikasi via API route
                const res = await fetch('/api/license/verify', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                });
                result = await res.json();
            }

            if (result.valid) {
                setStatus('licensed');
                setSchoolInfo(result.school);
                return true;
            } else {
                if (!silent) setError(result.error || 'Lisensi tidak valid.');
                clearToken();
                setStatus('unlicensed');
                return false;
            }
        } catch (e) {
            // Offline atau network error — gunakan grace period
            const info = getLicenseInfo();
            if (info) {
                console.warn('[License] Tidak bisa reach server, menggunakan cached info.');
                setStatus('licensed');
                setSchoolInfo(info);
                return true;
            }
            if (!silent) setError('Tidak dapat terhubung ke server lisensi.');
            setStatus('unlicensed');
            return false;
        }
    }, []);

    // ── Activate License ─────────────────────────────────────────────────────
    const activateLicense = useCallback(async (rawKey) => {
        setIsActivating(true);
        setError(null);

        try {
            const fingerprint = getBrowserFingerprint();

            // Selalu gunakan licenseClientDirect (Supabase langsung)
            // Bekerja di semua platform: web, Android, iOS
            // Tidak bergantung pada API routes Next.js yang tidak ada di static export
            const { activateLicenseDirect } = await import('@/lib/licenseClientDirect');
            const data = await activateLicenseDirect(rawKey, fingerprint);

            if (data.success) {
                saveToken(data.token, data.school);
                setSchoolInfo(data.school);
                setStatus('licensed');
                return { success: true };
            } else {
                setError(data.error || 'Aktivasi gagal.');
                return { success: false, error: data.error };
            }
        } catch (e) {
            console.error('[License] activateLicense error:', e);
            // Tampilkan error asli untuk debug — jangan hidden dengan pesan generic
            let msg;
            if (e.message?.includes('SUPABASE') || e.message?.includes('belum diisi')) {
                msg = 'Konfigurasi server belum lengkap. Hubungi administrator.';
            } else if (e.message?.includes('fetch') || e.message?.includes('network') || e.message?.includes('Network')) {
                msg = `Koneksi gagal: ${e.message}`;
            } else {
                msg = e.message || 'Error tidak diketahui';
            }
            setError(msg);
            return { success: false, error: msg };
        } finally {
            setIsActivating(false);
        }
    }, []);

    // ── Logout / Clear License ───────────────────────────────────────────────
    const deactivateLicense = useCallback(() => {
        clearToken();
        setStatus('unlicensed');
        setSchoolInfo(null);
        setError(null);
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    }, []);

    // ── Initial Check + Heartbeat ────────────────────────────────────────────
    useEffect(() => {
        verifyToken();

        // Setup heartbeat setiap 10 menit
        heartbeatRef.current = setInterval(() => {
            verifyToken(true); // silent = tidak tampilkan error
        }, HEARTBEAT_INTERVAL_MS);

        return () => {
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        };
    }, [verifyToken]);

    return {
        status,           // 'checking' | 'licensed' | 'unlicensed'
        isLicensed: status === 'licensed',
        isChecking: status === 'checking',
        schoolInfo,
        error,
        isActivating,
        activateLicense,
        deactivateLicense,
        formatLicenseKeyInput,
    };
}
