'use client';

import soundManager from '../lib/SoundManager';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlayerCard from './PlayerCard';
import Timer from './Timer';
import Registration from './Registration';
import { Crown, RefreshCw, Trophy, Upload, Volume2, VolumeX } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';
import { useRouter } from 'next/navigation';


const INITIAL_PLAYERS = [
    { id: 1, name: "Player 1", score: 0, color: "#FF6B6B", avatar: "🦁" },
    { id: 2, name: "Player 2", score: 0, color: "#4ECDC4", avatar: "🦊" },
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
    const [currentRound, setCurrentRound] = useState(1);
    const [playerQuestions, setPlayerQuestions] = useState({}); // { playerId: questionObj }
    const [gameState, setGameState] = useState('loading');
    const [playerAnswers, setPlayerAnswers] = useState({});
    const [roundResults, setRoundResults] = useState({});
    const [gameHistory, setGameHistory] = useState([]);

    // Track finish order: [{ playerId: 1, rank: 1, score: 100 }, ...]
    const [finishedPlayers, setFinishedPlayers] = useState([]);
    const [isMuted, setIsMuted] = useState(false);

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

        // Cleanup audio on unmount
        return () => {
            soundManager.stopBGM();
        };
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



    const startRound = (roundNum, currentPlayers) => {
        if (!questions || questions.length === 0) return;

        // Assign a unique random question to each player
        const newPlayerQuestions = {};
        const availableQuestions = [...questions];

        currentPlayers.forEach(p => {
            // Simple random selection. If run out, reuse.
            if (availableQuestions.length === 0) {
                availableQuestions.push(...questions);
            }
            const randomIndex = Math.floor(Math.random() * availableQuestions.length);
            const question = availableQuestions.splice(randomIndex, 1)[0];
            newPlayerQuestions[p.id] = question;
        });

        setPlayerQuestions(newPlayerQuestions);
        setCurrentRound(roundNum);
        setPlayerAnswers({});
        setRoundResults({});
        setGameState('playing');
    };

    const handleRegistrationComplete = (newPlayers) => {
        soundManager.init(); // Initialize AudioContext on user gesture
        soundManager.playClick();
        soundManager.startProceduralBGM();

        const resetPlayers = newPlayers.map(p => ({ ...p, score: 0 }));
        setPlayers(resetPlayers);
        setGameState('playing');
        setGameHistory([]);
        setFinishedPlayers([]);

        // Start Round 1
        startRound(1, resetPlayers);
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

    const toggleMute = () => {
        const newMuteState = !isMuted;
        setIsMuted(newMuteState);
        soundManager.setMute(newMuteState);
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



    const submitAnswer = (playerId, optionIndex) => {
        if (gameState !== 'playing') return;
        if (playerAnswers[playerId] !== undefined) return;
        if (finishedPlayers.some(fp => fp.playerId === playerId)) return;

        const myQuestion = playerQuestions[playerId];
        if (!myQuestion) return;

        soundManager.playClick();

        const optionValue = myQuestion.options[optionIndex];
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
    }, [gameState, playerAnswers, finishedPlayers]);

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
        let anyCorrect = false;

        const newPlayers = players.map(p => {
            if (currentFinished.some(fp => fp.playerId === p.id)) {
                return p;
            }

            const myQuestion = playerQuestions[p.id];
            const answer = playerAnswers[p.id];

            // Safety check
            if (!myQuestion) return p;

            const isCorrect = answer === myQuestion.answer;
            if (isCorrect) anyCorrect = true;

            // Record history
            setGameHistory(prev => [...prev, {
                round: currentRound,
                question: myQuestion.question,
                playerId: p.id,
                playerName: p.name,
                answer: answer || "No Answer",
                isCorrect: !!isCorrect,
                correctAnswer: myQuestion.answer
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

        // Play sound based on result
        if (anyCorrect) {
            soundManager.playCorrect();
        } else {
            soundManager.playWrong();
        }

        // Assign ranks to newly finished players
        const activePlayersAfterRound = newPlayers.filter(p => !currentFinished.some(fp => fp.playerId === p.id));
        const sortedActivePlayers = [...activePlayersAfterRound].sort((a, b) => b.score - a.score);

        let nextRank = currentFinished.length + 1;
        const updatedFinishedPlayers = currentFinished.map(fp => {
            if (fp.rank === 0) { // If rank hasn't been assigned yet
                // Find player's position relative to active players
                const player = newPlayers.find(p => p.id === fp.playerId);
                if (player) {
                    const lowerScorePlayers = sortedActivePlayers.filter(p => p.score < player.score).length;
                    return { ...fp, rank: nextRank + lowerScorePlayers };
                }
            }
            return fp;
        });

        // Sort finished players by score (desc) then by rank (asc)
        updatedFinishedPlayers.sort((a, b) => {
            const playerA = newPlayers.find(p => p.id === a.playerId);
            const playerB = newPlayers.find(p => p.id === b.playerId);
            if (playerA.score !== playerB.score) {
                return playerB.score - playerA.score;
            }
            return a.rank - b.rank;
        });

        // Re-assign ranks based on final sorted order
        const finalFinishedPlayers = updatedFinishedPlayers.map((fp, index) => ({
            ...fp,
            rank: index + 1
        }));


        setRoundResults(results);
        setPlayers(newPlayers);
        setFinishedPlayers(finalFinishedPlayers);
        setPlayerAnswers({});

        const anyFinished = newPlayers.some(p => finalFinishedPlayers.some(fp => fp.playerId === p.id));
        // Max rounds safety
        const isMaxRounds = currentRound >= 50;

        setTimeout(() => {
            if (anyFinished || isMaxRounds) {
                setGameState('winner');
                soundManager.playWin();
            } else {
                startRound(currentRound + 1, newPlayers);
            }
        }, 4000);
    };

    // const nextRound = () => { ... } // Removed, using startRound

    const resetGame = () => {
        setPlayerAnswers({});
        setRoundResults({});
        setPlayerQuestions({});
        setCurrentRound(1);
        setGameHistory([]);
        setFinishedPlayers([]);
        setGameState('registration');
    };

    const fullReset = () => {
        soundManager.stopBGM();
        router.push('/');
    };

    const getGridCols = (count) => {
        if (count <= 2) return "grid-cols-1 md:grid-cols-2";
        if (count === 3) return "grid-cols-1 md:grid-cols-3";
        if (count === 4) return "grid-cols-2 md:grid-cols-4";
        if (count <= 6) return "grid-cols-2 md:grid-cols-3";
        if (count <= 8) return "grid-cols-2 md:grid-cols-4";
        if (count <= 10) return "grid-cols-2 md:grid-cols-5";
        return "grid-cols-3 md:grid-cols-6";
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
        <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-2 p-2 h-dvh max-h-dvh overflow-hidden sticky top-0">

            {/* Header */}
            <header className="flex justify-between items-center glass-panel px-2 py-1 shrink-0 h-[40px] md:h-[50px]">
                <div className="flex items-center gap-2">
                    <Crown className="text-yellow-400 w-5 h-5 md:w-6 md:h-6" fill="currentColor" />
                    <h1 className="text-lg md:text-xl font-bold bg-clip-text text-transparent bg-linear-to-r text-white" style={{ fontFamily: 'monospace' }}>
                        EduQuiz
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleMute}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white"
                        title={isMuted ? "Unmute Music" : "Mute Music"}
                    >
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                    <div className="text-xs md:text-sm opacity-60">Round {currentRound}</div>
                </div>
            </header>

            {/* Timer & Banner */}
            <div className="shrink-0 flex flex-col items-center gap-1 max-h-[12vh]">
                <div className="w-full max-w-2xl transform scale-75 origin-top">
                    <Timer
                        key={currentRound}
                        duration={10}
                        onTimeUp={handleRoundEnd}
                        isRunning={gameState === 'playing'}
                    />
                </div>

                <AnimatePresence mode='wait'>
                    {gameState === 'playing' && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white/10 px-3 py-0.0,1 rounded-full backdrop-blur-sm border border-white/10"
                        >
                            <h2 className="text-lg font-bold text-white/80">Answer your own question!</h2>
                        </motion.div>
                    )}
                    {gameState === 'reveal' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="bg-blue-500/20 px-3 py-0.0,1 rounded-full backdrop-blur-sm border border-blue-500/30"
                        >
                            <h2 className="text-lg font-bold text-blue-200">Reviewing Answers...</h2>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Players Grid */}
            <div className={`flex-1 grid gap-1 md:gap-2 items-start content-start min-h-0 overflow-y-auto ${getGridCols(players.length)}`}>
                {gameState === 'winner' ? (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`col-span-full glass-panel p-4 md:p-8 flex flex-col items-center gap-4 text-center border-yellow-400 border-2 shadow-[0_0_100px_rgba(255,215,0,0.2)] h-full overflow-y-auto`}
                    >
                        <Trophy size={40} className="text-yellow-400 animate-bounce md:w-[60px] md:h-[60px]" />
                        <h1 className="text-2xl md:text-4xl font-bold text-yellow-300">LEADERBOARD</h1>

                        <div className="w-full max-w-2xl flex flex-col gap-2 flex-1 overflow-y-auto min-h-0">
                            {getLeaderboard().map((p, idx) => (
                                <div key={p.id} className="flex items-center gap-3 bg-white/10 p-2 md:p-4 rounded-xl border border-white/10 shrink-0">
                                    <div className="text-xl md:text-3xl font-bold w-8 md:w-12 text-yellow-400">#{idx + 1}</div>
                                    <div className="text-2xl md:text-4xl">{p.avatar}</div>
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="font-bold text-base md:text-xl truncate">{p.name}</div>
                                        <div className="text-xs md:text-sm opacity-60">{p.status === 'Finished' ? 'Finished!' : 'Completed'}</div>
                                    </div>
                                    <div className="text-lg md:text-2xl font-mono text-green-400 whitespace-nowrap">{p.score} pts</div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2 mt-4 flex-wrap justify-center shrink-0">
                            <button onClick={handleDownloadResults} className="btn flex items-center gap-2 bg-green-500/20 hover:bg-green-500/40 border-green-500 text-sm py-2">
                                <Download size={16} /> <span className="hidden md:inline">Download Results</span>
                            </button>
                            <button onClick={resetGame} className="btn flex items-center gap-2 bg-yellow-400/20 hover:bg-yellow-400/40 border-yellow-400 text-sm py-2">
                                <RefreshCw size={16} /> Play Again
                            </button>
                            <button onClick={fullReset} className="btn flex items-center gap-2 bg-red-400/20 hover:bg-red-400/40 border-red-400 text-sm py-2">
                                <RefreshCw size={16} /> Exit
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
                                question={playerQuestions[p.id]}
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
