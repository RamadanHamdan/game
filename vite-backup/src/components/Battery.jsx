import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

const Battery = ({ level, isCharging }) => {
    // Level is 0-100.
    // We want 10 segments.
    const totalSegments = 10;
    const activeSegments = Math.round(level / 10);

    // Determine color based on overall level
    const getColor = (lvl) => {
        if (lvl <= 20) return '#ff0055'; // Red
        if (lvl <= 50) return '#ffcc00'; // Yellow
        return '#00ffcc'; // Cyan/Green
    };

    const color = getColor(level);

    return (
        <div className="relative flex flex-col items-center">
            {/* Battery Nipple */}
            <div className="w-12 h-4 bg-gray-400 rounded-t-sm border-2 border-b-0 border-white/30 shadow-inner" style={{ background: 'linear-gradient(to right, #666, #aaa, #666)' }}></div>

            {/* Battery Body */}
            <div className="relative w-24 h-44 bg-gray-900 rounded-2xl border-4 border-gray-400 p-2 flex flex-col-reverse justify-start gap-1 shadow-[0_0_25px_rgba(0,0,0,0.8)] backdrop-blur-sm overflow-hidden">

                {/* Glossy overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-black/20 pointer-events-none z-20 rounded-lg"></div>

                {/* Segments */}
                {[...Array(totalSegments)].map((_, i) => {
                    const isActive = i < activeSegments;

                    // Charging animation: pulse opacity and glow if this is a filled segment and we are in charging state
                    const pulse = isCharging && isActive ? {
                        opacity: [1, 0.6, 1],
                        boxShadow: [`0 0 10px ${color}`, `0 0 20px ${color}`, `0 0 10px ${color}`]
                    } : {};

                    return (
                        <motion.div
                            key={i}
                            initial={false}
                            animate={{
                                opacity: isActive ? 1 : 0.2,
                                backgroundColor: isActive ? color : '#333',
                                boxShadow: isActive ? `0 0 10px ${color}` : 'none',
                                ...pulse
                            }}
                            transition={{
                                duration: 0.3,
                                delay: isActive ? i * 0.05 : 0,
                                // Pulse repeat
                                opacity: { repeat: isCharging ? Infinity : 0, duration: 0.8 },
                                boxShadow: { repeat: isCharging ? Infinity : 0, duration: 0.8 }
                            }}
                            className="w-full flex-1 rounded-sm border-[0.5px] border-black/20"
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default Battery;
