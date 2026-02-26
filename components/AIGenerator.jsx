import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, Sparkles, Brain } from 'lucide-react';
import { generateAIQuestions } from '../lib/ai';

const AIGenerator = ({ isOpen, onClose, onQuestionsGenerated }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [settings, setSettings] = useState({
        subject: '',
        customSubject: '', // For manual input if they choose 'Lainnya'
        grade: '9', // Default to grade 9
        format: 'multiple_choice',
        count: 5
    });

    // Core Subject Options
    const SUBJECT_OPTIONS = [
        "Tematik (SD)",
        "Matematika",
        "Bahasa Indonesia",
        "Bahasa Inggris",
        "Ilmu Pengetahuan Alam (IPA)",
        "Ilmu Pengetahuan Sosial (IPS)",
        "Pendidikan Pancasila dan Kewarganegaraan (PPKn)",
        "Pendidikan Agama Islam",
        "Seni Budaya",
        "Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)",
        "Informatika",
        "Fisika",
        "Biologi",
        "Kimia",
        "Sejarah",
        "Geografi",
        "Sosiologi",
        "Ekonomi",
        "Lainnya..."
    ];


    const handleGenerate = async () => {
        const finalSubject = settings.subject === 'Lainnya...' ? settings.customSubject : settings.subject;

        if (!finalSubject || !settings.grade) {
            alert("Mohon isi Mata Pelajaran dan Kelas dengan lengkap.");
            return;
        }

        setIsGenerating(true);
        try {
            const formats = settings.format === 'both' ? ['multiple_choice', 'essay'] : [settings.format];
            const newQuestions = await generateAIQuestions(
                finalSubject,
                settings.grade,
                formats,
                settings.count || 5
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
                                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6">

                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-blue-300 font-bold uppercase tracking-widest ml-1">Mata Pelajaran</label>
                                <select
                                    value={settings.subject}
                                    onChange={(e) => setSettings(s => ({ ...s, subject: e.target.value }))}
                                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all cursor-pointer appearance-none"
                                >
                                    <option value="" disabled>-- Pilih Mata Pelajaran --</option>
                                    {SUBJECT_OPTIONS.map((sub, idx) => (
                                        <option key={idx} value={sub}>{sub}</option>
                                    ))}
                                </select>

                                <AnimatePresence>
                                    {settings.subject === 'Lainnya...' && (
                                        <motion.input
                                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                            animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                            type="text"
                                            value={settings.customSubject}
                                            onChange={(e) => setSettings(s => ({ ...s, customSubject: e.target.value }))}
                                            placeholder="Ketik mata pelajaran manual..."
                                            className="bg-black/40 border border-yellow-500/50 rounded-xl px-4 py-3 text-white focus:border-yellow-400 outline-none transition-all placeholder:text-white/20"
                                            autoFocus
                                        />
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex flex-col gap-2 flex-3">
                                    <label className="text-xs text-blue-300 font-bold uppercase tracking-widest ml-1">Kelas / Tingkat</label>
                                    <input
                                        type="text"
                                        value={settings.grade}
                                        onChange={(e) => setSettings(s => ({ ...s, grade: e.target.value }))}
                                        placeholder="Cth: 9, 12 IPA, Kuliah Semester 2..."
                                        className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all placeholder:text-white/20 w-full"
                                    />
                                </div>
                                <div className="flex flex-col gap-2 flex-1 min-w-[100px]">
                                    <label className="text-xs text-blue-300 font-bold uppercase tracking-widest ml-1">Jml Soal</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={settings.count}
                                        onChange={(e) => setSettings(s => ({ ...s, count: parseInt(e.target.value) || 5 }))}
                                        className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all w-full text-center"
                                    />
                                </div>
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
                                disabled={isGenerating || !settings.subject || (settings.subject === 'Lainnya...' && !settings.customSubject) || !settings.grade}
                                className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${isGenerating || !settings.subject || (settings.subject === 'Lainnya...' && !settings.customSubject) || !settings.grade
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
