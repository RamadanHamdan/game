'use client';

/**
 * UpdateManager — Cek update otomatis saat app dibuka.
 * Status:
 *   idle        → tombol download manual
 *   checking    → spinner kecil (cek koneksi & versi)
 *   offline     → toast "Tidak ada koneksi" (auto-hilang 3 detik)
 *   uptodate    → toast "Sudah versi terbaru" (auto-hilang 3 detik)
 *   error       → toast "Gagal cek update" (auto-hilang 3 detik)
 *   downloading → progress bar
 *   applying    → progress "Menerapkan..."
 *   done        → toast "Update selesai!" (auto-hilang 2 detik)
 *
 * Catatan: Cek koneksi hanya pakai navigator.onLine — fetch ke endpoint
 * eksternal sering diblokir Android WebView (Network Security Policy / CORS).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Download, CheckCircle, WifiOff, ShieldCheck, AlertCircle } from 'lucide-react';

// ── Komponen Toast ──────────────────────────────────────────────────────────
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

export default function UpdateManager() {
    const [isNative, setIsNative] = useState(false);
    // status: idle | checking | offline | uptodate | error | downloading | applying | done
    const [status, setStatus] = useState('idle');
    const isRunning = useRef(false);
    const toastTimer = useRef(null);

    // ── Auto-reset toast ke idle setelah delay ───────────────────────────────
    const scheduleReset = useCallback((delay = 3000) => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => {
            setStatus('idle');
        }, delay);
    }, []);

    // ── Cek koneksi internet secara ringan ──────────────────────────────────
    const isOnline = async () => {
        if (!navigator.onLine) return false;
        try {
            await fetch('https://connectivitycheck.gstatic.com/generate_204', {
                method: 'HEAD',
                cache: 'no-cache',
                signal: AbortSignal.timeout(4000),
            });
            return true;
        } catch {
            return false;
        }
    };

    // ── Core: cek + download + apply ────────────────────────────────────────
    const checkAndApplyUpdate = useCallback(async () => {
        if (isRunning.current) return;
        isRunning.current = true;

        try {
            // 1. Cek koneksi — hanya pakai navigator.onLine
            //    (fetch ke endpoint eksternal sering diblokir Android WebView)
            setStatus('checking');
            if (!navigator.onLine) {
                console.log('[Updater] navigator.onLine = false — skip.');
                setStatus('offline');
                scheduleReset(3000);
                return;
            }

            const { CapacitorUpdater } = await import('@capgo/capacitor-updater');

            // 2. Cek versi terbaru dari Capgo
            //    Jika benar-benar offline, getLatest() akan throw → ditangkap di bawah
            let latest;
            try {
                latest = await CapacitorUpdater.getLatest();
            } catch (e) {
                const msg = e?.message?.toLowerCase() ?? '';
                // Deteksi error jaringan vs rate_limit/sudah terbaru
                if (
                    msg.includes('network') ||
                    msg.includes('failed to fetch') ||
                    msg.includes('timeout') ||
                    msg.includes('econnrefused') ||
                    msg.includes('unable to resolve')
                ) {
                    console.log('[Updater] Network error:', e.message);
                    setStatus('offline');
                } else {
                    // Rate limit atau tidak ada update baru
                    console.log('[Updater] getLatest info:', e?.message);
                    setStatus('uptodate');
                }
                scheduleReset(3000);
                return;
            }

            // 3. Tidak ada URL update → sudah versi terbaru
            if (!latest?.url || !latest?.version) {
                console.log('[Updater] Sudah versi terbaru.');
                setStatus('uptodate');
                scheduleReset(3000);
                return;
            }

            console.log('[Updater] Update tersedia:', latest.version);

            // 4. Download bundle baru
            setStatus('downloading');
            let bundle;
            try {
                bundle = await CapacitorUpdater.download({
                    version: latest.version,
                    url: latest.url,
                });
            } catch (e) {
                console.error('[Updater] Download error:', e);
                setStatus('error');
                scheduleReset(3000);
                return;
            }

            if (!bundle?.id && !bundle?.version) {
                console.warn('[Updater] Bundle tidak valid setelah download.');
                setStatus('error');
                scheduleReset(3000);
                return;
            }

            // 5. Apply update — app akan restart otomatis
            setStatus('applying');
            console.log('[Updater] Menerapkan update:', bundle.id || bundle.version);

            await new Promise(r => setTimeout(r, 800));
            await CapacitorUpdater.set({ id: bundle.id || bundle.version });

            // Jika set() tidak merestart (kasus edge), tampilkan done lalu reset
            setStatus('done');
            scheduleReset(2000);
        } catch (e) {
            console.error('[Updater] Error tak terduga:', e);
            setStatus('error');
            scheduleReset(3000);
        } finally {
            isRunning.current = false;
        }
    }, [scheduleReset]);

    // ── Init saat mount ─────────────────────────────────────────────────────
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!window.Capacitor?.isNativePlatform()) return;

        setIsNative(true);

        const init = async () => {
            try {
                const { CapacitorUpdater } = await import('@capgo/capacitor-updater');
                await CapacitorUpdater.notifyAppReady();
            } catch (e) {
                console.error('[Updater] notifyAppReady error:', e);
            }
            await checkAndApplyUpdate();
        };

        init();

        return () => {
            if (toastTimer.current) clearTimeout(toastTimer.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Tidak tampilkan apapun di browser / web biasa
    if (!isNative) return null;

    // ── UI ──────────────────────────────────────────────────────────────────
    return (
        <div className="fixed bottom-4 left-4 z-[999]">
            <AnimatePresence mode="wait">

                {/* IDLE — tombol cek update manual */}
                {status === 'idle' && (
                    <motion.button
                        key="idle"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={checkAndApplyUpdate}
                        className="bg-black/50 hover:bg-black/70 text-white/50 hover:text-white/90 p-2.5 rounded-full shadow-lg border border-white/10 transition-all backdrop-blur-md flex items-center justify-center"
                        title="Cek Update"
                    >
                        <Download size={16} />
                    </motion.button>
                )}

                {/* CHECKING — spinner */}
                {status === 'checking' && (
                    <motion.div
                        key="checking"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-black/50 text-white/70 p-2.5 rounded-full border border-white/10 backdrop-blur-md flex items-center justify-center"
                        title="Memeriksa update..."
                    >
                        <RefreshCw size={16} className="animate-spin" />
                    </motion.div>
                )}

                {/* OFFLINE */}
                {status === 'offline' && (
                    <Toast
                        key="offline"
                        icon={<WifiOff size={14} className="shrink-0" />}
                        message="Tidak ada koneksi internet"
                        colorClass="bg-slate-700/90"
                        borderClass="border-slate-500/50"
                    />
                )}

                {/* UP TO DATE */}
                {status === 'uptodate' && (
                    <Toast
                        key="uptodate"
                        icon={<ShieldCheck size={14} className="shrink-0 text-green-300" />}
                        message="Aplikasi sudah versi terbaru"
                        colorClass="bg-slate-800/90"
                        borderClass="border-slate-600/50"
                    />
                )}

                {/* ERROR */}
                {status === 'error' && (
                    <Toast
                        key="error"
                        icon={<AlertCircle size={14} className="shrink-0 text-red-300" />}
                        message="Gagal cek update, coba lagi"
                        colorClass="bg-red-700/90"
                        borderClass="border-red-500/50"
                    />
                )}

                {/* DOWNLOADING / APPLYING */}
                {(status === 'downloading' || status === 'applying') && (
                    <motion.div
                        key="progress"
                        initial={{ opacity: 0, scale: 0.8, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2 bg-blue-600/90 text-white px-3 py-2 rounded-xl shadow-xl border border-blue-400/50 backdrop-blur-md"
                    >
                        <RefreshCw size={14} className="animate-spin shrink-0" />
                        <span className="text-[11px] font-semibold">
                            {status === 'downloading' ? 'Mengunduh update...' : 'Menerapkan update...'}
                        </span>
                    </motion.div>
                )}

                {/* DONE */}
                {status === 'done' && (
                    <Toast
                        key="done"
                        icon={<CheckCircle size={14} className="shrink-0" />}
                        message="Update selesai! App akan restart"
                        colorClass="bg-green-600/90"
                        borderClass="border-green-400/50"
                    />
                )}

            </AnimatePresence>
        </div>
    );
}
