'use client';
// components/LicenseGate.jsx
// Layar aktivasi lisensi premium — ditampilkan saat app belum dilisensikan

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Key, Loader2, AlertCircle, CheckCircle2, Lock, BookOpen } from 'lucide-react';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'EduQuiz';

export default function LicenseGate({ onActivate, isActivating, error, formatKey }) {
    const [inputKey, setInputKey] = useState('');
    const [localError, setLocalError] = useState('');

    const handleKeyChange = (e) => {
        const formatted = formatKey(e.target.value);
        setInputKey(formatted);
        setLocalError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const raw = inputKey.replace(/-/g, '');
        if (raw.length !== 16) {
            setLocalError('Kode lisensi harus terdiri dari 16 karakter (format: XXXX-XXXX-XXXX-XXXX)');
            return;
        }
        await onActivate(inputKey);
    };

    const displayError = localError || error;

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1b2e 50%, #0a0a1a 100%)' }}
        >
            {/* Animated background blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-pulse"
                    style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-600/5 rounded-full blur-3xl" />
                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative z-10 w-full max-w-md mx-4"
            >
                {/* Card */}
                <div className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
                    style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)' }}
                >
                    {/* Header banner */}
                    <div className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 border-b border-white/10 p-6 flex flex-col items-center gap-3">
                        <motion.div
                            animate={{ rotate: [0, -5, 5, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30"
                        >
                            <ShieldCheck size={32} className="text-white" />
                        </motion.div>

                        <div className="text-center">
                            <div className="flex items-center gap-2 justify-center mb-1">
                                <BookOpen size={16} className="text-blue-300" />
                                <span className="text-blue-300 text-sm font-semibold tracking-widest uppercase">
                                    {APP_NAME}
                                </span>
                            </div>
                            <h1 className="text-2xl font-black text-white">Aktivasi Lisensi</h1>
                            <p className="text-white/50 text-sm mt-1">
                                Diperlukan lisensi untuk menggunakan aplikasi ini
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-white/60 uppercase tracking-widest flex items-center gap-1.5">
                                <Key size={12} /> Kode Lisensi
                            </label>
                            <div className="relative">
                                <input
                                    id="license-key-input"
                                    type="text"
                                    value={inputKey}
                                    onChange={handleKeyChange}
                                    placeholder="XXXX-XXXX-XXXX-XXXX"
                                    maxLength={19}
                                    autoComplete="off"
                                    autoFocus
                                    disabled={isActivating}
                                    className={`w-full bg-black/40 border rounded-xl px-4 py-3.5 text-white text-center text-xl font-mono tracking-[0.3em] outline-none transition-all placeholder:text-white/20 placeholder:tracking-normal placeholder:text-base
                                        ${displayError ? 'border-red-500/60 shadow-[0_0_0_3px_rgba(239,68,68,0.1)]' : 'border-white/10 focus:border-blue-500/60 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]'}
                                        ${isActivating ? 'opacity-50 cursor-not-allowed' : ''}
                                    `}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20">
                                    <Lock size={16} />
                                </div>
                            </div>

                            {/* Character counter */}
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] text-white/30">
                                    {inputKey.replace(/-/g, '').length}/16 karakter
                                </span>
                                <span className="text-[10px] text-white/30">
                                    Format: XXXX-XXXX-XXXX-XXXX
                                </span>
                            </div>
                        </div>

                        {/* Error message */}
                        <AnimatePresence>
                            {displayError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 rounded-xl p-3"
                                >
                                    <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                                    <p className="text-red-300 text-sm leading-relaxed">{displayError}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Submit button */}
                        <button
                            id="license-activate-btn"
                            type="submit"
                            disabled={isActivating || inputKey.replace(/-/g, '').length < 16}
                            className="w-full py-3.5 rounded-xl font-bold text-base tracking-wide transition-all flex items-center justify-center gap-2
                                bg-gradient-to-r from-blue-600 to-purple-600 text-white
                                hover:from-blue-500 hover:to-purple-500 hover:shadow-lg hover:shadow-blue-500/25
                                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-purple-600
                                active:scale-[0.98]"
                        >
                            {isActivating ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Memverifikasi...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={18} />
                                    Aktifkan Lisensi
                                </>
                            )}
                        </button>

                        {/* Info footer */}
                        <div className="text-center pt-2 border-t border-white/5">
                            <p className="text-white/30 text-xs leading-relaxed">
                                Kode lisensi diberikan oleh administrator sekolah Anda.<br />
                                Hubungi <span className="text-blue-400/70">support</span> jika mengalami kesulitan.
                            </p>
                        </div>
                    </form>
                </div>

                {/* Bottom credit */}
                <p className="text-center text-white/20 text-xs mt-4">
                    &copy; {new Date().getFullYear()} {APP_NAME} — Dilindungi Hak Cipta
                </p>
            </motion.div>
        </div>
    );
}
