
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { TargetConfig, ScoreEntry, Difficulty } from '@/types/game';
import { getLeaderboard, addScoreToLeaderboard } from '@/lib/localStorageHelper';
import { useToast } from '@/hooks/use-toast';

export type GameStatus = 'idle' | 'countdown' | 'playing' | 'gameOver';

const GAME_DURATION = 30; // seconds
const COUNTDOWN_SECONDS = 3;

interface TargetTierParams {
  points: number;
  size: number;
  color: string;
}

interface DifficultySettings {
  targetDespawnTime: number; 
  minSpawnDelay: number;    
  maxSpawnDelay: number;    
  targetTiers: TargetTierParams[]; 
}

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultySettings> = {
  easy: {
    targetDespawnTime: 3500,
    minSpawnDelay: 600,
    maxSpawnDelay: 1200,
    targetTiers: [
      { points: 5,  size: 75, color: '#34D399' }, 
      { points: 8,  size: 65, color: '#EC4899' }, 
      { points: 10, size: 60, color: 'hsl(var(--primary))' }, 
    ],
  },
  medium: {
    targetDespawnTime: 2500,
    minSpawnDelay: 400,
    maxSpawnDelay: 800,
    targetTiers: [
      { points: 20, size: 40, color: 'hsl(var(--accent))' }, 
      { points: 10, size: 55, color: 'hsl(var(--primary))' }, 
      { points: 5,  size: 70, color: '#34D399' },          
      { points: 15, size: 45, color: '#F59E0B' }, 
      { points: 8,  size: 60, color: '#EC4899' }, 
    ],
  },
  hard: {
    targetDespawnTime: 1800,
    minSpawnDelay: 200,
    maxSpawnDelay: 500,
    targetTiers: [
      { points: 25, size: 35, color: 'hsl(var(--accent))' }, 
      { points: 20, size: 40, color: 'hsl(var(--destructive))' }, 
      { points: 15, size: 45, color: '#F59E0B' }, 
      { points: 10, size: 50, color: 'hsl(var(--primary))' },
    ],
  },
};

export const useGameLogic = () => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [targets, setTargets] = useState<TargetConfig[]>([]);
  const [leaderboardScores, setLeaderboardScores] = useState<ScoreEntry[]>([]);
  const [countdownValue, setCountdownValue] = useState(COUNTDOWN_SECONDS);
  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>('medium');

  const { toast } = useToast();
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const targetSpawnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const targetDespawnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentTargetIdRef = useRef<string | null>(null);
  const playerNameRef = useRef<string>('ReflexChampion');

  const loadLeaderboard = useCallback(() => {
    setLeaderboardScores(getLeaderboard());
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const clearAllTimers = useCallback(() => {
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (targetSpawnTimeoutRef.current) clearTimeout(targetSpawnTimeoutRef.current);
    if (targetDespawnTimeoutRef.current) clearTimeout(targetDespawnTimeoutRef.current);
  }, []);

  const scheduleNextTarget = useCallback(() => {
    if (gameStatus !== 'playing') return;

    if (targetSpawnTimeoutRef.current) clearTimeout(targetSpawnTimeoutRef.current);
    
    const { minSpawnDelay, maxSpawnDelay } = DIFFICULTY_CONFIG[currentDifficulty];
    const spawnDelay = Math.random() * (maxSpawnDelay - minSpawnDelay) + minSpawnDelay;

    targetSpawnTimeoutRef.current = setTimeout(() => {
      generateTarget();
    }, spawnDelay);
  }, [gameStatus, currentDifficulty]); // generateTarget will be memoized separately

  const generateTarget = useCallback(() => {
    if (gameStatus !== 'playing') return;

    const newTargetId = `target-${Date.now()}-${Math.random()}`;
    currentTargetIdRef.current = newTargetId;
    
    const { targetTiers, targetDespawnTime } = DIFFICULTY_CONFIG[currentDifficulty];
    const tierParams = targetTiers[Math.floor(Math.random() * targetTiers.length)];

    const newTarget: TargetConfig = {
      id: newTargetId,
      x: Math.random() * 80 + 10, 
      y: Math.random() * 80 + 10, 
      ...tierParams,
    };
    setTargets([newTarget]);

    if (targetDespawnTimeoutRef.current) clearTimeout(targetDespawnTimeoutRef.current);
    targetDespawnTimeoutRef.current = setTimeout(() => {
      if (currentTargetIdRef.current === newTargetId && gameStatus === 'playing') { // Check if target still exists and game running
        setTargets([]); // Remove target if it timed out
        currentTargetIdRef.current = null;
        scheduleNextTarget(); // Spawn next one
      }
    }, targetDespawnTime);
  }, [gameStatus, currentDifficulty, scheduleNextTarget]);


  const startGame = useCallback((difficulty: Difficulty) => {
    setCurrentDifficulty(difficulty);
    clearAllTimers();
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setCountdownValue(COUNTDOWN_SECONDS);
    setGameStatus('countdown');
    setTargets([]); 
    currentTargetIdRef.current = null;

    let currentCountdown = COUNTDOWN_SECONDS;
    gameTimerRef.current = setInterval(() => {
      currentCountdown--;
      setCountdownValue(currentCountdown);
      if (currentCountdown === 0) {
        clearInterval(gameTimerRef.current!);
        setGameStatus('playing');
        scheduleNextTarget(); 
        
        gameTimerRef.current = setInterval(() => {
          setTimeLeft(prevTime => {
            if (prevTime <= 1) {
              clearAllTimers();
              setGameStatus('gameOver');
              addScoreToLeaderboard({ playerName: playerNameRef.current, score, difficulty: currentDifficulty });
              loadLeaderboard();
              setTargets([]); 
              currentTargetIdRef.current = null;
              return 0;
            }
            return prevTime - 1;
          });
        }, 1000);
      }
    }, 1000);
  }, [clearAllTimers, loadLeaderboard, scheduleNextTarget]); // Removed score, currentDifficulty from here, managed by state

  const handleTargetClick = useCallback((id: string, points: number) => {
    if (gameStatus !== 'playing' || currentTargetIdRef.current !== id) return;

    if (targetDespawnTimeoutRef.current) clearTimeout(targetDespawnTimeoutRef.current);
    
    setScore(prevScore => prevScore + points);
    setTargets([]); 
    currentTargetIdRef.current = null;
    
    toast({
      title: `+${points} points!`,
      description: points > 15 ? "Excellent!" : (points > 8 ? "Great shot!" : "Nice one!"),
      duration: 1200,
    });

    scheduleNextTarget();
  }, [gameStatus, toast, scheduleNextTarget]);

  const restartGame = useCallback(() => {
    clearAllTimers();
    setGameStatus('idle');
    setTargets([]);
    currentTargetIdRef.current = null;
  }, [clearAllTimers]);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  return {
    score,
    timeLeft,
    gameStatus,
    targets,
    leaderboardScores,
    countdownValue,
    currentDifficulty, // Expose current difficulty if needed by UI
    startGame,
    restartGame,
    handleTargetClick,
    loadLeaderboard,
    setGameStatus, 
  };
};
