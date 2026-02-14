import React from 'react';
import { motion } from 'framer-motion';
import { User, Trophy, Check, X, Clock } from 'lucide-react';
import Battery from './Battery';

const PlayerCard = ({ player, options, hasAnswered, result, isWinner, onAnswer }) => {
    // options: array of strings ["Option A", "Option B", ...]
    // onAnswer: (optionIndex) => void

    return (
        <motion.div
            className={`glass-panel p-4 flex flex-col items-center gap-3 relative transition-all duration-300 w-full
        ${hasAnswered ? 'border-blue-400 shadow-[0_0_15px_rgba(50,50,255,0.3)]' : 'border-white/10'}
        ${result === 'correct' ? '!border-green-500 !shadow-[0_0_30px_rgba(0,255,0,0.4)]' : ''}
        ${result === 'wrong' ? '!border-red-500 opacity-80' : ''}
        ${isWinner ? '!border-yellow-400 !shadow-[0_0_50px_rgba(255,215,0,0.6)] scale-105 z-10' : ''}
      `}
        >
            {/* Inputs Header */}
            <div className="flex justify-between w-full items-center">
                {/* Avatar */}
                <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-lg border-2 relative"
                    style={{
                        backgroundColor: player.color,
                        borderColor: 'rgba(255,255,255,0.2)'
                    }}
                >
                    {player.avatar || <User size={24} color="white" />}
                    {/* Key Hint */}
                    <div className="absolute -bottom-2 -right-2 bg-black/80 text-white text-[9px] px-1.5 py-0.5 rounded-full border border-white/20">
                        {player.controls.split(',')[0]}...
                    </div>
                </div>

                <h3 className="text-lg font-bold tracking-wide truncate ml-2 flex-1">{player.name}</h3>

                {/* Status Icon */}
                <div className="w-8 flex justify-end">
                    {hasAnswered && result === null && (
                        <div className="text-blue-400 animate-pulse"><Clock size={20} /></div>
                    )}
                    {result === 'correct' && (
                        <div className="text-green-400"><Check size={24} strokeWidth={4} /></div>
                    )}
                    {result === 'wrong' && (
                        <div className="text-red-400"><X size={24} strokeWidth={4} /></div>
                    )}
                    {isWinner && (
                        <div className="text-yellow-400 animate-bounce"><Trophy size={28} /></div>
                    )}
                </div>
            </div>

            {/* Answer Buttons Grid */}
            <div className="grid grid-cols-2 gap-2 w-full mt-2">
                {options.map((opt, idx) => {
                    const isSelected = false; // We don't show specific selection until reveal to avoid cheating
                    const isCorrect = result === 'correct'; // Simplified for now, complex highlighting logic is in parent

                    return (
                        <button
                            key={idx}
                            onClick={() => !hasAnswered && onAnswer(idx)}
                            disabled={hasAnswered || result !== null}
                            className={`
                        text-xs font-bold py-2 px-1 rounded border transition-all text-left truncate
                        ${hasAnswered ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10 cursor-pointer'}
                        bg-black/20 border-white/10
                    `}
                            title={opt}
                        >
                            <span className="opacity-50 mr-1">{['A', 'B', 'C', 'D'][idx]}.</span>
                            {opt}
                        </button>
                    )
                })}
            </div>

            {/* Battery */}
            <div className="mt-auto w-full flex justify-center pt-2">
                <Battery level={player.score} isCharging={result === 'correct'} />
            </div>

        </motion.div>
    );
};

export default PlayerCard;
