
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { MoleHole, ScoreEntry, Difficulty } from '@/types/game';
import { useToast } from '@/hooks/use-toast';

export type MoleMashGameStatus = 'idle' | 'countdown' | 'playing' | 'gameOver';

const MOLE_MASH_GAME_DURATION = 30; // seconds
const MOLE_MASH_COUNTDOWN_SECONDS = 3;
const MOLE_MASH_LEADERBOARD_KEY = 'moleMashLeaderboard';
const GRID_SIZE = 3; // 3x3 grid

interface MoleMashDifficultySettings {
  moleVisibleMinDuration: number;
  moleVisibleMaxDuration: number;
  moleSpawnDelay: number;
}

const MOLE_MASH_DIFFICULTY_CONFIG: Record<Difficulty, MoleMashDifficultySettings> = {
  easy: {
    moleVisibleMinDuration: 1200,
    moleVisibleMaxDuration: 2000,
    moleSpawnDelay: 500,
  },
  medium: {
    moleVisibleMinDuration: 700,
    moleVisibleMaxDuration: 1200,
    moleSpawnDelay: 250,
  },
  hard: {
    moleVisibleMinDuration: 300,
    moleVisibleMaxDuration: 600,
    moleSpawnDelay: 50,
  },
};


export const useMoleMashLogic = () => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MOLE_MASH_GAME_DURATION);
  const [gameStatus, setGameStatus] = useState<MoleMashGameStatus>('idle');
  const [countdownValue, setCountdownValue] = useState(MOLE_MASH_COUNTDOWN_SECONDS);
  const [leaderboardScores, setLeaderboardScores] = useState<ScoreEntry[]>([]);
  const [moles, setMoles] = useState<MoleHole[]>(
    Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => ({ id: i, hasMole: false }))
  );
  const [activeMoleIndex, setActiveMoleIndex] = useState<number | null>(null);
  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>('medium');

  const { toast } = useToast();
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const despawnTimerRef = useRef<NodeJS.Timeout | null>(null); // For mole disappearing if not clicked
  const spawnScheduleTimerRef = useRef<NodeJS.Timeout | null>(null); // For scheduling next mole appearance
  const playerNameRef = useRef<string>('MoleMasher');
  const spawnMoleFnRef = useRef<() => void>();


  const loadLeaderboard = useCallback(() => {
    if (typeof window === 'undefined') return;
    const scores = localStorage.getItem(MOLE_MASH_LEADERBOARD_KEY);
    setLeaderboardScores(scores ? JSON.parse(scores) : []);
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const clearAllGameTimers = useCallback(() => {
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (despawnTimerRef.current) clearTimeout(despawnTimerRef.current);
    if (spawnScheduleTimerRef.current) clearTimeout(spawnScheduleTimerRef.current);
  }, []);

  const spawnMole = useCallback(() => {
    if (gameStatus !== 'playing') return;

    if (despawnTimerRef.current) clearTimeout(despawnTimerRef.current);
    if (spawnScheduleTimerRef.current) clearTimeout(spawnScheduleTimerRef.current);


    const { moleVisibleMinDuration, moleVisibleMaxDuration } = MOLE_MASH_DIFFICULTY_CONFIG[currentDifficulty];
    let newActiveMoleIndex: number | null = null;

    setMoles(currentMoles => {
      const molesCopy = currentMoles.map(mole => ({ ...mole, hasMole: false }));
      const availableHoles = molesCopy.map((_, i) => i);
      if (availableHoles.length > 0) {
          newActiveMoleIndex = availableHoles[Math.floor(Math.random() * availableHoles.length)];
          if (newActiveMoleIndex !== null) molesCopy[newActiveMoleIndex].hasMole = true;
      }
      return molesCopy;
    });
    setActiveMoleIndex(newActiveMoleIndex);

    const moleDuration = Math.random() * (moleVisibleMaxDuration - moleVisibleMinDuration) + moleVisibleMinDuration;

    despawnTimerRef.current = setTimeout(() => {
      if (gameStatus === 'playing') {
        setActiveMoleIndex(prevActiveIdx => {
            if (prevActiveIdx === newActiveMoleIndex) {
                setMoles(prevMoles =>
                    prevMoles.map((mole, idx) => idx === newActiveMoleIndex ? { ...mole, hasMole: false } : mole)
                );
                return null; 
            }
            return prevActiveIdx; 
        });
      }
    }, moleDuration);
  }, [gameStatus, currentDifficulty, setMoles, setActiveMoleIndex]);


  const handleMoleClick = useCallback((index: number) => {
    if (gameStatus !== 'playing' || index !== activeMoleIndex || !moles[index]?.hasMole) {
        return;
    }

    if (despawnTimerRef.current) clearTimeout(despawnTimerRef.current);

    setScore(prevScore => prevScore + 1);
    setMoles(prevMoles =>
      prevMoles.map((mole, idx) => (idx === index ? { ...mole, hasMole: false } : mole))
    );
    setActiveMoleIndex(null); 

    toast({ title: `+1 Point!`, description: "Good Mash!", duration: 1000 });
  }, [gameStatus, activeMoleIndex, moles, toast, setScore, setMoles, setActiveMoleIndex]);


  useEffect(() => {
    spawnMoleFnRef.current = spawnMole;
  }, [spawnMole]);

  const startGame = useCallback((difficulty: Difficulty) => {
    setCurrentDifficulty(difficulty);
    clearAllGameTimers();
    setScore(0);
    setTimeLeft(MOLE_MASH_GAME_DURATION);
    setCountdownValue(MOLE_MASH_COUNTDOWN_SECONDS);
    setGameStatus('countdown');
    setActiveMoleIndex(null);
    setMoles(prev => prev.map(mole => ({ ...mole, hasMole: false })));

    let currentCountdown = MOLE_MASH_COUNTDOWN_SECONDS;
    gameTimerRef.current = setInterval(() => {
      currentCountdown--;
      setCountdownValue(currentCountdown);
      if (currentCountdown === 0) {
        if(gameTimerRef.current) clearInterval(gameTimerRef.current);
        setGameStatus('playing');

        gameTimerRef.current = setInterval(() => {
          setTimeLeft(prevTime => {
            if (prevTime <= 1) {
              if(gameTimerRef.current) clearInterval(gameTimerRef.current);
              setGameStatus('gameOver');
              return 0;
            }
            return prevTime - 1;
          });
        }, 1000);
      }
    }, 1000);
  }, [clearAllGameTimers, setCurrentDifficulty, setGameStatus, setScore, setTimeLeft, setCountdownValue, setActiveMoleIndex, setMoles]);


  useEffect(() => {
    if (gameStatus === 'gameOver') {
      clearAllGameTimers(); // Ensure all timers are stopped
      if (typeof window !== 'undefined') {
        const currentScores = JSON.parse(localStorage.getItem(MOLE_MASH_LEADERBOARD_KEY) || '[]') as ScoreEntry[];
        const newEntry: ScoreEntry = {
          id: Date.now().toString() + Math.random().toString(36).substring(2,9),
          playerName: playerNameRef.current,
          score: score,
          date: new Date().toISOString(),
          difficulty: currentDifficulty,
        };
        currentScores.push(newEntry);
        currentScores.sort((a,b) => b.score - a.score);
        const updatedLeaderboard = currentScores.slice(0, 10);
        localStorage.setItem(MOLE_MASH_LEADERBOARD_KEY, JSON.stringify(updatedLeaderboard));
        loadLeaderboard();
      }
    }
  }, [gameStatus, score, currentDifficulty, loadLeaderboard, clearAllGameTimers]);

  // Effect to manage mole spawning when game is playing
  useEffect(() => {
    if (gameStatus === 'playing') {
      if (activeMoleIndex === null) { // If no mole is active, schedule a spawn
        const { moleSpawnDelay } = MOLE_MASH_DIFFICULTY_CONFIG[currentDifficulty];
        
        if (spawnScheduleTimerRef.current) clearTimeout(spawnScheduleTimerRef.current); 
        spawnScheduleTimerRef.current = setTimeout(() => {
          if (spawnMoleFnRef.current && gameStatus === 'playing') { // Double check status
            spawnMoleFnRef.current();
          }
        }, moleSpawnDelay); 
      }
    } else {
      // Game is not playing, clear all mole-related timers and reset mole states
      if (despawnTimerRef.current) clearTimeout(despawnTimerRef.current);
      if (spawnScheduleTimerRef.current) clearTimeout(spawnScheduleTimerRef.current);
      setActiveMoleIndex(null);
      setMoles(prev => prev.map(m => ({...m, hasMole: false})));
    }

    return () => { // Cleanup for this effect when it re-runs or unmounts
      if (spawnScheduleTimerRef.current) clearTimeout(spawnScheduleTimerRef.current);
    };
  }, [gameStatus, currentDifficulty, activeMoleIndex]);


  const restartGame = useCallback(() => {
    clearAllGameTimers();
    setGameStatus('idle');
    // Score, timeLeft, activeMoleIndex, moles are reset by effects watching gameStatus or by startGame
  }, [clearAllGameTimers]);

  // General cleanup effect for all timers when the hook unmounts
  useEffect(() => {
    return () => {
      clearAllGameTimers();
    };
  }, [clearAllGameTimers]);

  return {
    score,
    timeLeft,
    gameStatus,
    countdownValue,
    leaderboardScores,
    moles,
    gridSize: GRID_SIZE,
    currentDifficulty,
    startGame,
    restartGame,
    handleMoleClick,
    loadLeaderboard,
  };
};
