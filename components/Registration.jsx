import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus } from 'lucide-react';

const AVATARS = ["🦁", "🦊", "🐼", "🐸", "🐯", "🐨", "🦄", "🐲", "🤖", "👽", "👻", "🤡", "💀", "💩", "🐔", "🦄"];
const COLORS = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#1A535C", "#FF9F1C", "#2EC4B6", "#E71D36", "#7209B7"];

const Registration = ({ onStartGame, initialPlayers }) => {
    const [players, setPlayers] = useState(initialPlayers && initialPlayers.length > 0 ? initialPlayers : [
        { id: 1, name: "Player 1", avatar: "🦁", color: "#FF6B6B" },
        { id: 2, name: "Player 2", avatar: "🦊", color: "#4ECDC4" },
    ]);

    const updatePlayer = (id, field, value) => {
        setPlayers(players.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const addPlayer = () => {
        const newId = players.length > 0 ? Math.max(...players.map(p => p.id)) + 1 : 1;
        const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
        const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];

        setPlayers([...players, {
            id: newId,
            name: `Player ${newId}`,
            avatar: randomAvatar,
            color: randomColor
        }]);
    };

    const removePlayer = (id) => {
        if (players.length <= 1) return; // Keep at least 1 player
        setPlayers(players.filter(p => p.id !== id));
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-8 text-white">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-4 md:p-8 w-full max-w-4xl max-h-[90vh] flex flex-col"
            >
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 md:mb-8 bg-clip-text text-transparent bg-gradient-to-r text-white shrink-0">
                    PLAYER REGISTRATION
                </h2>

                <div className="grid grid-cols-1 gap-3 md:gap-4 overflow-y-auto min-h-0 flex-1 pr-2">
                    <AnimatePresence>
                        {players.map((p) => (
                            <motion.div
                                key={p.id}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                className="bg-white/5 p-3 md:p-4 rounded-xl border border-white/10 flex items-center gap-3 md:gap-4 shrink-0 overflow-hidden"
                            >
                                <div className="relative group shrink-0">
                                    <button onClick={() => {
                                        const currIdx = AVATARS.indexOf(p.avatar);
                                        const next = AVATARS[(currIdx + 1) % AVATARS.length];
                                        updatePlayer(p.id, 'avatar', next);
                                    }} className="text-2xl md:text-4xl bg-black/20 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center hover:bg-white/10 transition">
                                        {p.avatar}
                                    </button>
                                </div>

                                <div className="flex-1 flex flex-col gap-1 md:gap-2 min-w-0">
                                    <label className="text-[10px] md:text-xs opacity-50 font-mono">PLAYER {p.id}</label>
                                    <input
                                        type="text"
                                        value={p.name}
                                        onChange={(e) => updatePlayer(p.id, 'name', e.target.value)}
                                        className="bg-black/30 w-full border border-white/10 rounded px-2 py-1 md:px-3 md:py-2 text-base md:text-lg focus:outline-none focus:border-white transition"
                                    />
                                </div>

                                <button
                                    onClick={() => removePlayer(p.id)}
                                    disabled={players.length <= 1}
                                    className="p-2 text-red-400 hover:bg-red-400/20 rounded-full transition disabled:opacity-30 disabled:hover:bg-transparent"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    <motion.button
                        layout
                        onClick={addPlayer}
                        className="w-full py-3 md:py-4 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center gap-2 text-white/50 hover:text-white hover:border-white/50 hover:bg-white/5 transition group"
                    >
                        <Plus size={24} className="group-hover:scale-110 transition" />
                        <span className="font-bold">ADD PLAYER</span>
                    </motion.button>
                </div>

                <div className="mt-4 md:mt-6 flex justify-center shrink-0 pt-4 border-t border-white/10">
                    <button
                        onClick={() => onStartGame(players)}
                        className="btn bg-green-500/20 border-green-500/50 hover:bg-green-500/40 text-lg md:text-xl px-8 py-3 md:px-12 md:py-4 shadow-[0_0_20px_rgba(0,255,0,0.2)] w-full md:w-auto"
                    >
                        START GAME ({players.length} Players)
                    </button>
                </div>

            </motion.div>
        </div>
    );
};

export default Registration;
