'use client';
// app/play/page.js
// Halaman game utama.
// - User LICENSED   → semua fitur tersedia
// - User UNLICENSED → pilih: aktivasi lisensi ATAU lanjut mode FREE (fitur terbatas)

import { useState, useEffect } from 'react';
import { useLicense } from '@/hooks/useLicense';
import GameContainer from '@/components/GameContainer';
import LicenseGate from '@/components/LicenseGate';
import { motion } from 'framer-motion';
import { ShieldCheck, Loader2, Lock, X } from 'lucide-react';

export default function PlayPage() {
    const {
        isLicensed,
        isChecking,
        schoolInfo,
        error,
        isActivating,
        activateLicense,
        formatLicenseKeyInput,
    } = useLicense();

    // State: apakah user memilih lanjut tanpa lisensi
    // Di-persist ke sessionStorage agar tidak hilang saat navigasi di Android
    const [skipLicense, setSkipLicense] = useState(() => {
        if (typeof window === 'undefined') return false;
        return sessionStorage.getItem('license_skip') === 'true';
    });

    const handleSkipLicense = (value) => {
        setSkipLicense(value);
        if (typeof window !== 'undefined') {
            if (value) {
                sessionStorage.setItem('license_skip', 'true');
            } else {
                sessionStorage.removeItem('license_skip');
            }
        }
    };

    // Jika sudah licensed, bersihkan flag skip dari sessionStorage
    // (tidak perlu setSkipLicense — jika isLicensed=true, choice screen tidak muncul)
    useEffect(() => {
        if (isLicensed && typeof window !== 'undefined') {
            sessionStorage.removeItem('license_skip');
        }
    }, [isLicensed]);

    // 1. Loading / memverifikasi token
    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1b2e 100%)' }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4 text-white/60"
                >
                    <Loader2 size={40} className="animate-spin text-blue-400" />
                    <p className="text-sm tracking-widest uppercase">Memverifikasi Lisensi...</p>
                </motion.div>
            </div>
        );
    }

    // 2. Belum berlisensi DAN belum memilih skip → tampilkan pilihan
    if (!isLicensed && !skipLicense) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1b2e 50%, #0a0a1a 100%)' }}
            >
                {/* Background blobs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                            backgroundSize: '40px 40px'
                        }}
                    />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="relative z-10 w-full max-w-md mx-4 flex flex-col gap-4"
                >
                    {/* LicenseGate form — mode compact agar tidak full-screen */}
                    <LicenseGate
                        onActivate={activateLicense}
                        isActivating={isActivating}
                        error={error}
                        formatKey={formatLicenseKeyInput}
                        compact
                    />

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-white/30 text-xs font-semibold uppercase tracking-widest">atau</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Tombol lanjut tanpa lisensi */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSkipLicense(true)}
                        className="w-full py-3.5 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2.5 border border-white/10 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70 transition-all"
                    >
                        <Lock size={15} className="text-orange-400/70" />
                        Lanjutkan tanpa lisensi
                        <span className="text-[10px] bg-orange-500/10 border border-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full font-semibold">
                            FREE
                        </span>
                    </motion.button>

                    {/* Info fitur FREE */}
                    <div className="bg-orange-500/5 border border-orange-500/15 rounded-xl p-3.5 flex flex-col gap-1.5">
                        <p className="text-[11px] font-bold text-orange-300/70 uppercase tracking-widest mb-0.5">Mode FREE — Fitur Terbatas:</p>
                        <div className="flex flex-col gap-1">
                            {[
                                'Maksimal 1 player',
                                'Cup Mode tidak tersedia',
                                'Generate soal dengan AI tidak tersedia',
                            ].map((item) => (
                                <div key={item} className="flex items-center gap-2 text-white/40 text-xs">
                                    <X size={11} className="text-red-400/60 shrink-0" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    // 3. Sudah berlisensi ATAU user memilih skip → tampilkan game
    return (
        <main className="min-h-screen relative">
            {/* Badge Licensed — hanya tampil jika sudah berlisensi */}
            {isLicensed && schoolInfo && (
                <div className="fixed top-5 right-20 z-50 flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full pointer-events-none">
                    <ShieldCheck size={12} className="text-green-400" />
                    <span className="text-[10px] font-semibold text-green-300/80">
                        {schoolInfo.name}
                    </span>
                </div>
            )}

            {/* Game — isLicensed menentukan fitur yang tersedia */}
            <GameContainer isLicensed={isLicensed} />
        </main>
    );
}
