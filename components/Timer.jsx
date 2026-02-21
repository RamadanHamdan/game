import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const Timer = ({ duration, onTimeUp, isRunning }) => {
    const [timeLeft, setTimeLeft] = useState(duration);

    useEffect(() => {
        if (!isRunning) return;

        setTimeLeft(duration);

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) return 0;
                return Math.max(0, prev - 0.1);
            });
        }, 100);

        return () => clearInterval(timer);
    }, [duration, isRunning]);

    // Trigger onTimeUp when timer hits 0
    useEffect(() => {
        if (timeLeft <= 0 && isRunning) {
            onTimeUp();
        }
    }, [timeLeft, isRunning, onTimeUp]);

    const progress = (timeLeft / duration) * 100;

    return (
        <div className="w-full max-w-2xl mx-auto mt-1 md:mt-4">
            <div className="flex justify-between text-xs uppercase font-bold tracking-widest text-white opacity-80 mb-1">
                <span>Time Remaining</span>
                <span>{Math.ceil(timeLeft)}s</span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden border border-white/10">
                <motion.div
                    className="h-full bg-linear-to-r from-blue-500 via-blue-500 to-blue-500"
                    style={{ width: `${progress}%` }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "linear", duration: 0.1 }}
                />
            </div>
        </div>
    );
};

export default Timer;
