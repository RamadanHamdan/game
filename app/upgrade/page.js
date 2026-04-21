'use client';

import { useLicense } from '@/hooks/useLicense';
import LicenseGate from '@/components/LicenseGate';
import { motion } from 'framer-motion';
import { Loader2, StepBackIcon, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Lock, X } from 'lucide-react';

export default function UpgradePage() {
    const router = useRouter();
    const {
        isLicensed,
        isChecking,
        error,
        isActivating,
        activateLicense,
        formatLicenseKeyInput,
    } = useLicense();

    const [skipLicense, setSkipLicense] = useState(false);

    const handleSkipLicense = (skip) => {
        setSkipLicense(skip);
    };

    useEffect(() => {
        // Jika sedang tidak checking dan status lisensi menjadi aktif atau user skip,
        // langsung arahkan ke Player Registration (/play)
        if (!isChecking && (isLicensed || skipLicense)) {
            router.push('/play');
        }
    }, [isLicensed, skipLicense, isChecking, router]);

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
                        onClick={() => router.push('/play')}
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

    // Fallback UI saat sedang diarahkan (redirect) ke /play 
    // setelah lisensi aktif atau user menekan skip.
    return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a1a' }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 text-white/60"
            >
                <Loader2 size={24} className="animate-spin text-blue-400" />
                <p className="text-sm tracking-widest uppercase">Mengarahkan...</p>
            </motion.div>
        </div>
    );
}
