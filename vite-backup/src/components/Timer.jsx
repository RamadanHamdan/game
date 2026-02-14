import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const Timer = ({ duration, onTimeUp, isRunning }) => {
    const [timeLeft, setTimeLeft] = useState(duration);

    useEffect(() => {
        if (!isRunning) return;

        setTimeLeft(duration);

        // Using simple interval for countdown display
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0.1) {
                    clearInterval(timer);
                    onTimeUp();
                    return 0;
                }
                return prev - 0.1;
            });
        }, 100);

        return () => clearInterval(timer);
    }, [duration, isRunning, onTimeUp]); // Re-run if duration changes or restarted

    const progress = (timeLeft / duration) * 100;

    return (
        <div className="w-full max-w-2xl mx-auto mt-6">
            <div className="flex justify-between text-xs uppercase font-bold tracking-widest opacity-70 mb-1">
                <span>Time Remaining</span>
                <span>{Math.ceil(timeLeft)}s</span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden border border-white/10">
                <motion.div
                    className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                    style={{ width: `${progress}%` }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "linear", duration: 0.1 }}
                />
            </div>
        </div>
    );
};

export default Timer;
