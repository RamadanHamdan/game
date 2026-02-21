import React from 'react';
import { motion } from 'framer-motion';
import { User, Trophy, Check, X, Clock } from 'lucide-react';
import Battery from './Battery';

const PlayerCard = ({ player, question, hasAnswered, result, isWinner, onAnswer, rank }) => {
    // question: { question: "...", options: ["...", ...], ... }
    // onAnswer: (optionIndex) => void

    // Rank styling
    const getRankStyle = (r) => {
        if (r === 1) return 'bg-yellow-400 text-black border-yellow-200 shadow-[0_0_15px_rgba(255,215,0,0.5)]';
        if (r === 2) return 'bg-gray-300 text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]';
        if (r === 3) return 'bg-orange-400 text-black border-orange-200 shadow-[0_0_10px_rgba(255,165,0,0.3)]';
        return 'bg-white/10 text-white/50 border-white/5';
    };

    return (
        <motion.div
            layout // Enable smooth reordering animation
            className={`glass-panel p-1.5 md:p-2 flex flex-col items-center gap-0.5 relative transition-all duration-300 w-full h-full min-h-0
        ${hasAnswered ? 'border-blue-400 shadow-[0_0_15px_rgba(50,50,255,0.3)]' : 'border-white/10'}
        ${result === 'correct' ? '!border-green-500 !shadow-[0_0_30px_rgba(0,255,0,0.4)]' : ''}
        ${result === 'wrong' ? '!border-red-500 opacity-80' : ''}
        ${isWinner ? '!border-yellow-400 !shadow-[0_0_50px_rgba(255,215,0,0.6)] scale-105 z-10' : ''}
      `}
        >
            {/* Rank Badge (Absolute Top-Left) */}
            <div className={`absolute -top-2 -left-2 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-xs md:text-sm border-2 z-20 ${getRankStyle(rank)}`}>
                #{rank}
            </div>

            {/* Inputs Header */}
            <div className="flex justify-between w-full items-center shrink-0 pl-3"> {/* Added padding-left for rank badge */}
                {/* Avatar */}
                <div
                    className="w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm md:text-xl shadow-lg border-2 relative shrink-0"
                    style={{
                        backgroundColor: player.color,
                        borderColor: 'rgba(255,255,255,0.2)'
                    }}
                >
                    {player.avatar || <User size={16} className="md:w-6 md:h-6" color="white" />}
                    {/* Key Hint - hidden on mobile since it likely uses touch */}
                </div>

                <h3 className="text-sm md:text-lg font-bold tracking-wide truncate ml-2 flex-1">{player.name}</h3>

                {/* Status Icon */}
                <div className="w-6 md:w-8 flex justify-end shrink-0">
                    {hasAnswered && result === null && (
                        <div className="text-blue-400 animate-pulse"><Clock size={16} className="md:w-5 md:h-5" /></div>
                    )}
                    {result === 'correct' && (
                        <div className="text-green-400"><Check size={20} className="md:w-6 md:h-6" strokeWidth={4} /></div>
                    )}
                    {result === 'wrong' && (
                        <div className="text-red-400"><X size={20} className="md:w-6 md:h-6" strokeWidth={4} /></div>
                    )}
                    {isWinner && (
                        <div className="text-yellow-400 animate-bounce"><Trophy size={24} className="md:w-[28px] md:h-[28px]" /></div>
                    )}
                </div>
            </div>

            {/* Question Text */}
            <div className="w-full text-center my-0.5 bg-black/20 p-1 rounded border border-white/5 flex-1 flex items-center justify-center min-h-[40px] md:min-h-[50px]">
                <p className="text-[10px] md:text-xs font-medium leading-tight text-blue-100 line-clamp-3">
                    {question?.question || "Waiting..."}
                </p>
            </div>

            {/* Answer Buttons Grid */}
            <div className="grid grid-cols-2 gap-1 w-full min-h-0 shrink-0 mb-1">
                {question?.options?.map((opt, idx) => {
                    const isSelected = false;

                    const handleInput = (e) => {
                        // Prevent default to stop scrolling/zooming/double-firing on touch
                        // but only if it's a touch event to allow mouse clicks to work normally
                        if (e.type === 'touchstart') {
                            e.preventDefault();
                        }
                        if (!hasAnswered) {
                            onAnswer(idx);
                        }
                    };

                    const isCorrectAnswer = opt === question.answer;
                    const showCorrect = result !== null && isCorrectAnswer;

                    return (
                        <button
                            key={idx}
                            onMouseDown={handleInput}
                            onTouchStart={handleInput}
                            disabled={hasAnswered || result !== null}
                            className={`
                        text-[10px] md:text-xs font-bold py-1.5 px-2 md:py-2 rounded border transition-all text-left relative whitespace-normal wrap-break-word leading-tight h-full min-h-[40px] flex items-center
                        ${hasAnswered ? 'opacity-50 cursor-not-allowed' : 'active:bg-white/20 hover:bg-white/10 cursor-pointer'}
                        ${showCorrect ? 'border-green-500! shadow-[0_0_10px_rgba(0,255,0,0.6)]! bg-green-500/20' : 'bg-black/20 border-white/10'}
                    `}
                            title={opt}
                        >
                            <span className="opacity-50 mr-1.5 shrink-0">{['A', 'B', 'C', 'D'][idx]}.</span>
                            <span className="">{opt}</span>
                        </button>
                    )
                })}
            </div>

            {/* Battery (Horizontal) - Integrated at bottom */}
            <div className="w-full mt-auto pt-1">
                <Battery level={player.score} isCharging={result === 'correct'} />
            </div>

        </motion.div>
    );
};

export default PlayerCard;
