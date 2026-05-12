'use client';

/**
 * UpdateManager — Self-hosted OTA update via Supabase Storage.
 *
 * v3 — Fix untuk Android 13 IFP:
 *   - Menggunakan CapacitorHttp (native Java HTTP) untuk bypass WebView restrictions
 *   - Fallback ke fetch() biasa jika CapacitorHttp tidak tersedia
 *   - Tidak pakai navigator.onLine, HEAD probe, atau AbortSignal.timeout()
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Download, CheckCircle, WifiOff, ShieldCheck, AlertCircle } from 'lucide-react';

// ── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const BUCKET = 'app-bundles';
const VERSION_FILE = 'version.json';
const VERSION_CHECK_URL = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${VERSION_FILE}`;

// ── Toast ───────────────────────────────────────────────────────────────────
function Toast({ icon, message, colorClass, borderClass }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 4 }}
            className={`flex items-center gap-2 ${colorClass} text-white px-3 py-2 rounded-xl shadow-xl border ${borderClass} backdrop-blur-md`}
        >
            {icon}
            <span className="text-[11px] font-semibold whitespace-nowrap">{message}</span>
        </motion.div>
    );
}

// ── Semver comparison ───────────────────────────────────────────────────────
function isNewer(remote, current) {
    if (!remote || !/\d/.test(remote)) return false;
    if (!current || current === 'builtin' || current === '0.0.0') return true;

    const parse = (v) =>
        String(v).replace(/[^0-9.]/g, '').split('.').map((n) => parseInt(n, 10) || 0);
    const av = parse(remote);
    const bv = parse(current);
    for (let i = 0; i < Math.max(av.length, bv.length); i++) {
        if ((av[i] ?? 0) > (bv[i] ?? 0)) return true;
        if ((av[i] ?? 0) < (bv[i] ?? 0)) return false;
    }
    return false;
}

/**
 * Fetch JSON menggunakan native HTTP (CapacitorHttp) jika tersedia,
 * fallback ke fetch() biasa.
 *
 * CapacitorHttp menggunakan Java native HttpURLConnection/OkHttp,
 * yang BYPASS semua WebView restrictions:
 *   - Tidak ada CORS
 *   - Tidak ada mixed-content block
 *   - Menggunakan system certificate store
 *   - Bekerja di semua Android WebView version
 */
async function nativeFetch(url) {
    // 1. Coba CapacitorHttp (native, paling reliable di Android)
    try {
        const { CapacitorHttp } = await import('@capacitor/core');
        if (CapacitorHttp && CapacitorHttp.get) {
            console.log('[OTA] Menggunakan CapacitorHttp (native)');
            const response = await CapacitorHttp.get({
                url: url,
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                },
                connectTimeout: 15000,
                readTimeout: 15000,
            });

            console.log('[OTA] CapacitorHttp status:', response.status);

            if (response.status >= 200 && response.status < 300) {
                // response.data sudah di-parse jika content-type JSON
                const data = typeof response.data === 'string'
                    ? JSON.parse(response.data)
                    : response.data;
                return { ok: true, data };
            }
            return { ok: false, status: response.status, error: `HTTP ${response.status}` };
        }
    } catch (e) {
        console.warn('[OTA] CapacitorHttp gagal, fallback ke fetch:', e.message);
    }

    // 2. Fallback ke fetch() biasa (untuk web / jika CapacitorHttp tidak ada)
    try {
        console.log('[OTA] Menggunakan fetch() biasa');
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);

        const res = await fetch(url, {
            method: 'GET',
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache, no-store', 'Pragma': 'no-cache' },
            signal: controller.signal,
        });
        clearTimeout(timer);

        if (!res.ok) {
            return { ok: false, status: res.status, error: `HTTP ${res.status}` };
        }

        const text = await res.text();
        const data = JSON.parse(text);
        return { ok: true, data };
    } catch (e) {
        console.error('[OTA] fetch() juga gagal:', e.message);
        return { ok: false, error: e.message, isNetworkError: true };
    }
}

export default function UpdateManager() {
    const [isNative, setIsNative] = useState(false);
    const [status, setStatus] = useState('idle');
    const [errorDetail, setErrorDetail] = useState('');
    const isRunning = useRef(false);
    const toastTimer = useRef(null);

    const scheduleReset = useCallback((delay = 3500) => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setStatus('idle'), delay);
    }, []);

    const checkAndApplyUpdate = useCallback(async () => {
        if (isRunning.current) return;
        isRunning.current = true;
        setErrorDetail('');

        try {
            setStatus('checking');
            console.log('[OTA] ═══════════════════════════════════');
            console.log('[OTA] Cek update dimulai');
            console.log('[OTA] Target:', VERSION_CHECK_URL);

            // ── 1. Import Capacitor Updater ─────────────────────────────────
            const { CapacitorUpdater } = await import('@capgo/capacitor-updater');

            // ── 2. Versi saat ini ───────────────────────────────────────────
            let currentVersion = 'builtin';
            try {
                const info = await CapacitorUpdater.current();
                currentVersion = info?.bundle?.version || 'builtin';
            } catch (e) {
                console.warn('[OTA] Gagal baca versi aktif:', e.message);
            }
            console.log('[OTA] Versi aktif:', currentVersion);

            // ── 3. Fetch version.json via native HTTP ───────────────────────
            const cacheBuster = `${VERSION_CHECK_URL}?t=${Date.now()}`;
            const result = await nativeFetch(cacheBuster);

            if (!result.ok) {
                if (result.isNetworkError) {
                    console.log('[OTA] ❌ Network error — device offline');
                    setStatus('offline');
                } else {
                    console.warn('[OTA] ❌ Server error:', result.error);
                    setErrorDetail(result.error || 'Server error');
                    setStatus('error');
                }
                scheduleReset(4000);
                return;
            }

            const remote = result.data;
            console.log('[OTA] ✓ Response:', JSON.stringify(remote));

            // ── 4. Validasi ─────────────────────────────────────────────────
            const { version: remoteVersion, url: bundleUrl } = remote || {};

            if (!remoteVersion || !bundleUrl) {
                console.warn('[OTA] Data tidak lengkap');
                setErrorDetail('Data update tidak lengkap');
                setStatus('error');
                scheduleReset(4000);
                return;
            }

            if (!/\d/.test(remoteVersion)) {
                console.warn('[OTA] Versi tidak valid:', remoteVersion);
                setErrorDetail(`Versi "${remoteVersion}" tidak valid`);
                setStatus('error');
                scheduleReset(4000);
                return;
            }

            // ── 5. Bandingkan ───────────────────────────────────────────────
            const newer = isNewer(remoteVersion, currentVersion);
            console.log(`[OTA] Perbandingan: "${remoteVersion}" vs "${currentVersion}" → newer=${newer}`);

            if (!newer) {
                console.log('[OTA] ✓ Sudah versi terbaru');
                setStatus('uptodate');
                scheduleReset(3000);
                return;
            }

            console.log(`[OTA] ⬆ Update tersedia: ${currentVersion} → ${remoteVersion}`);

            // ── 6. Download ─────────────────────────────────────────────────
            setStatus('downloading');
            let bundle;
            try {
                bundle = await CapacitorUpdater.download({
                    url: bundleUrl,
                    version: remoteVersion,
                });
                console.log('[OTA] ✓ Download OK:', JSON.stringify(bundle));
            } catch (e) {
                console.error('[OTA] ❌ Download gagal:', e);
                setErrorDetail('Download gagal');
                setStatus('error');
                scheduleReset(4000);
                return;
            }

            if (!bundle?.id && !bundle?.version) {
                setErrorDetail('Bundle tidak valid');
                setStatus('error');
                scheduleReset(4000);
                return;
            }

            // ── 7. Apply ────────────────────────────────────────────────────
            setStatus('applying');
            console.log('[OTA] Menerapkan...');
            await new Promise(r => setTimeout(r, 800));
            await CapacitorUpdater.set(bundle);

            setStatus('done');
            scheduleReset(2000);
        } catch (e) {
            console.error('[OTA] Fatal:', e);
            setErrorDetail(e.message || 'Error');
            setStatus('error');
            scheduleReset(4000);
        } finally {
            isRunning.current = false;
            console.log('[OTA] ═══════════════════════════════════');
        }

        
    }, [scheduleReset]);

    // ── Init ────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!window.Capacitor?.isNativePlatform()) return;

        setIsNative(true);

        const init = async () => {
            try {
                const { CapacitorUpdater } = await import('@capgo/capacitor-updater');
                await CapacitorUpdater.notifyAppReady();
                console.log('[OTA] notifyAppReady ✓');
            } catch (e) {
                console.error('[OTA] notifyAppReady error:', e);
            }
            setTimeout(() => checkAndApplyUpdate(), 3000);
        };

        init();

        const onResume = () => checkAndApplyUpdate();
        document.addEventListener('resume', onResume);

        return () => {
            if (toastTimer.current) clearTimeout(toastTimer.current);
            document.removeEventListener('resume', onResume);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!isNative) return null;

    return (
        <div className="fixed bottom-4 left-4 z-[999]">
            <AnimatePresence mode="wait">
                {status === 'idle' && (
                    <motion.button key="idle"
                        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                        onClick={checkAndApplyUpdate}
                        className="bg-black/50 hover:bg-black/70 text-white/50 hover:text-white/90 p-2.5 rounded-full shadow-lg border border-white/10 transition-all backdrop-blur-md flex items-center justify-center"
                        title="Cek Update">
                        <Download size={16} />
                    </motion.button>
                )}
                {status === 'checking' && (
                    <motion.div key="checking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="bg-black/50 text-white/70 p-2.5 rounded-full border border-white/10 backdrop-blur-md flex items-center justify-center">
                        <RefreshCw size={16} className="animate-spin" />
                    </motion.div>
                )}
                {status === 'offline' && (
                    <Toast key="offline" icon={<WifiOff size={14} className="shrink-0" />}
                        message="Tidak ada koneksi internet" colorClass="bg-slate-700/90" borderClass="border-slate-500/50" />
                )}
                {status === 'uptodate' && (
                    <Toast key="uptodate" icon={<ShieldCheck size={14} className="shrink-0 text-green-300" />}
                        message="Aplikasi sudah versi terbaru" colorClass="bg-slate-800/90" borderClass="border-slate-600/50" />
                )}
                {status === 'error' && (
                    <Toast key="error" icon={<AlertCircle size={14} className="shrink-0 text-red-300" />}
                        message={errorDetail || "Gagal cek update"} colorClass="bg-red-700/90" borderClass="border-red-500/50" />
                )}
                {(status === 'downloading' || status === 'applying') && (
                    <motion.div key="progress"
                        initial={{ opacity: 0, scale: 0.8, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2 bg-blue-600/90 text-white px-3 py-2 rounded-xl shadow-xl border border-blue-400/50 backdrop-blur-md">
                        <RefreshCw size={14} className="animate-spin shrink-0" />
                        <span className="text-[11px] font-semibold">
                            {status === 'downloading' ? 'Mengunduh update...' : 'Menerapkan update...'}
                        </span>
                    </motion.div>
                )}
                {status === 'done' && (
                    <Toast key="done" icon={<CheckCircle size={14} className="shrink-0" />}
                        message="Update selesai! App akan restart" colorClass="bg-green-600/90" borderClass="border-green-400/50" />
                )}
            </AnimatePresence>
        </div>
    );
}