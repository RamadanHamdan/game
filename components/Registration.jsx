import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const AVATARS = ["🦁", "🦊", "🐼", "🐸", "🐯", "🐨", "🦄", "🐲", "🤖", "👽", "👻", "🤡", "💀", "💩", "🐔", "🦄"];

const Registration = ({ onStartGame, initialPlayers }) => {
    const [players, setPlayers] = useState(initialPlayers || [
        { id: 1, name: "Player 1", avatar: "🦁", color: "#FF6B6B" },
        { id: 2, name: "Player 2", avatar: "🦊", color: "#4ECDC4" },
        { id: 3, name: "Player 3", avatar: "🐼", color: "#FFE66D" },
        { id: 4, name: "Player 4", avatar: "🐸", color: "#1A535C" },
    ]);

    const updatePlayer = (id, field, value) => {
        setPlayers(players.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-white">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-8 w-full max-w-4xl max-h-screen overflow-y-auto"
            >
                <h2 className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400">
                    PLAYER REGISTRATION
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {players.map((p) => (
                        <div key={p.id} className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center gap-4">
                            <div className="relative group shrink-0">
                                <button className="text-4xl bg-black/20 w-16 h-16 rounded-full flex items-center justify-center hover:bg-white/10 transition">
                                    {p.avatar}
                                </button>
                            </div>

                            <div className="flex-1 flex flex-col gap-2 min-w-0">
                                <label className="text-xs opacity-50 font-mono">PLAYER {p.id}</label>
                                <input
                                    type="text"
                                    value={p.name}
                                    onChange={(e) => updatePlayer(p.id, 'name', e.target.value)}
                                    className="bg-black/30 w-full border border-white/10 rounded px-3 py-2 text-lg focus:outline-none focus:border-green-400 transition"
                                />
                                <div className="flex gap-1 flex-wrap">
                                    {AVATARS.slice(0, 8).map(a => (
                                        <button key={a} onClick={() => updatePlayer(p.id, 'avatar', a)} className={`text-sm w-6 h-6 flex items-center justify-center rounded ${p.avatar === a ? 'bg-white/20 scale-125' : 'opacity-50'} hover:scale-110 transition`}>
                                            {a}
                                        </button>
                                    ))}
                                    <button onClick={() => {
                                        const currIdx = AVATARS.indexOf(p.avatar);
                                        const next = AVATARS[(currIdx + 1) % AVATARS.length];
                                        updatePlayer(p.id, 'avatar', next);
                                    }} className="text-xs bg-white/10 px-2 rounded opacity-50 hover:opacity-100 ml-auto">Next</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-10 flex justify-center">
                    <button
                        onClick={() => onStartGame(players)}
                        className="btn bg-green-500/20 border-green-500/50 hover:bg-green-500/40 text-xl px-12 py-4 shadow-[0_0_20px_rgba(0,255,0,0.2)]"
                    >
                        CONFIRM & START
                    </button>
                </div>

            </motion.div>
        </div>
    );
};

export default Registration;
