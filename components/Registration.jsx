import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, StepBackIcon, X, Upload, Download, RefreshCw, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { generateAIQuestions } from '../lib/ai';

const AVATARS = ["🦁", "🦊", "🐼", "🐸", "🐯", "🐨", "🦄", "🐲", "🤖", "👽", "👻", "🤡", "💀", "💩", "🐔", "🦄"];
const COLORS = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#1A535C", "#FF9F1C", "#2EC4B6", "#E71D36", "#7209B7"];

const Registration = ({ onStartGame, initialPlayers, onUpload, onDownloadTemplate, onOpenAIWizard }) => {
    const router = useRouter();
    const [players, setPlayers] = useState(initialPlayers && initialPlayers.length > 0 ? initialPlayers : [
        { id: 1, name: "Player 1", avatar: "🦁", color: "#FF6B6B" },
        { id: 2, name: "Player 2", avatar: "🦊", color: "#4ECDC4" },
    ]);


    // Modal state for avatar selection
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [activePlayerId, setActivePlayerId] = useState(null);

    const updatePlayer = (id, field, value) => {
        setPlayers(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleAvatarClick = (playerId) => {
        setActivePlayerId(playerId);
        setShowAvatarModal(true);
    };

    const selectAvatar = (avatar) => {
        if (activePlayerId) {
            updatePlayer(activePlayerId, 'avatar', avatar);
            setShowAvatarModal(false);
            setActivePlayerId(null);
        }
    };

    const addPlayer = () => {
        setPlayers(prev => {
            const newId = prev.length > 0 ? Math.max(...prev.map(p => p.id)) + 1 : 1;
            const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
            const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];

            return [...prev, {
                id: newId,
                name: `Player ${newId}`,
                avatar: randomAvatar,
                color: randomColor
            }];
        });
    };

    const removePlayer = (id) => {
        setPlayers(prev => {
            if (prev.length <= 1) return prev;
            return prev.filter(p => p.id !== id);
        });
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-8 text-white">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-4 md:p-8 w-full max-w-[95vw] h-[80vh] flex flex-col border border-blue-500/50 shadow-[0_0_30px_rgba(0,100,255,0.2)]"
            >
                <div className="flex items-center justify-between mb-4 md:mb-6 shrink-0 relative">
                    <button
                        onClick={() => router.push('/')}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                        title="Back to Home"
                    >
                        <StepBackIcon />
                    </button>
                    <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r text-white absolute left-1/2 -translate-x-1/2">
                        PLAYER REGISTRATION
                    </h2>
                    <div className="w-10"></div> {/* Spacer for centering */}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
                    <button
                        onClick={onOpenAIWizard}
                        className="btn bg-linear-to-r from-blue-600 to-purple-600 border-blue-400/50 hover:scale-105 px-8 py-3 rounded-xl flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)]"
                    >
                        <Sparkles size={20} className="text-yellow-300" />
                        <span className="font-bold">GENERATE WITH AI (SOAL)</span>
                    </button>
                    <label className="btn bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/40 px-8 py-3 rounded-xl cursor-pointer flex items-center gap-2 transition-all">
                        <Upload size={20} />
                        <span>IMPORT QUESTIONS (EXCEL)</span>
                        <input type="file" accept=".xlsx, .xls" onChange={onUpload} className="hidden" />
                    </label>
                    <button
                        onClick={onDownloadTemplate}
                        className="btn bg-white/5 border-white/20 hover:bg-white/10 px-8 py-3 rounded-xl flex items-center gap-2 transition-all"
                    >
                        <Download size={20} />
                        <span>DOWNLOAD TEMPLATE</span>
                    </button>
                </div>

                {/* Horizontal Scrolling Container */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 px-2 min-h-0 custom-scrollbar flex items-center gap-4">
                    <AnimatePresence mode='popLayout'>
                        {players.map((p) => (
                            <motion.div
                                key={p.id}
                                layout
                                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="bg-black/40 p-4 rounded-2xl border border-blue-500/30 flex flex-col items-center gap-4 shrink-0 w-[200px] h-[300px] relative group hover:border-blue-400 transition-colors"
                            >
                                <div className="absolute top-2 right-2 z-10">
                                    <button
                                        onClick={() => removePlayer(p.id)}
                                        disabled={players.length <= 1}
                                        className="p-2 text-red-400 hover:bg-red-400/20 rounded-full transition disabled:opacity-0"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <label className="text-xs opacity-50 font-mono mt-2 self-start">PLAYER {p.id}</label>

                                {/* Avatar Button - Opens Modal */}
                                <button
                                    onClick={() => handleAvatarClick(p.id)}
                                    className="relative group/avatar mt-2"
                                >
                                    <div className="text-6xl w-24 h-24 rounded-full flex items-center justify-center bg-white/5 border-2 border-white/10 group-hover/avatar:border-blue-400 transition-all shadow-lg transform group-hover/avatar:scale-105"
                                        style={{ backgroundColor: p.color + '20', borderColor: p.color }}
                                    >
                                        {p.avatar}
                                    </div>
                                    <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1.5 text-white shadow-md border-2 border-black">
                                        <Plus size={14} strokeWidth={3} />
                                    </div>
                                </button>

                                <div className="w-full mt-auto">
                                    <label className="text-xs text-white/50 mb-1 block text-center">Name</label>
                                    <input
                                        type="text"
                                        value={p.name}
                                        onChange={(e) => updatePlayer(p.id, 'name', e.target.value)}
                                        className="bg-white/5 w-full border border-white/10 rounded-lg px-3 py-2 text-center text-lg focus:outline-none focus:border-blue-500 transition focus:bg-white/10"
                                        placeholder="Enter Name"
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Add Player Button */}
                    <motion.button
                        layout
                        onClick={addPlayer}
                        className="w-[100px] h-[300px] shrink-0 border-2 border-dashed border-blue-500/30 rounded-2xl flex flex-col items-center justify-center gap-2 text-blue-200/50 hover:text-blue-200 hover:border-blue-500/50 hover:bg-blue-500 transition group"
                    >
                        <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center group-hover:scale-110 transition">
                            <Plus size={24} />
                        </div>
                        <span className="font-bold text-sm">ADD</span>
                    </motion.button>
                </div>

                <div className="mt-4 flex justify-center shrink-0 pt-4 border-t border-blue-500/30 w-full relative">
                    <button
                        onClick={() => onStartGame(players)}
                        className="btn bg-green-500/20 border-green-500/50 hover:bg-green-500/40 text-xl px-12 py-4 shadow-[0_0_20px_rgba(0,255,0,0.2)] rounded-xl w-full md:w-auto font-bold tracking-wider hover:scale-105 transition-transform"
                    >
                        START GAME <span className="text-sm opacity-80 ml-2">({players.length} Players)</span>
                    </button>
                </div>

            </motion.div>

            {/* Avatar Selection Modal */}
            <AnimatePresence>
                {showAvatarModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
                        onClick={() => setShowAvatarModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-gray-900 border border-blue-500/50 p-6 rounded-3xl w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[80vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-white">Select Avatar</h3>
                                <button onClick={() => setShowAvatarModal(false)} className="p-2 hover:bg-white/10 rounded-full">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 overflow-y-auto p-2 custom-scrollbar">
                                {AVATARS.map((avatar, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => selectAvatar(avatar)}
                                        className="text-4xl aspect-square flex items-center justify-center bg-white/5 hover:bg-blue-500/20 rounded-xl hover:scale-110 transition-all border border-white/5 hover:border-blue-400"
                                    >
                                        {avatar}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Registration;
