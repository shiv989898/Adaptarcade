
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { TargetConfig, ScoreEntry, Difficulty, TargetType } from '@/types/game';
import { getLeaderboard, addScoreToLeaderboard } from '@/lib/localStorageHelper';
import { useToast } from '@/hooks/use-toast';
import { Disc, Focus, ShieldX, Crosshair, AlertOctagon, Circle } from 'lucide-react'; // Icons for targets

export type GameStatus = 'idle' | 'countdown' | 'playing' | 'gameOver';

const GAME_DURATION = 30; // seconds
const COUNTDOWN_SECONDS = 3;

interface TargetTypeParams {
  type: TargetType;
  points: number;
  size: number;
  color: string;
  icon: LucideIcon;
  chance: number; // Relative probability of this type spawning
  despawnTimeMultiplier?: number; // Multiplier for default despawn time
}

interface DifficultySettings {
  defaultTargetDespawnTime: number;
  minSpawnDelay: number;
  maxSpawnDelay: number;
  targetTypes: TargetTypeParams[];
}

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultySettings> = {
  easy: {
    defaultTargetDespawnTime: 3000,
    minSpawnDelay: 700,
    maxSpawnDelay: 1400,
    targetTypes: [
      { type: 'standard', points: 10, size: 70, color: 'hsl(var(--primary))', icon: Disc, chance: 70 },
      { type: 'precision', points: 30, size: 40, color: 'hsl(var(--accent))', icon: Crosshair, chance: 20, despawnTimeMultiplier: 0.7 },
      { type: 'decoy', points: -20, size: 65, color: 'hsl(var(--destructive))', icon: ShieldX, chance: 10, despawnTimeMultiplier: 1.2 },
    ],
  },
  medium: {
    defaultTargetDespawnTime: 2200,
    minSpawnDelay: 400,
    maxSpawnDelay: 900,
    targetTypes: [
      { type: 'standard', points: 10, size: 60, color: 'hsl(var(--primary))', icon: Disc, chance: 55 },
      { type: 'precision', points: 40, size: 35, color: 'hsl(var(--accent))', icon: Crosshair, chance: 25, despawnTimeMultiplier: 0.6 },
      { type: 'decoy', points: -25, size: 60, color: 'hsl(var(--destructive))', icon: AlertOctagon, chance: 20, despawnTimeMultiplier: 1.1 },
    ],
  },
  hard: {
    defaultTargetDespawnTime: 1600,
    minSpawnDelay: 250,
    maxSpawnDelay: 600,
    targetTypes: [
      { type: 'standard', points: 5, size: 50, color: 'hsl(var(--primary))', icon: Circle, chance: 40 }, // Lower points for standard
      { type: 'precision', points: 50, size: 30, color: 'hsl(var(--accent))', icon: Focus, chance: 30, despawnTimeMultiplier: 0.5 },
      { type: 'decoy', points: -30, size: 55, color: 'hsl(var(--destructive))', icon: ShieldX, chance: 30, despawnTimeMultiplier: 1.0 },
    ],
  },
};

// Helper to select a target type based on weighted chances
const getRandomTargetTypeParams = (difficulty: Difficulty): TargetTypeParams => {
  const settings = DIFFICULTY_CONFIG[difficulty];
  const totalChance = settings.targetTypes.reduce((sum, type) => sum + type.chance, 0);
  let randomRoll = Math.random() * totalChance;

  for (const typeParam of settings.targetTypes) {
    if (randomRoll < typeParam.chance) {
      return typeParam;
    }
    randomRoll -= typeParam.chance;
  }
  return settings.targetTypes[0]; // Fallback, should ideally not be reached if chances sum up correctly
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
  const targetDespawnTimeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const playerNameRef = useRef<string>('PrecisionPro');

  const generateTargetFnRef = useRef<() => void>();
  const scheduleNextTargetFnRef = useRef<() => void>();

  const clearAllTimers = useCallback(() => {
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (targetSpawnTimeoutRef.current) clearTimeout(targetSpawnTimeoutRef.current);
    targetDespawnTimeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
    targetDespawnTimeoutRefs.current.clear();
  }, []);

  const removeTarget = useCallback((targetId: string) => {
    setTargets(prevTargets => prevTargets.filter(t => t.id !== targetId));
    if (targetDespawnTimeoutRefs.current.has(targetId)) {
      clearTimeout(targetDespawnTimeoutRefs.current.get(targetId)!);
      targetDespawnTimeoutRefs.current.delete(targetId);
    }
  }, []);

  const generateTarget = useCallback(() => {
    if (gameStatus !== 'playing') return;

    const newTargetId = `target-${Date.now()}-${Math.random()}`;
    const difficultySettings = DIFFICULTY_CONFIG[currentDifficulty];
    const targetParams = getRandomTargetTypeParams(currentDifficulty);

    const despawnTime = targetParams.despawnTimeMultiplier
      ? difficultySettings.defaultTargetDespawnTime * targetParams.despawnTimeMultiplier
      : difficultySettings.defaultTargetDespawnTime;

    const newTarget: TargetConfig = {
      id: newTargetId,
      x: Math.random() * 85 + 7.5, // Keep within bounds better
      y: Math.random() * 85 + 7.5,
      size: targetParams.size,
      points: targetParams.points,
      color: targetParams.color,
      type: targetParams.type,
      icon: targetParams.icon,
      despawnTime: despawnTime,
    };
    setTargets(prevTargets => [...prevTargets, newTarget]);

    const despawnTimeout = setTimeout(() => {
      if (gameStatus === 'playing') { // Check status again before removing
        removeTarget(newTargetId);
        if (targetParams.type === 'precision') { // Small penalty for missing precision targets
            setScore(prev => prev - Math.round(targetParams.points / 5));
            toast({ title: `Missed Precision! -${Math.round(targetParams.points / 5)}`, variant: 'destructive', duration: 1000 });
        }
        // No penalty for missing standard or decoys (decoys disappearing is good)
      }
    }, despawnTime);
    targetDespawnTimeoutRefs.current.set(newTargetId, despawnTimeout);

  }, [gameStatus, currentDifficulty, removeTarget, toast]);


  const scheduleNextTarget = useCallback(() => {
    if (gameStatus !== 'playing') return;
    if (targetSpawnTimeoutRef.current) clearTimeout(targetSpawnTimeoutRef.current);

    const config = DIFFICULTY_CONFIG[currentDifficulty];
    const spawnDelay = Math.random() * (config.maxSpawnDelay - config.minSpawnDelay) + config.minSpawnDelay;

    targetSpawnTimeoutRef.current = setTimeout(() => {
       if (targets.length < 5) { // Limit max active targets on screen
         if (generateTargetFnRef.current) {
           generateTargetFnRef.current();
         }
       }
       if (scheduleNextTargetFnRef.current) { // Always schedule the next check
        scheduleNextTargetFnRef.current();
       }
    }, spawnDelay);
  }, [gameStatus, currentDifficulty, targets.length]);


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
    setGameStatus('countdown');

    let currentCountdown = COUNTDOWN_SECONDS;
    const countdownTimer = setInterval(() => {
      currentCountdown--;
      setCountdownValue(currentCountdown);
      if (currentCountdown === 0) {
        clearInterval(countdownTimer);
        setGameStatus('playing');

        const mainGameTimer = setInterval(() => {
          setTimeLeft(prevTime => {
            if (prevTime <= 1) {
              clearAllTimers();
              setGameStatus('gameOver');
              addScoreToLeaderboard({ playerName: playerNameRef.current, score, difficulty: currentDifficulty });
              loadLeaderboard();
              setTargets([]);
              return 0;
            }
            return prevTime - 1;
          });
        }, 1000);
        gameTimerRef.current = mainGameTimer;
      }
    }, 1000);
    gameTimerRef.current = countdownTimer;
  }, [clearAllTimers, loadLeaderboard]);


  useEffect(() => {
    if (gameStatus === 'playing') {
      if (scheduleNextTargetFnRef.current) {
        scheduleNextTargetFnRef.current();
      }
    } else {
      if (targetSpawnTimeoutRef.current) clearTimeout(targetSpawnTimeoutRef.current);
      targetDespawnTimeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
      targetDespawnTimeoutRefs.current.clear();
      if (gameStatus === 'gameOver' || gameStatus === 'idle') {
        setTargets([]);
      }
    }
    // Cleanup function for this effect
    return () => {
        if (targetSpawnTimeoutRef.current) clearTimeout(targetSpawnTimeoutRef.current);
        targetDespawnTimeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
        targetDespawnTimeoutRefs.current.clear();
    }
  }, [gameStatus]);

  const handleTargetClick = useCallback((id: string, points: number, type: TargetType) => {
    if (gameStatus !== 'playing') return;

    const target = targets.find(t => t.id === id);
    if (!target) return;

    removeTarget(id); // Clears its specific despawn timer

    setScore(prevScore => prevScore + points);

    if (type === 'decoy') {
      toast({
        title: `Oops! ${points} points!`,
        description: "Avoid those red ones!",
        variant: 'destructive',
        duration: 1500,
      });
    } else if (type === 'precision') {
       toast({
        title: `Precision! +${points} points!`,
        description: "Bullseye!",
        duration: 1200,
      });
    } else {
      toast({
        title: `+${points} points!`,
        description: "Nice shot!",
        duration: 1000,
      });
    }
    // Next target is scheduled by the continuous loop of scheduleNextTarget
  }, [gameStatus, toast, removeTarget, targets]);

  const restartGame = useCallback(() => {
    clearAllTimers();
    setGameStatus('idle');
    setTargets([]);
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
