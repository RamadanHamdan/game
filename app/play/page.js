'use client';
// app/play/page.js

import { useLicense } from '@/hooks/useLicense';
import GameContainer from '@/components/GameContainer';
import LicenseGate from '@/components/LicenseGate';
import { motion } from 'framer-motion';
import { ShieldCheck, Loader2 } from 'lucide-react';

export default function PlayPage() {
    const {
        isLicensed,
        isChecking,
        isActivating,
        schoolInfo,
        error,
        activateLicense,
        formatKey,
    } = useLicense();

    // 1. Loading — verifikasi token lokal
    if (isChecking) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
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

    // 2. Belum berlisensi — tampilkan LicenseGate
    if (!isLicensed) {
        return (
            <LicenseGate
                onActivate={activateLicense}
                isActivating={isActivating}
                error={error}
                formatKey={formatKey}
            />
        );
    }

    // 3. Sudah berlisensi — tampilkan game
    return (
        <main className="min-h-screen relative">
            {schoolInfo && (
                <div className="fixed top-5 right-20 z-50 flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full pointer-events-none">
                    <ShieldCheck size={12} className="text-green-400" />
                    <span className="text-[10px] font-semibold text-green-300/80">
                        {schoolInfo.name}
                    </span>
                </div>
            )}
            <GameContainer isLicensed={isLicensed} />
        </main>
    );
}