'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlayerCard from './PlayerCard';
import Timer from './Timer';
import Registration from './Registration';
import { Crown, RefreshCw, Trophy, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
    const router = useRouter();
    const [questions, setQuestions] = useState([]);
    const [players, setPlayers] = useState(INITIAL_PLAYERS);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [gameState, setGameState] = useState('loading');
    const [playerAnswers, setPlayerAnswers] = useState({});
    const [roundResults, setRoundResults] = useState({});
    const [gameHistory, setGameHistory] = useState([]);

    // Track finish order: [{ playerId: 1, rank: 1, score: 100 }, ...]
    const [finishedPlayers, setFinishedPlayers] = useState([]);

    // Load default questions initially
    // Load questions (check session storage first)
    useEffect(() => {
        const storedQuestions = sessionStorage.getItem('quizQuestions');
        if (storedQuestions) {
            try {
                setQuestions(JSON.parse(storedQuestions));
                setGameState('registration');
            } catch (e) {
                console.error("Failed to parse stored questions", e);
                loadDefaultQuestions();
            }
        } else {
            loadDefaultQuestions();
        }
    }, []);

    const loadDefaultQuestions = () => {
        fetch('/questions.json')
            .then(res => res.json())
            .then(data => {
                setQuestions(data);
                setGameState('registration');
            })
            .catch(err => {
                console.error("Failed to load questions", err);
                setGameState('error');
            });
    };



    const handleRegistrationComplete = (newPlayers) => {
        const resetPlayers = newPlayers.map(p => ({ ...p, score: 0 }));
        setPlayers(resetPlayers);
        setGameState('playing');
        setGameHistory([]);
        setFinishedPlayers([]);
    };

    const getLeaderboard = () => {
        // combine finished players (sorted by rank) with active players (sorted by score)
        const finishers = [...finishedPlayers].sort((a, b) => a.rank - b.rank);
        const finisherIds = new Set(finishers.map(f => f.playerId));

        const active = players
            .filter(p => !finisherIds.has(p.id))
            .sort((a, b) => b.score - a.score);

        // Map back to full player objects with rank
        const leaderboard = [];

        finishers.forEach(f => {
            const p = players.find(pl => pl.id === f.playerId);
            if (p) leaderboard.push({ ...p, rank: f.rank, status: 'Finished' });
        });

        active.forEach((p, idx) => {
            leaderboard.push({ ...p, rank: finishers.length + idx + 1, status: 'Active' });
        });

        return leaderboard;
    };


    const handleDownloadResults = () => {
        const leaderboard = getLeaderboard();

        const leaderboardData = leaderboard.map(p => ({
            "Rank": p.rank,
            "Player": p.name,
            "Total Score": p.score,
            "Status": p.status
        }));
        const wsLeaderboard = XLSX.utils.json_to_sheet(leaderboardData);

        const historyData = gameHistory.map(h => ({
            "Round": h.round,
            "Question": h.question,
            "Player": h.playerName,
            "Answer": h.answer,
            "Result": h.isCorrect ? "Correct" : "Wrong",
            "Correct Answer": h.correctAnswer
        }));
        const wsHistory = XLSX.utils.json_to_sheet(historyData);

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, wsLeaderboard, "Leaderboard");
        XLSX.utils.book_append_sheet(wb, wsHistory, "Answer Details");

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        XLSX.writeFile(wb, `quiz_results_${timestamp}.xlsx`);
    };

    const currentQuestion = questions[currentQuestionIndex];

    const submitAnswer = (playerId, optionIndex) => {
        if (gameState !== 'playing') return;
        // Check if player has already answered OR is finished
        if (playerAnswers[playerId] !== undefined) return;
        if (finishedPlayers.some(fp => fp.playerId === playerId)) return;

        const optionValue = currentQuestion.options[optionIndex];
        setPlayerAnswers(prev => ({
            ...prev,
            [playerId]: optionValue
        }));
    };

    useEffect(() => {
        if (!players) return; // Guard
        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase();
            const control = CONTROLS[key];
            if (control && gameState === 'playing') {
                submitAnswer(control.playerId, control.option);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState, playerAnswers, currentQuestion, finishedPlayers]);

    // Check if all ACTIVE players answered
    useEffect(() => {
        if (gameState === 'playing') {
            const activePlayers = players.filter(p => !finishedPlayers.some(fp => fp.playerId === p.id));
            const activeAnswers = activePlayers.filter(p => playerAnswers[p.id] !== undefined);

            // If ALL active players have answered (and there is at least one active player)
            // Or if everyone is finished (edge case handled in round end but useful here)
            if (activePlayers.length > 0 && activeAnswers.length === activePlayers.length) {
                handleRoundEnd();
            } else if (activePlayers.length === 0) {
                // Everyone finished
                handleRoundEnd();
            }
        }
    }, [playerAnswers, gameState, finishedPlayers, players]);


    const handleRoundEnd = () => {
        if (gameState !== 'playing') return;
        setGameState('reveal');

        const results = {};
        let currentFinished = [...finishedPlayers];

        const newPlayers = players.map(p => {
            // If player already finished, keep them as is
            if (currentFinished.some(fp => fp.playerId === p.id)) {
                return p;
            }

            const answer = playerAnswers[p.id];
            const isCorrect = answer === currentQuestion.answer;

            // Record history
            setGameHistory(prev => [...prev, {
                round: currentQuestionIndex + 1,
                question: currentQuestion.question,
                playerId: p.id,
                playerName: p.name,
                answer: answer || "No Answer",
                isCorrect: !!isCorrect,
                correctAnswer: currentQuestion.answer
            }]);

            results[p.id] = answer ? (isCorrect ? 'correct' : 'wrong') : 'wrong';

            if (isCorrect) {
                const newScore = p.score + 10;
                // Check if they just hit the finish line (100)
                if (newScore >= 100) {
                    const nextRank = currentFinished.length + 1;
                    currentFinished.push({ playerId: p.id, rank: nextRank, score: newScore });
                }
                return { ...p, score: newScore };
            }
            return p;
        });

        setRoundResults(results);
        setPlayers(newPlayers);
        setFinishedPlayers(currentFinished);

        const isLastQuestion = currentQuestionIndex >= questions.length - 1;
        const allFinished = currentFinished.length === players.length;

        setTimeout(() => {
            if (allFinished || isLastQuestion) {
                setGameState('winner');
            } else {
                nextRound();
            }
        }, 4000);
    };

    const nextRound = () => {
        setPlayerAnswers({});
        setRoundResults({});
        setCurrentQuestionIndex(prev => prev + 1);
        setGameState('playing');
    };

    const resetGame = () => {
        // Go back to registration logic
        setPlayerAnswers({});
        setRoundResults({});
        setCurrentQuestionIndex(0);
        setGameHistory([]);
        setFinishedPlayers([]);
        setGameState('registration');
    };

    const fullReset = () => {
        router.push('/');
    };

    if (gameState === 'loading') return <div className="text-white text-center mt-20">Loading...</div>;
    if (gameState === 'error') return <div className="text-red-500 text-center mt-20">Error loading questions. Check console.</div>;

    if (gameState === 'registration') {
        return (
            <Registration
                onStartGame={handleRegistrationComplete}
                initialPlayers={players}
            />
        );
    }

    return (
        <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-4 p-4 h-screen max-h-screen overflow-hidden">

            {/* Header */}
            <header className="flex justify-between items-center glass-panel p-3 shrink-0">
                <div className="flex items-center gap-2">
                    <Crown className="text-yellow-400" fill="currentColor" />
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-400" style={{ fontFamily: 'monospace' }}>
                        HDe Quiz
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
                        isRunning={gameState === 'playing'}
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
                                    className="mt-2 text-blue-400 font-bold"
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
                        className="col-span-4 glass-panel p-8 flex flex-col items-center gap-6 text-center border-yellow-400 border-2 shadow-[0_0_100px_rgba(255,215,0,0.2)] max-h-[80vh] overflow-y-auto"
                    >
                        <Trophy size={60} className="text-yellow-400 animate-bounce" />
                        <h1 className="text-4xl font-bold text-yellow-300">LEADERBOARD</h1>

                        <div className="w-full max-w-2xl flex flex-col gap-3">
                            {getLeaderboard().map((p, idx) => (
                                <div key={p.id} className="flex items-center gap-4 bg-white/10 p-4 rounded-xl border border-white/10">
                                    <div className="text-3xl font-bold w-12 text-yellow-400">#{idx + 1}</div>
                                    <div className="text-4xl">{p.avatar}</div>
                                    <div className="flex-1 text-left">
                                        <div className="font-bold text-xl">{p.name}</div>
                                        <div className="text-sm opacity-60">{p.status === 'Finished' ? 'Finished!' : 'Completed'}</div>
                                    </div>
                                    <div className="text-2xl font-mono text-green-400">{p.score} pts</div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-4 mt-6">
                            <button onClick={handleDownloadResults} className="btn flex items-center gap-2 bg-green-500/20 hover:bg-green-500/40 border-green-500">
                                <Download size={20} /> Download Results (Excel)
                            </button>
                            <button onClick={resetGame} className="btn flex items-center gap-2 bg-yellow-400/20 hover:bg-yellow-400/40 border-yellow-400">
                                <RefreshCw size={20} /> Play Again
                            </button>
                            <button onClick={fullReset} className="btn flex items-center gap-2 bg-red-400/20 hover:bg-red-400/40 border-red-400">
                                <RefreshCw size={20} /> Exit
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    players.map((p) => {
                        const isFinished = finishedPlayers.some(fp => fp.playerId === p.id);
                        return (
                            <PlayerCard
                                key={p.id}
                                player={p}
                                options={currentQuestion.options}
                                hasAnswered={playerAnswers[p.id] !== undefined || isFinished}
                                result={gameState === 'reveal' ? roundResults[p.id] : null}
                                isWinner={p.score >= 100}
                                onAnswer={(optIdx) => submitAnswer(p.id, optIdx)}
                            />
                        );
                    })
                )}
            </div>

        </div>
    );
};
export default GameContainer;
