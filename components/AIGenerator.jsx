import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, Sparkles, Brain, Settings } from 'lucide-react';
import { generateAIQuestions } from '../lib/ai';

const AIGenerator = ({ isOpen, onClose, onQuestionsGenerated }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [settings, setSettings] = useState({
        subject: '',
        format: 'multiple_choice'
    });
    const [showSettings, setShowSettings] = useState(false);
    const [customApiKey, setCustomApiKey] = useState('');

    // We retrieve the API key from sessionStorage or env if available
    // but we don't show the input field to the user as requested
    const apiKey = typeof window !== 'undefined' ? sessionStorage.getItem('gemini_api_key') : '';

    const handleGenerate = async () => {
        if (!settings.subject) return;

        setIsGenerating(true);
        try {
            const formats = settings.format === 'both' ? ['multiple_choice', 'essay'] : [settings.format];
            const newQuestions = await generateAIQuestions(
                settings.subject,
                formats,
                10,
                customApiKey // Pass custom key if set
            );

            if (newQuestions && newQuestions.length > 0) {
                onQuestionsGenerated(newQuestions);
                onClose();
            }
        } catch (err) {
            console.error("AI Generation failed:", err);
            alert("Failed to generate questions: " + err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-gray-900 border border-blue-500/50 p-6 rounded-3xl w-full max-w-md shadow-[0_0_50px_rgba(37,99,235,0.2)] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                    <Brain size={24} />
                                </div>
                                <h3 className="text-2xl font-bold text-white">AI Quiz Wizard</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowSettings(!showSettings)}
                                    className={`p-2 rounded-full transition-colors ${showSettings ? 'bg-blue-500/20 text-blue-400' : 'text-white/30 hover:text-white/50'}`}
                                    title="AI Settings"
                                >
                                    <Settings size={20} />
                                </button>
                                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <AnimatePresence>
                                {showSettings && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-2xl mb-4">
                                            <label className="text-[10px] text-blue-300 font-bold uppercase tracking-widest block mb-2">Override Gemini API Key</label>
                                            <input
                                                type="password"
                                                value={customApiKey}
                                                onChange={(e) => {
                                                    setCustomApiKey(e.target.value);
                                                    if (e.target.value) sessionStorage.setItem('gemini_api_key', e.target.value);
                                                }}
                                                placeholder="Enter your API Key here..."
                                                className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs w-full focus:border-blue-500 outline-none transition-all"
                                            />
                                            <p className="text-[9px] text-white/30 mt-2">Dapatkan kunci gratis di <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline text-blue-400">Google AI Studio</a></p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-blue-300 font-bold uppercase tracking-widest ml-1">Mata Pelajaran</label>
                                <input
                                    type="text"
                                    value={settings.subject}
                                    onChange={(e) => setSettings(s => ({ ...s, subject: e.target.value }))}
                                    placeholder="Contoh: Sejarah Indonesia, Matematika, Biologi..."
                                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all placeholder:text-white/20"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-blue-300 font-bold uppercase tracking-widest ml-1">Format Soal</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['multiple_choice', 'essay', 'both'].map((f) => (
                                        <button
                                            key={f}
                                            onClick={() => setSettings(s => ({ ...s, format: f }))}
                                            className={`py-2 px-1 rounded-lg text-[10px] font-bold uppercase transition-all border ${settings.format === f
                                                ? 'bg-blue-600 border-blue-400 text-white shadow-lg'
                                                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                                                }`}
                                        >
                                            {f === 'multiple_choice' ? 'Pilihan Ganda' : f === 'essay' ? 'Essay' : 'Keduanya'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !settings.subject}
                                className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${isGenerating || !settings.subject
                                    ? 'bg-gray-800 text-white/20 cursor-not-allowed'
                                    : 'bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95'
                                    }`}
                            >
                                {isGenerating ? (
                                    <>
                                        <RefreshCw size={20} className="animate-spin" />
                                        Menciptakan Soal...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={20} />
                                        GENERATE SEKARANG
                                    </>
                                )}
                            </button>
                        </div>

                        <p className="text-[10px] text-white/20 text-center mt-6 uppercase tracking-widest font-bold">
                            Powered by Gemini AI Engine
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AIGenerator;
