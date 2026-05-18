'use client';
// hooks/useLicense.js
// Menggunakan licenseClientDirect.js — langsung ke Supabase REST
// Kompatibel dengan Android APK (static export) dan Web

import { useState, useEffect, useCallback } from 'react';
import {
    saveToken,
    getToken,
    getLicenseInfo,
    clearToken,
    getBrowserFingerprint,
    formatLicenseKeyInput,
    LICENSE_TOKEN_KEY,
    LICENSE_INFO_KEY,
} from '@/lib/licenseClient';
import { activateLicenseDirect } from '@/lib/licenseClientDirect';
import { jwtVerify } from 'jose';

const JWT_SECRET_RAW = process.env.NEXT_PUBLIC_LICENSE_JWT_SECRET || 'fallback-dev-secret';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_RAW);

// Verifikasi token JWT di client-side (tanpa server)
async function verifyTokenLocally(token) {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return { valid: true, payload };
    } catch {
        return { valid: false };
    }
}

export function useLicense() {
    const [isLicensed, setIsLicensed]   = useState(false);
    const [isChecking, setIsChecking]   = useState(true);
    const [isActivating, setIsActivating] = useState(false);
    const [schoolInfo, setSchoolInfo]   = useState(null);
    const [error, setError]             = useState('');

    // Cek token yang sudah tersimpan di localStorage
    useEffect(() => {
        async function checkExistingToken() {
            try {
                const token = getToken();
                if (!token) {
                    setIsChecking(false);
                    return;
                }

                // Verifikasi JWT secara lokal (tidak butuh network)
                const { valid, payload } = await verifyTokenLocally(token);
                if (valid && payload) {
                    setIsLicensed(true);
                    setSchoolInfo({
                        name: payload.schoolName,
                        type: payload.licenseType,
                    });
                } else {
                    // Token expired atau invalid — hapus
                    clearToken();
                }
            } catch (e) {
                console.error('[useLicense] checkExistingToken error:', e);
                clearToken();
            } finally {
                setIsChecking(false);
            }
        }

        checkExistingToken();
    }, []);

    // Aktivasi lisensi — langsung ke Supabase (bukan API route)
    const activate = useCallback(async (rawKey) => {
        setIsActivating(true);
        setError('');

        try {
            const fingerprint = getBrowserFingerprint();
            console.log('[useLicense] Activating with fingerprint:', fingerprint);

            // Langsung ke Supabase REST — bekerja di Android & Web
            const result = await activateLicenseDirect(rawKey, fingerprint);

            if (!result.success) {
                setError(result.error || 'Aktivasi gagal.');
                return false;
            }

            // Simpan token ke localStorage
            saveToken(result.token, result.school);
            setIsLicensed(true);
            setSchoolInfo(result.school);
            return true;

        } catch (e) {
            console.error('[useLicense] activate error:', e);

            // Deteksi jenis error untuk pesan yang lebih helpful
            if (e.message?.includes('Failed to fetch') || e.message?.includes('fetch')) {
                setError('Koneksi gagal. Pastikan perangkat terhubung ke internet.');
            } else if (e.message?.includes('SUPABASE')) {
                setError('Konfigurasi server bermasalah. Hubungi administrator.');
            } else {
                setError(e.message || 'Terjadi kesalahan. Coba lagi.');
            }
            return false;
        } finally {
            setIsActivating(false);
        }
    }, []);

    const logout = useCallback(() => {
        clearToken();
        setIsLicensed(false);
        setSchoolInfo(null);
        setError('');
    }, []);

    return {
        isLicensed,
        isChecking,
        isActivating,
        schoolInfo,
        error,
        activate,
        logout,
        formatKey: formatLicenseKeyInput,
    };
}