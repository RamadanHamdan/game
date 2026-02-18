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
        <div className="relative flex items-center gap-1 w-full max-w-[120px] mx-auto">
            {/* Battery Body (Horizontal) */}
            <div className="relative flex-1 h-3 md:h-4 bg-gray-900 rounded md:rounded border border-gray-400 p-[1px] flex items-center justify-start gap-[1px] shadow-[0_0_5px_rgba(0,0,0,0.8)] backdrop-blur-sm overflow-hidden">

                {/* Glossy overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/20 pointer-events-none z-20 rounded"></div>

                {/* Segments */}
                {[...Array(totalSegments)].map((_, i) => {
                    const isActive = i < activeSegments;

                    // Charging animation
                    const pulse = isCharging && isActive ? {
                        opacity: [1, 0.6, 1],
                        boxShadow: [`0 0 5px ${color}`, `0 0 10px ${color}`, `0 0 5px ${color}`]
                    } : {};

                    return (
                        <motion.div
                            key={i}
                            initial={false}
                            animate={{
                                opacity: isActive ? 1 : 0.2,
                                backgroundColor: isActive ? color : '#333',
                                boxShadow: isActive ? `0 0 5px ${color}` : 'none',
                                ...pulse
                            }}
                            transition={{
                                duration: 0.3,
                                delay: isActive ? i * 0.05 : 0,
                                opacity: { repeat: isCharging ? Infinity : 0, duration: 0.8 },
                                boxShadow: { repeat: isCharging ? Infinity : 0, duration: 0.8 }
                            }}
                            className="h-full flex-1 rounded-[1px] border-r-[0.5px] border-black/20 last:border-r-0"
                        />
                    );
                })}
            </div>
            {/* Battery Nipple (Right side) */}
            <div className="w-1 h-2 md:w-1.5 md:h-2.5 bg-gray-400 rounded-r-sm border border-l-0 border-white/30 shadow-inner" style={{ background: 'linear-gradient(to bottom, #666, #aaa, #666)' }}></div>
        </div>
    );
};

export default Battery;
