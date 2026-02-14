import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlayerCard from './PlayerCard';
import Timer from './Timer';
import { Zap, RefreshCw, Trophy } from 'lucide-react';

const INITIAL_PLAYERS = [
    { id: 1, name: "Player 1", score: 0, color: "#FF6B6B", avatar: "🦁", controls: "Q, W, E, R" },
    { id: 2, name: "Player 2", score: 0, color: "#4ECDC4", avatar: "🦊", controls: "U, I, O, P" },
    { id: 3, name: "Player 3", score: 0, color: "#FFE66D", avatar: "🐼", controls: "Z, X, C, V" },
    { id: 4, name: "Player 4", score: 0, color: "#1A535C", avatar: "🐸", controls: "N, M, <, >" },
];

// Mapping keys to option indices (0, 1, 2, 3)
const CONTROLS = {
    'q': { playerId: 1, option: 0 }, 'w': { playerId: 1, option: 1 }, 'e': { playerId: 1, option: 2 }, 'r': { playerId: 1, option: 3 },
    'u': { playerId: 2, option: 0 }, 'i': { playerId: 2, option: 1 }, 'o': { playerId: 2, option: 2 }, 'p': { playerId: 2, option: 3 },
    'z': { playerId: 3, option: 0 }, 'x': { playerId: 3, option: 1 }, 'c': { playerId: 3, option: 2 }, 'v': { playerId: 3, option: 3 },
    'n': { playerId: 4, option: 0 }, 'm': { playerId: 4, option: 1 }, ',': { playerId: 4, option: 2 }, '.': { playerId: 4, option: 3 },
};

const GameContainer = () => {
    const [gameStarted, setGameStarted] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [players, setPlayers] = useState(INITIAL_PLAYERS);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [gameState, setGameState] = useState('loading'); // 'loading', 'playing', 'reveal', 'winner'
    const [playerAnswers, setPlayerAnswers] = useState({}); // { 1: 'Option A', ... }
    const [roundResults, setRoundResults] = useState({}); // { 1: 'correct', 2: 'wrong' ... }

    // Load questions
    useEffect(() => {
        fetch('/questions.json')
            .then(res => res.json())
            .then(data => {
                setQuestions(data);
                setGameState('playing');
            })
            .catch(err => {
                console.error("Failed to load questions", err);
                setGameState('error');
            });
    }, []);

    const currentQuestion = questions[currentQuestionIndex];

    // Logic to handle an answer input (from click or key)
    const submitAnswer = (playerId, optionIndex) => {
        if (!gameStarted || gameState !== 'playing') return;
        if (playerAnswers[playerId] !== undefined) return;

        const optionValue = currentQuestion.options[optionIndex];
        setPlayerAnswers(prev => ({
            ...prev,
            [playerId]: optionValue
        }));
    };

    // Keyboard Listener
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!gameStarted && e.key === 'Enter') {
                setGameStarted(true);
                return;
            }

            const key = e.key.toLowerCase();
            const control = CONTROLS[key];
            if (control && gameStarted) {
                submitAnswer(control.playerId, control.option);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState, playerAnswers, currentQuestion, gameStarted]);

    // Check if all players answered
    useEffect(() => {
        if (gameStarted && gameState === 'playing' && Object.keys(playerAnswers).length === 4) {
            handleRoundEnd();
        }
    }, [playerAnswers, gameState, gameStarted]);


    const handleRoundEnd = () => {
        if (gameState !== 'playing') return;
        setGameState('reveal');

        const results = {};
        const newPlayers = players.map(p => {
            const answer = playerAnswers[p.id];
            const isCorrect = answer === currentQuestion.answer;

            results[p.id] = answer ? (isCorrect ? 'correct' : 'wrong') : 'wrong';

            if (isCorrect) {
                return { ...p, score: Math.min(p.score + 10, 100) };
            }
            return p;
        });

        setRoundResults(results);
        setPlayers(newPlayers);

        // Check winner
        const winner = newPlayers.find(p => p.score >= 100);

        setTimeout(() => {
            if (winner) {
                setGameState('winner');
            } else {
                nextRound();
            }
        }, 4000); // Extended reveal time
    };

    const nextRound = () => {
        setPlayerAnswers({});
        setRoundResults({});
        setCurrentQuestionIndex(prev => (prev + 1) % questions.length);
        setGameState('playing');
    };

    const resetGame = () => {
        setPlayers(INITIAL_PLAYERS);
        setPlayerAnswers({});
        setRoundResults({});
        setCurrentQuestionIndex(0);
        setGameState('playing');
        setGameStarted(false);
    };

    if (gameState === 'loading') return <div className="text-white text-center mt-20">Loading Questions...</div>;
    if (gameState === 'error') return <div className="text-red-500 text-center mt-20">Error loading questions. Check console.</div>;

    if (!gameStarted) {
        return (
            <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20 pointer-events-none" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="z-10 flex flex-col items-center gap-8 glass-panel p-16 border-t border-white/20 shadow-2xl"
                >
                    <Zap size={80} className="text-yellow-400 filter drop-shadow-[0_0_20px_rgba(255,215,0,0.6)]" />
                    <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-green-400 to-yellow-400 tracking-tighter" style={{ fontFamily: 'monospace' }}>
                        ENERGY QUIZ
                    </h1>
                    <p className="text-xl opacity-80 max-w-md text-center">
                        4 Players. 10 Questions. <br /> Answer fast to charge your battery!
                    </p>
                    <button
                        onClick={() => setGameStarted(true)}
                        className="group relative px-12 py-4 bg-white text-black text-xl font-bold rounded-full hover:scale-105 transition-transform overflow-hidden"
                    >
                        START GAME
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-4 p-4 h-screen max-h-screen overflow-hidden">

            {/* Header */}
            <header className="flex justify-between items-center glass-panel p-3 shrink-0">
                <div className="flex items-center gap-2">
                    <Zap className="text-yellow-400" fill="currentColor" />
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400" style={{ fontFamily: 'monospace' }}>
                        ENERGY QUIZ // INDIVIDUAL
                    </h1>
                </div>
                <div className="text-sm opacity-60">Round {currentQuestionIndex + 1}</div>
            </header>

            {/* Timer & Question - Central Area */}
            <div className="shrink-0 flex flex-col items-center gap-4">
                {/* Timer */}
                <div className="w-full max-w-2xl">
                    <Timer
                        duration={currentQuestion.timeLimit || 10}
                        onTimeUp={handleRoundEnd}
                        isRunning={gameStarted && gameState === 'playing'}
                    />
                </div>

                <AnimatePresence mode='wait'>
                    {gameState !== 'winner' && (
                        <motion.div
                            key={currentQuestion.id}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="glass-panel px-8 py-4 text-center max-w-4xl"
                        >
                            <h2 className="text-2xl md:text-3xl font-bold leading-tight">
                                {currentQuestion.question}
                            </h2>
                            {/* Reveal Answer Text */}
                            {gameState === 'reveal' && (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="mt-2 text-green-400 font-bold"
                                >
                                    Correct Answer: {currentQuestion.answer}
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Players Grid */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 items-start content-start overflow-y-auto">
                {gameState === 'winner' ? (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="col-span-4 glass-panel p-12 flex flex-col items-center gap-6 text-center border-yellow-400 border-2 shadow-[0_0_100px_rgba(255,215,0,0.2)]"
                    >
                        <Trophy size={80} className="text-yellow-400 animate-bounce" />
                        <h1 className="text-5xl font-bold text-yellow-300">
                            {players.find(p => p.score >= 100)?.name} WINS!
                        </h1>
                        <p className="text-xl opacity-80">Full charge achieved.</p>
                        <button onClick={resetGame} className="btn mt-4 flex items-center gap-2 bg-yellow-400/20 hover:bg-yellow-400/40 border-yellow-400">
                            <RefreshCw size={20} /> Play Again
                        </button>
                    </motion.div>
                ) : (
                    players.map((p) => (
                        <PlayerCard
                            key={p.id}
                            player={p}
                            options={currentQuestion.options}
                            hasAnswered={playerAnswers[p.id] !== undefined}
                            result={gameState === 'reveal' ? roundResults[p.id] : null}
                            isWinner={p.score >= 100}
                            onAnswer={(optIdx) => submitAnswer(p.id, optIdx)}
                        />
                    ))
                )}
            </div>

        </div>
    );
};
export default GameContainer;
