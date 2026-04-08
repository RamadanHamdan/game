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
 * Capacitor inject window.Capacitor object
 */
function isCapacitorApp() {
    return typeof window !== 'undefined' && 
        (window.Capacitor !== undefined || window.location.protocol === 'file:' || window.location.hostname === 'localhost' && window.__capacitor);
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
            let data;

            if (isCapacitorApp()) {
                // Android: langsung ke Supabase, tanpa API route
                const { activateLicenseDirect } = await import('@/lib/licenseClientDirect');
                data = await activateLicenseDirect(rawKey, fingerprint);
            } else {
                // Web: via API route
                const res = await fetch('/api/license/activate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: rawKey.replace(/-/g, ''), fingerprint }),
                });
                data = await res.json();
            }

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
            const msg = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
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
