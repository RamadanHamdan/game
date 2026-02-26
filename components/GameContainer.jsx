'use client';

import soundManager from '../lib/SoundManager';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlayerCard from './PlayerCard';
import Timer from './Timer';
import Registration from './Registration';
import AIGenerator from './AIGenerator';
import { Crown, RefreshCw, Trophy, Upload, Volume2, VolumeX, Download, Pause, Play, Sparkles } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';
import { saveAsXLSX } from '../lib/ExcelUtils';

// DnD Kit Imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

// --- Sortable Player Wrapper ---
const SortablePlayerCard = (props) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: props.player.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        touchAction: 'none', // Crucial for touch dragging
        zIndex: isDragging ? 999 : 'auto',
        height: '100%',
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="h-full w-full">
            <PlayerCard {...props} />
        </div>
    );
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
    const [activeDragId, setActiveDragId] = useState(null);
    const [isPaused, setIsPaused] = useState(false);
    const [showAIGenerator, setShowAIGenerator] = useState(false);

    const togglePause = () => {
        setIsPaused(prev => !prev);
    };

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement before drag starts (prevents accidental drags on clicks)
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const loadDefaultQuestions = React.useCallback(() => {
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
    }, []);

    const startRound = React.useCallback((roundNum, currentPlayers) => {
        if (!questions || questions.length === 0) return;

        const newPlayerQuestions = {};
        const availableQuestions = [...questions];

        currentPlayers.forEach(p => {
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
    }, [questions]);

    const handleRoundEnd = React.useCallback(() => {
        if (gameState !== 'playing') return;
        setGameState('reveal');
        const results = {};
        let currentFinished = [...finishedPlayers];
        let anyCorrect = false;

        const newPlayers = players.map(p => {
            if (currentFinished.some(fp => fp.playerId === p.id)) return p;
            const myQuestion = playerQuestions[p.id];
            const answer = playerAnswers[p.id];
            if (!myQuestion) return p;

            let isCorrect = false;
            if (myQuestion.type === 'essay') {
                isCorrect = typeof answer === 'string' && answer.trim().length > 0;
            } else {
                isCorrect = answer === myQuestion.answer;
            }

            if (isCorrect) anyCorrect = true;

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
                if (newScore >= 100) {
                    const nextRank = currentFinished.length + 1;
                    currentFinished.push({ playerId: p.id, rank: nextRank, score: newScore });
                }
                return { ...p, score: newScore };
            }
            return p;
        });

        if (anyCorrect) soundManager.playCorrect(); else soundManager.playWrong();

        const activePlayersAfterRound = newPlayers.filter(p => !currentFinished.some(fp => fp.playerId === p.id));
        const sortedActivePlayers = [...activePlayersAfterRound].sort((a, b) => b.score - a.score);

        let nextRank = currentFinished.length + 1;
        const updatedFinishedPlayers = currentFinished.map(fp => {
            if (fp.rank === 0) {
                const player = newPlayers.find(p => p.id === fp.playerId);
                if (player) {
                    const lowerScorePlayers = sortedActivePlayers.filter(p => p.score < player.score).length;
                    return { ...fp, rank: nextRank + lowerScorePlayers };
                }
            }
            return fp;
        });

        updatedFinishedPlayers.sort((a, b) => {
            const playerA = newPlayers.find(p => p.id === a.playerId);
            const playerB = newPlayers.find(p => p.id === b.playerId);
            if (playerA.score !== playerB.score) return playerB.score - playerA.score;
            return a.rank - b.rank;
        });

        const finalFinishedPlayers = updatedFinishedPlayers.map((fp, index) => ({ ...fp, rank: index + 1 }));

        setRoundResults(results);
        setPlayers(newPlayers);
        setFinishedPlayers(finalFinishedPlayers);
        setPlayerAnswers({});

        const anyFinished = newPlayers.some(p => finalFinishedPlayers.some(fp => fp.playerId === p.id));
        const isMaxRounds = currentRound >= 50;

        setTimeout(() => {
            if (anyFinished || isMaxRounds) {
                setGameState('winner');
                soundManager.playWin();
            } else {
                startRound(currentRound + 1, newPlayers);
            }
        }, 4000);
    }, [gameState, finishedPlayers, players, playerQuestions, playerAnswers, currentRound, startRound]);

    const submitAnswer = React.useCallback((playerId, answerInput) => {
        if (gameState !== 'playing') return;
        if (isPaused) return;
        if (playerAnswers[playerId] !== undefined) return;
        if (finishedPlayers.some(fp => fp.playerId === playerId)) return;

        const myQuestion = playerQuestions[playerId];
        if (!myQuestion) return;

        soundManager.playClick();

        let answerValue;
        if (typeof answerInput === 'number' && myQuestion.type !== 'essay') {
            answerValue = myQuestion.options[answerInput];
        } else {
            answerValue = answerInput;
        }

        setPlayerAnswers(prev => ({ ...prev, [playerId]: answerValue }));
    }, [gameState, isPaused, playerAnswers, finishedPlayers, playerQuestions]);

    // Load default questions initially
    useEffect(() => {
        const storedQuestions = sessionStorage.getItem('quizQuestions');
        if (storedQuestions) {
            try {
                const parsed = JSON.parse(storedQuestions);
                setQuestions(parsed);
                setGameState('registration');
            } catch (e) {
                console.error("Failed to parse stored questions", e);
                loadDefaultQuestions();
            }
        } else {
            loadDefaultQuestions();
        }

        return () => {
            soundManager.stopBGM();
        };
    }, [loadDefaultQuestions]);

    const handleRegistrationComplete = (newPlayers) => {
        soundManager.init();
        soundManager.playClick();
        soundManager.startProceduralBGM();

        const resetPlayers = newPlayers.map(p => ({ ...p, score: 0 }));
        setPlayers(resetPlayers);
        setGameState('playing');
        setGameHistory([]);
        setFinishedPlayers([]);

        startRound(1, resetPlayers);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                // Basic validation/mapping
                const formattedQuestions = data.map((row, idx) => ({
                    id: idx + 1,
                    question: row.Question || row.question,
                    options: [row.OptionA || row.A, row.OptionB || row.B, row.OptionC || row.C, row.OptionD || row.D],
                    answer: row.Answer || row.answer, // Should be the string value of the answer
                })).filter(q => q.question && q.answer && q.options.every(o => o));

                if (formattedQuestions.length > 0) {
                    setQuestions(formattedQuestions);
                    sessionStorage.setItem('quizQuestions', JSON.stringify(formattedQuestions));
                    alert(`Successfully loaded ${formattedQuestions.length} questions!`);
                } else {
                    alert("No valid questions found in the file. Please check the format.");
                }
            } catch (err) {
                console.error("Error parsing excel:", err);
                alert("Failed to parse Excel file");
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleDownloadTemplate = async () => {
        const template = [
            { Question: "Example Question?", OptionA: "Answer 1", OptionB: "Answer 2", OptionC: "Answer 3", OptionD: "Answer 4", Answer: "Answer 1" }
        ];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        await saveAsXLSX(wb, "quiz_template.xlsx");
    };

    const toggleMute = () => {
        const newMuteState = !isMuted;
        setIsMuted(newMuteState);
        soundManager.setMute(newMuteState);
    };

    // DnD Handler
    const handleDragStart = (event) => {
        setActiveDragId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveDragId(null);

        if (active && over && active.id !== over.id) {
            setPlayers((items) => {
                const oldIndex = items.findIndex(p => p.id === active.id);
                const newIndex = items.findIndex(p => p.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    // ... (Existing Game Logic: getLeaderboard, handleDownloadResults, submitAnswer, handleRoundEnd, resetGame, etc.)
    const getLeaderboard = () => {
        const finishers = [...finishedPlayers].sort((a, b) => a.rank - b.rank);
        const finisherIds = new Set(finishers.map(f => f.playerId));
        const active = players.filter(p => !finisherIds.has(p.id));
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

    const handleDownloadResults = async () => {
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
        await saveAsXLSX(wb, `quiz_results_${timestamp}.xlsx`);
    };

    useEffect(() => {
        if (!players) return;
        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase();
            const control = CONTROLS[key];
            if (control && gameState === 'playing') {
                submitAnswer(control.playerId, control.option);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState, submitAnswer, players]);

    useEffect(() => {
        if (gameState === 'playing') {
            const activePlayers = players.filter(p => !finishedPlayers.some(fp => fp.playerId === p.id));
            const activeAnswers = activePlayers.filter(p => playerAnswers[p.id] !== undefined);
            if ((activePlayers.length > 0 && activeAnswers.length === activePlayers.length) || (activePlayers.length === 0)) {
                handleRoundEnd();
            }
        }
    }, [playerAnswers, gameState, finishedPlayers, players, handleRoundEnd]);


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

    if (gameState === 'loading') return <div className="text-white text-center mt-20">Loading...</div>;
    if (gameState === 'error') return <div className="text-red-500 text-center mt-20">Error loading questions. Check console.</div>;

    if (gameState === 'registration') {
        return (
            <>
                <Registration
                    onStartGame={handleRegistrationComplete}
                    initialPlayers={players}
                    onUpload={handleFileUpload}
                    onDownloadTemplate={handleDownloadTemplate}
                    onOpenAIWizard={() => setShowAIGenerator(true)}
                />
                <AIGenerator
                    isOpen={showAIGenerator}
                    onClose={() => setShowAIGenerator(false)}
                    onQuestionsGenerated={(newQuestions) => {
                        setQuestions(newQuestions);
                        sessionStorage.setItem('quizQuestions', JSON.stringify(newQuestions));
                        alert(`Berhasil menciptakan ${newQuestions.length} soal!`);
                    }}
                />
            </>
        );
    }

    // Dynamic Layout Logic
    const getItemStyle = (count) => {
        if (count <= 1) return { width: '100%', maxWidth: '800px', height: '100%' };
        // Force 2x2 grid for 4 players (roughly 48% width + gap)
        if (count === 4) return { width: '48%', minWidth: '320px', height: '45%' };
        if (count === 3) return { width: '30%', minWidth: '300px', height: '100%' };
        if (count === 2) return { width: '48%', minWidth: '320px', height: '100%' };

        // fallback generic
        return { width: '32%', minWidth: '300px', flexGrow: 1, padding: '10px' };
    };

    // Tailwind classes based on count for more responsive control if needed, 
    // but inline style works better for specific % requirements
    const getDynamicItemClass = (count) => {
        // Base classes
        let classes = "flex-grow min-w-[300px] h-full";

        if (count === 4) {
            // on md screens and up, force 48% width (approx half)
            // max-h-[48%] to ensure they fit 2 per column in available height
            classes = "w-full md:w-[48%] h-[280px] md:h-[45%]";
        } else if (count === 2) {
            classes = "w-full md:w-[48%] h-[350px] md:h-full";
        } else if (count === 3) {
            classes = "w-full md:w-[32%] h-[320px] md:h-full";
        } else if (count >= 5) {
            classes = "w-full md:w-[32%] h-[300px] md:h-[45%]";
        }

        return classes;
    }


    return (
        <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-2 p-2 h-dvh max-h-dvh overflow-hidden sticky top-0">
            {/* Header */}
            <header className="flex justify-between items-center glass-panel px-2 py-1 shrink-0 h-[40px] md:h-[50px] border-blue-500/30">
                <div className="flex items-center gap-2">
                    <Crown className="text-yellow-400 w-5 h-5 md:w-6 md:h-6" fill="currentColor" />
                    <h1 className="text-lg md:text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-purple-400" style={{ fontFamily: 'monospace' }}>
                        EduQuiz
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    {gameState === 'playing' && (
                        <button
                            onClick={togglePause}
                            className={`p-2 rounded-full transition-colors ${isPaused ? 'bg-yellow-500 text-black' : 'hover:bg-white/10 text-white/80 hover:text-white'}`}
                            title={isPaused ? "Resume Game" : "Pause Game"}
                        >
                            {isPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
                        </button>
                    )}
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
                        isRunning={gameState === 'playing' && !isPaused}
                    />
                </div>

                <AnimatePresence mode='wait'>
                    {gameState === 'playing' && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white/10 px-3 py-0.5 rounded-full backdrop-blur-sm border border-white/10"
                        >
                            <h2 className="text-lg font-bold text-white/80">Answer your own question!</h2>
                        </motion.div>
                    )}
                    {gameState === 'playing' && isPaused && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="bg-yellow-500/20 px-4 py-1 rounded-full backdrop-blur-sm border border-yellow-500/50"
                        >
                            <h2 className="text-xl font-bold text-yellow-200 animate-pulse">GAME PAUSED</h2>
                        </motion.div>
                    )}
                    {gameState === 'reveal' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="bg-blue-500/20 px-3 py-0.5 rounded-full backdrop-blur-sm border border-blue-500/30"
                        >
                            <h2 className="text-lg font-bold text-blue-200">Reviewing Answers...</h2>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Players Grid with Drag and Drop */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                {/* Dynamically Sized Flex Container */}
                <div className="flex-1 flex flex-wrap content-start items-start justify-center gap-4 p-2 overflow-y-auto w-full relative">

                    {/* Pause Overlay */}
                    <AnimatePresence>
                        {isPaused && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl pointer-events-auto"
                            >
                                <Pause size={64} className="text-white/50 mb-4" />
                                <h2 className="text-3xl font-bold text-white mb-8">PAUSED</h2>
                                <button
                                    onClick={togglePause}
                                    className="btn bg-white text-black hover:bg-white/90 px-8 py-3 rounded-full font-bold flex items-center gap-2 text-xl"
                                >
                                    <Play size={24} fill="currentColor" /> RESUME
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {gameState === 'winner' ? (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`w-full h-full glass-panel p-4 md:p-8 flex flex-col items-center gap-4 text-center border-yellow-400 border-2 shadow-[0_0_100px_rgba(255,215,0,0.2)] overflow-y-auto`}
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
                        <SortableContext
                            items={players.map(p => p.id)}
                            strategy={rectSortingStrategy}
                        >
                            {players.map((p) => {
                                const isFinished = finishedPlayers.some(fp => fp.playerId === p.id);
                                const rank = [...players].sort((a, b) => b.score - a.score).findIndex(player => player.id === p.id) + 1;

                                // Dynamic Sizing
                                const itemClass = getDynamicItemClass(players.length);

                                return (
                                    <div key={p.id} className={`${itemClass} transition-all duration-300`}>
                                        <SortablePlayerCard
                                            player={p}
                                            question={playerQuestions[p.id]}
                                            hasAnswered={playerAnswers[p.id] !== undefined || isFinished}
                                            result={gameState === 'reveal' ? roundResults[p.id] : null}
                                            isWinner={p.score >= 100}
                                            onAnswer={(optIdx) => submitAnswer(p.id, optIdx)}
                                            rank={rank}
                                        />
                                    </div>
                                );
                            })}
                        </SortableContext>
                    )}
                </div>
                {/* Drag Overlay for smooth visual feedback - Optional but good for UX */}
                <DragOverlay>
                    {activeDragId ? (
                        <div className="opacity-80">
                            {/* Can put a placeholder here */}
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
};
export default GameContainer;
