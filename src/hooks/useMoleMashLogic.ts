
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
    moleVisibleMinDuration: 1000,
    moleVisibleMaxDuration: 2000,
    moleSpawnDelay: 300,
  },
  medium: {
    moleVisibleMinDuration: 700,
    moleVisibleMaxDuration: 1500,
    moleSpawnDelay: 200,
  },
  hard: {
    moleVisibleMinDuration: 400,
    moleVisibleMaxDuration: 900,
    moleSpawnDelay: 100,
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

    if (moleTimerRef.current) clearTimeout(moleTimerRef.current);

    const { moleVisibleMinDuration, moleVisibleMaxDuration, moleSpawnDelay } = MOLE_MASH_DIFFICULTY_CONFIG[currentDifficulty];

    const availableHoles = moles.map((_, i) => i).filter(i => i !== activeMoleIndex);
    if (availableHoles.length === 0) {
        setActiveMoleIndex(null);
        setMoles(prev => prev.map(mole => ({ ...mole, hasMole: false })));
        if (gameStatus === 'playing') moleTimerRef.current = setTimeout(spawnMole, moleSpawnDelay);
        return;
    }
    
    const randomIndex = availableHoles[Math.floor(Math.random() * availableHoles.length)];
    
    setMoles(prevMoles => 
      prevMoles.map((mole, idx) => ({ ...mole, hasMole: idx === randomIndex }))
    );
    setActiveMoleIndex(randomIndex);

    const moleDuration = Math.random() * (moleVisibleMaxDuration - moleVisibleMinDuration) + moleVisibleMinDuration;
    moleTimerRef.current = setTimeout(() => {
      if (gameStatus === 'playing') {
        setMoles(prevMoles => prevMoles.map((mole, idx) => idx === randomIndex ? { ...mole, hasMole: false } : mole));
        setActiveMoleIndex(null);
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
        
        // Initial spawn call is handled by useEffect watching gameStatus and activeMoleIndex
        // This ensures spawnMole uses the latest currentDifficulty
        
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
                  difficulty: currentDifficulty, // Save difficulty with score
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
  }, [clearTimers, loadLeaderboard, score]); // spawnMole removed as it's called by effect

  const handleMoleClick = useCallback((index: number) => {
    if (gameStatus !== 'playing' || index !== activeMoleIndex) return;

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
    moleTimerRef.current = setTimeout(spawnMole, moleSpawnDelay);
  }, [gameStatus, activeMoleIndex, spawnMole, toast, currentDifficulty]);

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
    if (gameStatus === 'playing' && activeMoleIndex === null) {
      const { moleSpawnDelay } = MOLE_MASH_DIFFICULTY_CONFIG[currentDifficulty];
      const initialSpawnTimeout = setTimeout(spawnMole, moleSpawnDelay);
      return () => clearTimeout(initialSpawnTimeout);
    }
  }, [gameStatus, spawnMole, activeMoleIndex, currentDifficulty]);


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
