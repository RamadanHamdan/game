// lib/licenseClient.js
// CLIENT-SIDE helpers — aman untuk diimport di browser
// Berisi: localStorage token management, browser fingerprint

export const LICENSE_TOKEN_KEY = 'edu_license_token';
export const LICENSE_INFO_KEY = 'edu_license_info';

// ── Browser Fingerprint ───────────────────────────────────────────────────────
// Kombinasi beberapa properti browser untuk membuat ID "unik" per device
// Bukan 100% unik, tapi cukup untuk mencegah sharing key antar beda sekolah
export function getBrowserFingerprint() {
    if (typeof window === 'undefined') return 'server';

    const components = [
        navigator.userAgent,
        navigator.language,
        screen.colorDepth,
        `${screen.width}x${screen.height}`,
        new Date().getTimezoneOffset(),
        navigator.hardwareConcurrency || 0,
        navigator.platform || '',
    ].join('|');

    // Simple djb2 hash (tidak perlu kriptografi kuat di sini)
    let hash = 5381;
    for (let i = 0; i < components.length; i++) {
        hash = ((hash << 5) + hash) + components.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

// ── Token Storage ─────────────────────────────────────────────────────────────
export function saveToken(token, info) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LICENSE_TOKEN_KEY, token);
    if (info) localStorage.setItem(LICENSE_INFO_KEY, JSON.stringify(info));
}

export function getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(LICENSE_TOKEN_KEY);
}

export function getLicenseInfo() {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(LICENSE_INFO_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function clearToken() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(LICENSE_TOKEN_KEY);
    localStorage.removeItem(LICENSE_INFO_KEY);
}

// ── Format Key Input ──────────────────────────────────────────────────────────
// Auto-format saat user mengetik: XXXX-XXXX-XXXX-XXXX
export function formatLicenseKeyInput(raw) {
    // Ambil hanya alfanumerik
    const cleaned = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    // Bagi jadi chunk 4 karakter
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.slice(0, 4).join('-');
}
