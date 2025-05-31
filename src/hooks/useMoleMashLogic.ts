
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
  moleSpawnDelay: number; // Time before a new mole appears after one is hit or disappears
}

const MOLE_MASH_DIFFICULTY_CONFIG: Record<Difficulty, MoleMashDifficultySettings> = {
  easy: {
    moleVisibleMinDuration: 1200, // Slightly increased
    moleVisibleMaxDuration: 2000, // Slightly increased
    moleSpawnDelay: 500,       // Slightly increased
  },
  medium: {
    moleVisibleMinDuration: 700, // Slightly increased
    moleVisibleMaxDuration: 1200, // Slightly increased
    moleSpawnDelay: 250,       // Slightly increased
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
  const moleTimerRef = useRef<NodeJS.Timeout | null>(null);
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

  const clearTimers = useCallback(() => {
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (moleTimerRef.current) clearTimeout(moleTimerRef.current);
  }, []);

  const spawnMole = useCallback(() => {
    // This function's logic is complex and depends on gameStatus and currentDifficulty
    // which are stable during its execution or handled by the effect's dependencies.
    // The direct dependencies like activeMoleIndex are captured, 
    // and setMoles uses a functional update to avoid needing 'moles' as a dependency.
    if (gameStatus !== 'playing') return;

    if (moleTimerRef.current) clearTimeout(moleTimerRef.current);

    const { moleVisibleMinDuration, moleVisibleMaxDuration, moleSpawnDelay } = MOLE_MASH_DIFFICULTY_CONFIG[currentDifficulty];

    let newActiveMoleIndex: number | null = null; // Initialize to null
    setMoles(prevMoles => {
      const molesCopy = prevMoles.map(mole => ({ ...mole, hasMole: false })); 
      const availableHoles = molesCopy.map((_, i) => i).filter(i => i !== activeMoleIndex); 
      
      if (availableHoles.length === 0 && molesCopy.length > 0) { 
          newActiveMoleIndex = 0;
      } else if (availableHoles.length > 0) {
          newActiveMoleIndex = availableHoles[Math.floor(Math.random() * availableHoles.length)];
      }
      // newActiveMoleIndex remains null if no holes are available (empty grid, theoretically)

      if (newActiveMoleIndex !== null) {
        molesCopy[newActiveMoleIndex].hasMole = true;
      }
      return molesCopy;
    });
    setActiveMoleIndex(newActiveMoleIndex); // Update activeMoleIndex after setMoles


    const moleDuration = Math.random() * (moleVisibleMaxDuration - moleVisibleMinDuration) + moleVisibleMinDuration;
    
    moleTimerRef.current = setTimeout(() => {
      if (gameStatus === 'playing') { // Check game status again inside timeout
        if (newActiveMoleIndex !== null) { // Check if a mole was actually spawned
            setMoles(prevMoles => 
              prevMoles.map((mole, idx) => idx === newActiveMoleIndex ? { ...mole, hasMole: false } : mole)
            );
        }
        setActiveMoleIndex(null);
        
        if (spawnMoleFnRef.current) { 
            moleTimerRef.current = setTimeout(spawnMoleFnRef.current, moleSpawnDelay);
        }
      }
    }, moleDuration);
  }, [gameStatus, currentDifficulty, activeMoleIndex]);

  useEffect(() => {
    spawnMoleFnRef.current = spawnMole;
  }, [spawnMole]);

  const startGame = useCallback((difficulty: Difficulty) => {
    setCurrentDifficulty(difficulty);
    clearTimers();
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
        clearInterval(gameTimerRef.current!);
        setGameStatus('playing');
        
        gameTimerRef.current = setInterval(() => {
          setTimeLeft(prevTime => {
            if (prevTime <= 1) {
              clearTimers();
              setGameStatus('gameOver');
              const finalScore = score; 
              const finalDifficulty = currentDifficulty; // Capture difficulty at game over
              if (typeof window !== 'undefined') {
                const currentScores = JSON.parse(localStorage.getItem(MOLE_MASH_LEADERBOARD_KEY) || '[]') as ScoreEntry[];
                const newEntry: ScoreEntry = {
                  id: Date.now().toString() + Math.random().toString(36).substring(2,9),
                  playerName: playerNameRef.current,
                  score: finalScore,
                  date: new Date().toISOString(),
                  difficulty: finalDifficulty, 
                };
                currentScores.push(newEntry);
                currentScores.sort((a,b) => b.score - a.score);
                const updatedLeaderboard = currentScores.slice(0, 10);
                localStorage.setItem(MOLE_MASH_LEADERBOARD_KEY, JSON.stringify(updatedLeaderboard));
              }
              loadLeaderboard();
              setActiveMoleIndex(null);
              setMoles(prev => prev.map(mole => ({ ...mole, hasMole: false })));
              return 0;
            }
            return prevTime - 1;
          });
        }, 1000);
      }
    }, 1000);
  }, [clearTimers, loadLeaderboard, score, currentDifficulty]); 

  const handleMoleClick = useCallback((index: number) => {
    if (gameStatus !== 'playing' || index !== activeMoleIndex || !moles[index]?.hasMole) return;

    if (moleTimerRef.current) clearTimeout(moleTimerRef.current); 
    
    setScore(prevScore => prevScore + 1);
    setMoles(prevMoles => 
      prevMoles.map((mole, idx) => (idx === index ? { ...mole, hasMole: false } : mole))
    );
    setActiveMoleIndex(null);
    
    toast({
      title: `+1 Point!`,
      description: "Good Mash!",
      duration: 1000,
    });
    const { moleSpawnDelay } = MOLE_MASH_DIFFICULTY_CONFIG[currentDifficulty];
    if (spawnMoleFnRef.current) { 
        moleTimerRef.current = setTimeout(spawnMoleFnRef.current, moleSpawnDelay); 
    }
  }, [gameStatus, activeMoleIndex, moles, toast, currentDifficulty]);


  useEffect(() => {
    if (gameStatus === 'playing') {
      const { moleSpawnDelay } = MOLE_MASH_DIFFICULTY_CONFIG[currentDifficulty];
      if (moleTimerRef.current) clearTimeout(moleTimerRef.current); 
      
      moleTimerRef.current = setTimeout(() => {
        if (spawnMoleFnRef.current) {
          spawnMoleFnRef.current();
        }
      }, moleSpawnDelay);
      
      return () => {
        if (moleTimerRef.current) clearTimeout(moleTimerRef.current);
      };
    } else if (gameStatus !== 'playing') {
        clearTimers();
        setActiveMoleIndex(null);
        setMoles(prev => prev.map(m => ({...m, hasMole: false})));
    }
  }, [gameStatus, currentDifficulty, clearTimers]);


  const restartGame = useCallback(() => {
    clearTimers();
    setGameStatus('idle');
    setActiveMoleIndex(null);
    setMoles(prev => prev.map(mole => ({ ...mole, hasMole: false })));
    setScore(0);
    setTimeLeft(MOLE_MASH_GAME_DURATION);
    // No need to reset countdownValue here as 'idle' state handles it
    // No need to reset leaderboardScores or currentDifficulty here
  }, [clearTimers]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

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
    restartGame, // Added definition
    handleMoleClick,
    loadLeaderboard,
  };
};
