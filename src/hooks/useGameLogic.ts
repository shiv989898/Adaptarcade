
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
  size: number; // visual size
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
    targetDespawnTime: 3000, // Targets stay a bit longer
    minSpawnDelay: 700,    // Slightly slower spawn
    maxSpawnDelay: 1500,
    targetTiers: [
      { points: 5,  size: 80, color: '#34D399' }, // Larger, fewer points
      { points: 8,  size: 70, color: '#EC4899' },
      { points: 10, size: 65, color: 'hsl(var(--primary))' },
    ],
  },
  medium: {
    targetDespawnTime: 2000, // Default
    minSpawnDelay: 350,
    maxSpawnDelay: 700,
    targetTiers: [
      { points: 20, size: 45, color: 'hsl(var(--accent))' }, // Smaller, more points
      { points: 10, size: 60, color: 'hsl(var(--primary))' },
      { points: 5,  size: 75, color: '#34D399' },
      { points: 15, size: 50, color: '#F59E0B' },
      { points: 8,  size: 65, color: '#EC4899' },
    ],
  },
  hard: {
    targetDespawnTime: 1200, // Very quick
    minSpawnDelay: 150,    // Very frequent
    maxSpawnDelay: 400,
    targetTiers: [
      { points: 25, size: 35, color: 'hsl(var(--accent))' }, // Smallest, highest points
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

  const generateTargetFnRef = useRef<() => void>();
  const scheduleNextTargetFnRef = useRef<() => void>();

  const clearAllTimers = useCallback(() => {
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (targetSpawnTimeoutRef.current) clearTimeout(targetSpawnTimeoutRef.current);
    if (targetDespawnTimeoutRef.current) clearTimeout(targetDespawnTimeoutRef.current);
  }, []);

  const generateTarget = useCallback(() => {
    if (gameStatus !== 'playing') return;

    const newTargetId = `target-${Date.now()}-${Math.random()}`;
    currentTargetIdRef.current = newTargetId;

    const config = DIFFICULTY_CONFIG[currentDifficulty];
    const tierParams = config.targetTiers[Math.floor(Math.random() * config.targetTiers.length)];

    const newTarget: TargetConfig = {
      id: newTargetId,
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
      ...tierParams,
    };
    setTargets([newTarget]);

    if (targetDespawnTimeoutRef.current) clearTimeout(targetDespawnTimeoutRef.current);
    targetDespawnTimeoutRef.current = setTimeout(() => {
      if (currentTargetIdRef.current === newTargetId && gameStatus === 'playing') {
        setTargets([]);
        currentTargetIdRef.current = null;
        if (scheduleNextTargetFnRef.current) {
          scheduleNextTargetFnRef.current();
        }
      }
    }, config.targetDespawnTime);
  }, [gameStatus, currentDifficulty]);

  const scheduleNextTarget = useCallback(() => {
    if (gameStatus !== 'playing') return;

    if (targetSpawnTimeoutRef.current) clearTimeout(targetSpawnTimeoutRef.current);

    const config = DIFFICULTY_CONFIG[currentDifficulty];
    const spawnDelay = Math.random() * (config.maxSpawnDelay - config.minSpawnDelay) + config.minSpawnDelay;

    targetSpawnTimeoutRef.current = setTimeout(() => {
      if (generateTargetFnRef.current) {
        generateTargetFnRef.current();
      }
    }, spawnDelay);
  }, [gameStatus, currentDifficulty]);

  useEffect(() => {
    generateTargetFnRef.current = generateTarget;
  }, [generateTarget]);

  useEffect(() => {
    scheduleNextTargetFnRef.current = scheduleNextTarget;
  }, [scheduleNextTarget]);


  const loadLeaderboard = useCallback(() => {
    setLeaderboardScores(getLeaderboard());
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const startGame = useCallback((difficulty: Difficulty) => {
    setCurrentDifficulty(difficulty);
    clearAllTimers();
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setCountdownValue(COUNTDOWN_SECONDS);
    setTargets([]);
    currentTargetIdRef.current = null;
    setGameStatus('countdown');

    let currentCountdown = COUNTDOWN_SECONDS;
    const countdownTimer = setInterval(() => {
      currentCountdown--;
      setCountdownValue(currentCountdown);
      if (currentCountdown === 0) {
        clearInterval(countdownTimer);
        setGameStatus('playing'); // This will trigger the useEffect below

        const mainGameTimer = setInterval(() => {
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
        gameTimerRef.current = mainGameTimer;
      }
    }, 1000);
    gameTimerRef.current = countdownTimer; // Initially, gameTimerRef is the countdown
  }, [clearAllTimers, score, loadLeaderboard]); // Removed currentDifficulty from deps as it's set at the start


  useEffect(() => {
    if (gameStatus === 'playing') {
      if (scheduleNextTargetFnRef.current) {
        scheduleNextTargetFnRef.current();
      }
    } else {
      if (targetSpawnTimeoutRef.current) clearTimeout(targetSpawnTimeoutRef.current);
      if (targetDespawnTimeoutRef.current) clearTimeout(targetDespawnTimeoutRef.current);
      if (gameStatus === 'gameOver' || gameStatus === 'idle') {
        setTargets([]);
        currentTargetIdRef.current = null;
      }
    }
  }, [gameStatus]);

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

    if (scheduleNextTargetFnRef.current) {
      scheduleNextTargetFnRef.current();
    }
  }, [gameStatus, toast]);

  const restartGame = useCallback(() => {
    clearAllTimers();
    setGameStatus('idle');
    setTargets([]);
    currentTargetIdRef.current = null;
    setScore(0);
    setTimeLeft(GAME_DURATION);
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
    currentDifficulty,
    startGame,
    restartGame,
    handleTargetClick,
    loadLeaderboard,
    setGameStatus,
  };
};
