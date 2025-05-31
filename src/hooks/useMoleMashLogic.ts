
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
    moleVisibleMinDuration: 800, // Moles stay visible a bit longer
    moleVisibleMaxDuration: 1600,
    moleSpawnDelay: 350, // Slower mole respawn
  },
  medium: {
    moleVisibleMinDuration: 550, // Moles are quicker
    moleVisibleMaxDuration: 1200,
    moleSpawnDelay: 180, // Faster respawn
  },
  hard: {
    moleVisibleMinDuration: 300, // Very quick moles
    moleVisibleMaxDuration: 650,
    moleSpawnDelay: 80, // Very fast respawn
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
  const moleTimerRef = useRef<NodeJS.Timeout | null>(null); // Controls individual mole lifetime and next spawn
  const playerNameRef = useRef<string>('MoleMasher');

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
    if (gameStatus !== 'playing') return;

    if (moleTimerRef.current) clearTimeout(moleTimerRef.current); // Clear previous mole's despawn/respawn timer

    const { moleVisibleMinDuration, moleVisibleMaxDuration, moleSpawnDelay } = MOLE_MASH_DIFFICULTY_CONFIG[currentDifficulty];

    // Hide any currently active mole before showing a new one
    if (activeMoleIndex !== null) {
      setMoles(prevMoles => 
        prevMoles.map((mole, idx) => idx === activeMoleIndex ? { ...mole, hasMole: false } : mole)
      );
      setActiveMoleIndex(null);
    }

    const availableHoles = moles.map((_, i) => i); // All holes are potentially available
    if (availableHoles.length === 0) { // Should not happen in a fixed grid
        if (gameStatus === 'playing') moleTimerRef.current = setTimeout(spawnMole, moleSpawnDelay);
        return;
    }
    
    const randomIndex = availableHoles[Math.floor(Math.random() * availableHoles.length)];
    
    setMoles(prevMoles => 
      prevMoles.map((mole, idx) => ({ ...mole, hasMole: idx === randomIndex }))
    );
    setActiveMoleIndex(randomIndex);

    const moleDuration = Math.random() * (moleVisibleMaxDuration - moleVisibleMinDuration) + moleVisibleMinDuration;
    
    // This timer handles both the mole disappearing AND scheduling the next spawn
    moleTimerRef.current = setTimeout(() => {
      if (gameStatus === 'playing') {
        // Make current mole disappear
        setMoles(prevMoles => prevMoles.map((mole, idx) => idx === randomIndex ? { ...mole, hasMole: false } : mole));
        setActiveMoleIndex(null);
        // Schedule next mole spawn after moleSpawnDelay
        moleTimerRef.current = setTimeout(spawnMole, moleSpawnDelay);
      }
    }, moleDuration);
  }, [moles, activeMoleIndex, gameStatus, currentDifficulty]);


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
              if (typeof window !== 'undefined') {
                const currentScores = JSON.parse(localStorage.getItem(MOLE_MASH_LEADERBOARD_KEY) || '[]') as ScoreEntry[];
                const newEntry: ScoreEntry = {
                  id: Date.now().toString() + Math.random().toString(36).substring(2,9),
                  playerName: playerNameRef.current,
                  score: finalScore,
                  date: new Date().toISOString(),
                  difficulty: currentDifficulty,
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
  }, [clearTimers, loadLeaderboard, score]); 

  const handleMoleClick = useCallback((index: number) => {
    if (gameStatus !== 'playing' || index !== activeMoleIndex || !moles[index]?.hasMole) return;

    if (moleTimerRef.current) clearTimeout(moleTimerRef.current); // Clear current mole's timer
    
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
    // Immediately schedule the next mole after a hit, following the spawn delay
    moleTimerRef.current = setTimeout(spawnMole, moleSpawnDelay); 
  }, [gameStatus, activeMoleIndex, moles, spawnMole, toast, currentDifficulty]);

  const restartGame = useCallback(() => {
    clearTimers();
    setGameStatus('idle');
    setActiveMoleIndex(null);
    setMoles(prev => prev.map(mole => ({ ...mole, hasMole: false })));
  }, [clearTimers]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);
  
  useEffect(() => {
    if (gameStatus === 'playing') {
      // Initial spawn when game starts
      const { moleSpawnDelay } = MOLE_MASH_DIFFICULTY_CONFIG[currentDifficulty];
      const initialSpawnTimeout = setTimeout(spawnMole, moleSpawnDelay); // Use a small delay for the very first mole
      
      // Store this timeout in moleTimerRef so it can be cleared if game ends prematurely
      moleTimerRef.current = initialSpawnTimeout; 
      
      return () => clearTimeout(initialSpawnTimeout);
    } else if (gameStatus !== 'playing') {
        // Ensure moles are cleared and timers stopped if game status changes from playing
        clearTimers();
        setActiveMoleIndex(null);
        setMoles(prev => prev.map(m => ({...m, hasMole: false})));
    }
  }, [gameStatus, spawnMole, currentDifficulty, clearTimers]);


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
