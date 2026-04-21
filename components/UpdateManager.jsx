'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Download, CheckCircle, Smartphone } from 'lucide-react';

export default function UpdateManager() {
    const [isNative, setIsNative] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, checking, downloading, ready
    const [downloadedId, setDownloadedId] = useState(null);

    useEffect(() => {
        // Hanya jalankan di perangkat Native Android/iOS via Capacitor
        if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform()) {
            setIsNative(true);
            
            const initUpdater = async () => {
                try {
                    const { CapacitorUpdater } = await import('@capgo/capacitor-updater');
                    // Beri tahu Capgo bahwa app berjalan lancar (mencegah auto-rollback)
                    await CapacitorUpdater.notifyAppReady();
                    
                    // Listener jika ada update selesai didownload otomatis di background
                    CapacitorUpdater.addListener('download', (info) => {
                        if (info) {
                            const newId = info.id || info.version || info.bundle?.id || info.bundle?.version;
                            if (newId) setDownloadedId(newId);
                            setStatus('ready');
                        }
                    });
                } catch (e) {
                    console.error("[Updater] Init Error:", e);
                }
            };
            initUpdater();
        }
    }, []);

    const performUpdate = async () => {
        if (!isNative) return;
        setStatus('checking');
        
        try {
            const { CapacitorUpdater } = await import('@capgo/capacitor-updater');
            
            // Cek versi terbaru dari Capgo server
            const latest = await CapacitorUpdater.getLatest();
            
            // Download versi tersebut
            const bundle = await CapacitorUpdater.download({
                version: latest.version,
                url: latest.url
            });
            
            if (bundle && (bundle.id || bundle.version)) {
                setDownloadedId(bundle.id || bundle.version);
                setStatus('ready');
            } else {
                setStatus('idle');
                alert("Aplikasi sudah versi terbaru!");
            }
        } catch (e) {
            console.error("[Updater] Download Error:", e);
            setStatus('idle');
            // Capgo melempar error spesifik jika sudah terbaru
            if (e.message === 'No new version available' || e.message?.includes('already')) {
                alert("Aplikasi sudah versi terbaru!");
            } else {
                alert("Gagal cek update: " + (e.message || "Tolong cek koneksi internet."));
            }
        }
    };

    const applyUpdate = async () => {
        try {
            const { CapacitorUpdater } = await import('@capgo/capacitor-updater');
            // Set update akan mereboot aplikasi ke versi terbaru
            if (downloadedId) {
                await CapacitorUpdater.set({ id: downloadedId });
            } else {
                await CapacitorUpdater.reload();
            }
        } catch (e) {
            // Bisa kosongkan karena kadang merestart app sebelum promise resolve
            console.error("Gagal apply update", e);
        }
    };

    if (!isNative) return null; // Jangan tampilkan tombol di web browser biasa

    return (
        <div className="fixed bottom-4 left-4 z-[999] flex flex-col gap-2">
            <AnimatePresence mode="wait">
                {status === 'ready' ? (
                    <motion.div
                        key="ready"
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="bg-green-600/90 text-white px-4 py-3 rounded-xl shadow-2xl border border-green-400 flex items-center gap-3 backdrop-blur-md"
                    >
                        <CheckCircle size={18} />
                        <div className="flex flex-col">
                            <span className="text-xs font-bold uppercase tracking-wider">Update Tersedia</span>
                            <span className="text-[10px] text-green-100">Siap dipasang sekarang</span>
                        </div>
                        <button
                            onClick={applyUpdate}
                            className="ml-2 bg-white text-green-700 px-3 py-1.5 rounded-lg text-xs font-black shadow-md active:scale-95 transition-transform"
                        >
                            RESTART
                        </button>
                    </motion.div>
                ) : (
                    <motion.button
                        key="check"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={performUpdate}
                        disabled={status === 'checking'}
                        className="bg-black/60 hover:bg-black/80 text-white/70 hover:text-white p-3 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.3)] border border-white/10 transition-all backdrop-blur-md flex items-center justify-center self-start"
                        title="Cek Update Aplikasi"
                    >
                        {status === 'checking' ? (
                            <RefreshCw size={20} className="animate-spin text-blue-400" />
                        ) : (
                            <Download size={20} />
                        )}
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}
