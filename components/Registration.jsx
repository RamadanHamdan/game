import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, StepBackIcon, X, Upload, Download, RefreshCw, Sparkles, Trophy, Lock, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { generateAIQuestions } from '../lib/ai';

const AVATARS = ["🦁", "🦊", "🐼", "🐸", "🐯", "🐨", "🦄", "🐲", "🤖", "👽", "👻", "🤡", "💀", "💩", "🐔", "🦄"];
const COLORS = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#1A535C", "#FF9F1C", "#2EC4B6", "#E71D36", "#7209B7"];

const Registration = ({ onStartGame, initialPlayers, onUpload, onDownloadTemplate, onOpenAIWizard, initialGameMode = 'default', isLicensed = false }) => {
    const router = useRouter();
    const MAX_PLAYERS_FREE = 1;

    const getInitialPlayers = () => {
        const base = initialPlayers && initialPlayers.length > 0 ? initialPlayers : [
            { id: 1, name: "Player 1", avatar: "🦁", color: "#FF6B6B" },
            { id: 2, name: "Player 2", avatar: "🦊", color: "#4ECDC4" },
        ];
        // Jika tidak berlisensi, batasi ke 1 player saja
        return isLicensed ? base : base.slice(0, MAX_PLAYERS_FREE);
    };
    const [players, setPlayers] = useState(getInitialPlayers);
    const [gameMode, setGameMode] = useState(initialGameMode);
    const [cupTargetMatch, setCupTargetMatch] = useState(3);

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
            // Batasi max player jika tidak berlisensi
            const maxPlayers = isLicensed ? 6 : MAX_PLAYERS_FREE;
            if (prev.length >= maxPlayers) return prev;
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
        <div className="w-full h-full sm:h-dvh flex flex-col items-center justify-center p-2 sm:p-4 text-white">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-3 sm:p-5 md:p-6 w-full max-w-6xl h-[95vh] flex flex-col border border-white/20 shadow-2xl rounded-2xl md:rounded-3xl relative"
            >
                <div className="flex items-center justify-between mb-2 md:mb-4 shrink-0 px-2 md:px-4">
                    <button
                        onClick={() => router.push('/')}
                        className="p-2 sm:p-3 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0 z-10"
                        title="Back to Home"
                    >
                        <StepBackIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white text-center flex-1 mx-2 tracking-wide font-mono">
                        PLAYER REGISTRATION
                    </h2>
                    {/* Badge FREE / LICENSED */}
                    {isLicensed ? (
                        <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 px-2.5 py-1 rounded-full shrink-0">
                            <ShieldCheck size={13} className="text-green-400" />
                            <span className="text-[10px] font-bold text-green-300 uppercase tracking-widest">Licensed</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 px-2.5 py-1 rounded-full shrink-0" title="Upgrade ke lisensi penuh untuk membuka semua fitur">
                            <Lock size={13} className="text-orange-400" />
                            <span className="text-[10px] font-bold text-orange-300 uppercase tracking-widest">Free</span>
                        </div>
                    )}
                </div>

                {/* Horizontal Scrolling Container */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 px-2 custom-scrollbar flex items-center justify-start xl:justify-center gap-3 sm:gap-4 md:gap-5 min-h-[220px]">
                    <AnimatePresence mode='popLayout'>
                        {players.map((p) => (
                            <motion.div
                                key={p.id}
                                layout
                                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="bg-black/40 p-2 sm:p-3 rounded-xl border border-blue-500/30 flex flex-col items-center gap-1 xl:gap-2 shrink-0 w-[130px] sm:w-[150px] md:w-[160px] h-[210px] sm:h-[220px] md:h-[240px] relative group hover:border-blue-400 transition-colors shadow-xl mr-3 sm:mr-4 md:mr-5"
                            >
                                <div className="absolute top-1 sm:top-2 right-1 sm:right-2 z-10">
                                    <button
                                        onClick={() => removePlayer(p.id)}
                                        disabled={players.length <= 1}
                                        className="p-1 sm:p-1.5 text-red-500 hover:bg-red-500/20 rounded-full transition disabled:opacity-0"
                                    >
                                        <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                                    </button>
                                </div>

                                <label className="text-[10px] sm:text-xs opacity-50 font-mono mt-1 sm:mt-2 self-start font-bold">PLAYER {p.id}</label>

                                {/* Avatar Button - Opens Modal */}
                                <button
                                    onClick={() => handleAvatarClick(p.id)}
                                    className="relative group/avatar mt-0 sm:mt-1"
                                >
                                    <div className="text-4xl sm:text-5xl w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center bg-white/5 border-2 border-white/10 group-hover/avatar:border-blue-400 transition-all shadow-lg transform group-hover/avatar:scale-105"
                                        style={{ backgroundColor: p.color + '20', borderColor: p.color }}
                                    >
                                        {p.avatar}
                                    </div>
                                    <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1 sm:p-1.5 text-white shadow-md border-2 border-black">
                                        <Plus size={12} className="sm:w-[14px] sm:h-[14px]" strokeWidth={3} />
                                    </div>
                                </button>

                                <div className="w-full mt-auto">
                                    <label className="text-[10px] sm:text-xs text-white/50 mb-0.5 block text-center font-medium">Name</label>
                                    <input
                                        type="text"
                                        value={p.name}
                                        onChange={(e) => updatePlayer(p.id, 'name', e.target.value)}
                                        className="bg-white/5 w-full border border-white/10 rounded-lg px-2 py-1.5 sm:py-2 text-center text-sm sm:text-base font-bold focus:outline-none focus:border-blue-500 transition focus:bg-white/10"
                                        placeholder="Name"
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Add Player Button — disabled jika sudah mencapai max & unlicensed */}
                    {(() => {
                        const maxPlayers = isLicensed ? 6 : MAX_PLAYERS_FREE;
                        const atMax = players.length >= maxPlayers;
                        return (
                            <div className="relative group/add">
                                <motion.button
                                    layout
                                    onClick={addPlayer}
                                    disabled={atMax}
                                    className={`w-[80px] sm:w-[100px] h-[210px] sm:h-[220px] md:h-[240px] shrink-0 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition mr-3 sm:mr-4 md:mr-5
                                        ${atMax
                                            ? 'border-white/10 text-white/20 cursor-not-allowed'
                                            : 'border-white/20 hover:border-blue-500/50 hover:bg-blue-500/10 text-white/40 hover:text-blue-200 cursor-pointer group'
                                        }`
                                    }
                                >
                                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-current flex items-center justify-center transition bg-white/5 ${!atMax && 'group-hover:scale-110'}`}>
                                        {atMax && !isLicensed ? <Lock size={20} className="sm:w-[24px] sm:h-[24px]" /> : <Plus size={20} className="sm:w-[24px] sm:h-[24px]" />}
                                    </div>
                                    <span className="font-bold text-xs sm:text-sm">{atMax && !isLicensed ? 'LOCKED' : 'ADD'}</span>
                                </motion.button>
                                {/* Tooltip lisensi diperlukan */}
                                {atMax && !isLicensed && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 bg-black/90 border border-orange-500/40 text-orange-300 text-[10px] text-center px-2 py-1.5 rounded-lg opacity-0 group-hover/add:opacity-100 transition-opacity pointer-events-none z-10">
                                        🔒 Butuh lisensi untuk menambah lebih dari {MAX_PLAYERS_FREE} player
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>

                <div className="mt-auto flex flex-col xl:flex-row items-center justify-between gap-3 md:gap-4 shrink-0 pt-3 md:pt-4 border-t border-white/20 w-full px-2 md:px-4">
                    {/* Secondary Actions Container */}
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3 w-full xl:w-auto">
                        <label className="flex items-center justify-center gap-2 cursor-pointer bg-blue-500/10 hover:bg-blue-500/20 text-blue-200 px-3 py-2 md:py-3 rounded-xl border border-blue-500/30 transition-colors text-xs sm:text-sm font-semibold flex-1 sm:flex-none">
                            <Upload size={16} />
                            <span>Upload <span className="hidden sm:inline">Questions</span></span>
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={onUpload}
                                className="hidden"
                            />
                        </label>
                        <button
                            onClick={onDownloadTemplate}
                            className="flex items-center justify-center gap-2 cursor-pointer bg-green-500/10 hover:bg-green-500/20 text-green-200 px-3 py-2 md:py-3 rounded-xl border border-green-500/30 transition-colors text-xs sm:text-sm font-semibold flex-1 sm:flex-none"
                        >
                            <Download size={16} />
                            <span>Template</span>
                        </button>

                        {/* AI Generate — hanya untuk licensed */}
                        {isLicensed ? (
                            <button
                                onClick={onOpenAIWizard}
                                className="flex items-center justify-center gap-2 cursor-pointer bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-200 px-3 py-2 md:py-3 rounded-xl border border-yellow-500/30 transition-colors text-xs sm:text-sm font-semibold w-full sm:w-auto"
                            >
                                <Sparkles size={16} className="text-yellow-400" />
                                <span>GENERATE WITH AI</span>
                            </button>
                        ) : (
                            <div
                                className="relative group/ai flex items-center justify-center gap-2 bg-white/5 text-white/30 px-3 py-2 md:py-3 rounded-xl border border-white/10 text-xs sm:text-sm font-semibold w-full sm:w-auto cursor-not-allowed select-none"
                                title="Butuh lisensi penuh"
                            >
                                <Lock size={16} className="text-white/30" />
                                <span>GENERATE WITH AI</span>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-black/90 border border-orange-500/40 text-orange-300 text-[10px] text-center px-2 py-1.5 rounded-lg opacity-0 group-hover/ai:opacity-100 transition-opacity pointer-events-none z-10">
                                    🔒 Fitur Generate AI memerlukan lisensi aktif
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Primary Start Action */}
                    <div className="flex flex-col items-center gap-2 xl:items-end w-full xl:w-auto xl:min-w-[280px] shrink-0 mt-1 xl:mt-0">
                        {/* Game Mode Selector */}
                        <div className="flex bg-black/40 rounded-lg p-1 border border-white/20 w-full sm:w-auto shadow-inner">
                            <button
                                onClick={() => setGameMode('default')}
                                className={`flex-1 py-1 px-4 text-xs sm:text-sm font-bold rounded-md transition-all ${gameMode === 'default' ? 'bg-blue-500 text-white shadow-md' : 'text-white/50 hover:text-white/80 hover:bg-white/10'}`}
                            >
                                Default Mode
                            </button>

                            {/* Cup Mode — hanya untuk licensed */}
                            {isLicensed ? (
                                <button
                                    onClick={() => setGameMode('cup')}
                                    className={`flex-1 py-1 px-4 text-xs sm:text-sm font-bold rounded-md transition-all gap-1 flex items-center justify-center ${gameMode === 'cup' ? 'bg-yellow-500 text-black shadow-md' : 'text-white/50 hover:text-white/80 hover:bg-white/10'}`}
                                >
                                    <Trophy size={14} className={gameMode === 'cup' ? 'text-black' : 'text-yellow-500/50'} />
                                    Cup Mode
                                </button>
                            ) : (
                                <div
                                    className="relative group/cup flex-1 py-1 px-4 text-xs sm:text-sm font-bold rounded-md flex items-center justify-center gap-1 text-white/20 cursor-not-allowed select-none"
                                    title="Cup Mode memerlukan lisensi"
                                >
                                    <Lock size={12} className="text-white/20" />
                                    Cup Mode
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-black/90 border border-orange-500/40 text-orange-300 text-[10px] text-center px-2 py-1.5 rounded-lg opacity-0 group-hover/cup:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                        🔒 Cup Mode memerlukan lisensi aktif
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Cup Settings */}
                        {gameMode === 'cup' && (
                            <div className="flex bg-black/40 rounded-lg p-2 border border-yellow-500/30 w-full shadow-inner justify-center items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                <label className="flex justify-center items-center text-xs text-yellow-300 font-bold uppercase tracking-widest flex-1">Choose Round</label>
                                <input
                                    type="number"
                                    min="2"
                                    max="10"
                                    value={cupTargetMatch}
                                    onChange={(e) => setCupTargetMatch(parseInt(e.target.value) || 3)}
                                    className="bg-black/60 border border-yellow-500/50 rounded-md w-16 px-2 py-1 text-white text-center font-bold focus:border-yellow-400 outline-none"
                                />
                            </div>
                        )}

                        <button
                            onClick={() => onStartGame(players, gameMode, cupTargetMatch)}
                            className="bg-green-500 text-black shadow-[0_4px_20px_rgba(0,255,0,0.3)] border border-green-400 hover:bg-green-400 px-6 sm:px-8 py-2 md:py-3 rounded-xl w-full font-black tracking-widest text-base sm:text-lg md:text-xl hover:scale-[1.02] transform transition-transform flex items-center justify-center gap-2 shrink-0"
                        >
                            START GAME <span className="text-sm opacity-80 md:ml-1 font-bold bg-black/20 px-2 py-0.5 rounded-md text-green-100">({players.length})</span>
                        </button>
                    </div>
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
