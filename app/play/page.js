'use client';
// app/play/page.js
// Halaman game utama.
// Jika isLicensed, maka semua fitur terbuka di dalam komponen GameContainer.

import { useLicense } from '@/hooks/useLicense';
import GameContainer from '@/components/GameContainer';
import { motion } from 'framer-motion';
import { ShieldCheck, Loader2 } from 'lucide-react';
import LicenseGate from '@/components/LicenseGate';
import { useState } from 'react';

export default function PlayPage() {
    const {
        isLicensed,
        isChecking,
        schoolInfo,
    } = useLicense();

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
