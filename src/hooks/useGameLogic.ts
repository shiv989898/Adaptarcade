
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { TargetConfig, ScoreEntry, TargetType, DecoyFrequencyMode } from '@/types/game';
import { getLeaderboard, addScoreToLeaderboard } from '@/lib/localStorageHelper';
import { useToast } from '@/hooks/use-toast';
import { Disc, Focus, ShieldX, Crosshair, AlertOctagon, Circle, Zap } from 'lucide-react';

export type GameStatus = 'idle' | 'countdown' | 'playing' | 'gameOver';

const GAME_DURATION = 30; // seconds
const COUNTDOWN_SECONDS = 3;
const SCORE_DECAY_FACTOR = 0.75; // Lose up to 75% of points for late clicks on standard targets

interface TargetTypeParams {
  type: TargetType;
  basePoints: number;
  initialSize: number;
  maxSize: number; // Will be same as initialSize for non-growing targets
  color: string;
  icon: LucideIcon;
  despawnTimeMultiplier?: number;
}

interface ModeSettings {
  baseTargetDespawnTime: number;
  minSpawnDelay: number;
  maxSpawnDelay: number;
  decoyChance: number; // 0 to 1
  targetParamsList: TargetTypeParams[];
}

// Adjusted TARGET_PARAMS_LIST for new sizing rules
const TARGET_PARAMS_BASE_CONFIG: Omit<TargetTypeParams, 'chance'>[] = [
  { type: 'standard', basePoints: 15, initialSize: 40, maxSize: 80, color: 'hsl(var(--primary))', icon: Disc, despawnTimeMultiplier: 1 },
  { type: 'precision', basePoints: 50, initialSize: 20, maxSize: 20, color: 'hsl(var(--accent))', icon: Crosshair, despawnTimeMultiplier: 0.7 }, // Smaller, fixed size
  { type: 'decoy', basePoints: -25, initialSize: 40, maxSize: 40, color: 'hsl(var(--destructive))', icon: ShieldX, despawnTimeMultiplier: 1.2 }, // Fixed size
];

const MODE_CONFIG: Record<DecoyFrequencyMode, ModeSettings> = {
  zen: {
    baseTargetDespawnTime: 2500,
    minSpawnDelay: 600,
    maxSpawnDelay: 1200,
    decoyChance: 0,
    targetParamsList: TARGET_PARAMS_BASE_CONFIG,
  },
  challenging: {
    baseTargetDespawnTime: 2200,
    minSpawnDelay: 400,
    maxSpawnDelay: 900,
    decoyChance: 0.25,
    targetParamsList: TARGET_PARAMS_BASE_CONFIG,
  },
  expert: {
    baseTargetDespawnTime: 1800,
    minSpawnDelay: 250,
    maxSpawnDelay: 600,
    decoyChance: 0.40,
    targetParamsList: TARGET_PARAMS_BASE_CONFIG,
  },
};

const getRandomTargetTypeParamsForMode = (mode: DecoyFrequencyMode): TargetTypeParams => {
  const settings = MODE_CONFIG[mode];
  const availableTypes = settings.targetParamsList;
  
  const randomRoll = Math.random();

  if (randomRoll < settings.decoyChance) {
    const decoyParams = availableTypes.find(p => p.type === 'decoy');
    if (decoyParams) return decoyParams;
  }

  // Filter out decoys for the next selection step
  const nonDecoyTypes = availableTypes.filter(p => p.type !== 'decoy');
  const nonDecoyRoll = Math.random();

  // Example distribution: 60% standard, 40% precision from the non-decoy pool
  if (nonDecoyRoll < 0.6) {
     const standardParams = nonDecoyTypes.find(p => p.type === 'standard');
     if (standardParams) return standardParams;
  } else {
     const precisionParams = nonDecoyTypes.find(p => p.type === 'precision');
     if (precisionParams) return precisionParams;
  }
  
  // Fallback to standard if something goes wrong or if only standard is left
  return (nonDecoyTypes.find(p => p.type === 'standard') || nonDecoyTypes[0] || availableTypes[0]);
};


export const useGameLogic = () => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [targets, setTargets] = useState<TargetConfig[]>([]);
  const [leaderboardScores, setLeaderboardScores] = useState<ScoreEntry[]>([]);
  const [countdownValue, setCountdownValue] = useState(COUNTDOWN_SECONDS);
  const [currentMode, setCurrentMode] = useState<DecoyFrequencyMode>('challenging');

  const { toast } = useToast();
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const targetSpawnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const targetDespawnTimeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const playerNameRef = useRef<string>('PrecisionPro');

  const generateTargetFnRef = useRef<() => void>();
  const scheduleNextTargetFnRef = useRef<() => void>();

  const clearAllTimers = useCallback(() => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
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
    const modeSettings = MODE_CONFIG[currentMode];
    const targetParams = getRandomTargetTypeParamsForMode(currentMode);

    const despawnDuration = targetParams.despawnTimeMultiplier
      ? modeSettings.baseTargetDespawnTime * targetParams.despawnTimeMultiplier
      : modeSettings.baseTargetDespawnTime;

    const newTarget: TargetConfig = {
      id: newTargetId,
      x: Math.random() * 85 + 7.5,
      y: Math.random() * 85 + 7.5,
      initialSize: targetParams.initialSize,
      maxSize: targetParams.maxSize, // Store max size
      currentSize: targetParams.initialSize, // Start at initial size
      points: targetParams.basePoints,
      color: targetParams.color,
      type: targetParams.type,
      icon: targetParams.icon,
      spawnTime: Date.now(),
      despawnTime: despawnDuration,
    };
    setTargets(prevTargets => [...prevTargets, newTarget]);

    const despawnTimeout = setTimeout(() => {
      if (gameStatus === 'playing') {
        removeTarget(newTargetId);
        if (targetParams.type === 'precision') { // Penalty only for missing precision
            setScore(prev => Math.max(0, prev - Math.round(targetParams.basePoints / 10)));
            toast({ title: `Missed Precision!`, variant: 'destructive', duration: 1000 });
        }
      }
    }, despawnDuration);
    targetDespawnTimeoutRefs.current.set(newTargetId, despawnTimeout);

  }, [gameStatus, currentMode, removeTarget, toast]);


  const scheduleNextTarget = useCallback(() => {
    if (gameStatus !== 'playing') return;
    if (targetSpawnTimeoutRef.current) clearTimeout(targetSpawnTimeoutRef.current);

    const config = MODE_CONFIG[currentMode];
    const spawnDelay = Math.random() * (config.maxSpawnDelay - config.minSpawnDelay) + config.minSpawnDelay;

    targetSpawnTimeoutRef.current = setTimeout(() => {
       if (targets.length < 8) {
         if (generateTargetFnRef.current) {
           generateTargetFnRef.current();
         }
       }
       if (scheduleNextTargetFnRef.current) {
        scheduleNextTargetFnRef.current();
       }
    }, spawnDelay);
  }, [gameStatus, currentMode, targets.length]);


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

  const startGame = useCallback((mode: DecoyFrequencyMode) => {
    setCurrentMode(mode);
    clearAllTimers();
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setCountdownValue(COUNTDOWN_SECONDS);
    setTargets([]);
    setGameStatus('countdown');

    let currentCountdown = COUNTDOWN_SECONDS;
    const countdownTimerId = setInterval(() => {
      currentCountdown--;
      setCountdownValue(currentCountdown);
      if (currentCountdown === 0) {
        clearInterval(countdownTimerId);
        setGameStatus('playing');
        
        gameLoopRef.current = setInterval(() => {
          setTimeLeft(prevTime => {
            if (prevTime <= 1) {
              clearAllTimers();
              setGameStatus('gameOver');
              addScoreToLeaderboard({ playerName: playerNameRef.current, score, mode: currentMode });
              loadLeaderboard();
              setTargets([]);
              return 0;
            }
            return prevTime - 1;
          });

          // Update target sizes - only for 'standard' type
          setTargets(prevTs =>
            prevTs.map(t => {
              if (t.type === 'standard') {
                const age = Date.now() - t.spawnTime;
                const growthRatio = Math.min(1, age / (t.despawnTime * 0.9));
                const newSize = t.initialSize + (t.maxSize - t.initialSize) * growthRatio;
                return { ...t, currentSize: Math.max(t.initialSize, Math.min(newSize, t.maxSize)) }; // Clamp size
              }
              // For other types, currentSize remains initialSize (already set at creation)
              return t; 
            })
          );
        }, 1000 / 30); // Update growth ~30fps for smoother visual
      }
    }, 1000);
  }, [clearAllTimers, loadLeaderboard]);


  useEffect(() => {
    if (gameStatus === 'playing') {
      if (scheduleNextTargetFnRef.current) {
        scheduleNextTargetFnRef.current();
      }
    } else {
      if (targetSpawnTimeoutRef.current) clearTimeout(targetSpawnTimeoutRef.current);
      if (gameStatus === 'gameOver' || gameStatus === 'idle') {
        setTargets([]);
      }
    }
    return () => {
        if (targetSpawnTimeoutRef.current) clearTimeout(targetSpawnTimeoutRef.current);
    }
  }, [gameStatus]);

  const handleTargetClick = useCallback((id: string) => {
    if (gameStatus !== 'playing') return;

    const target = targets.find(t => t.id === id);
    if (!target) return;

    removeTarget(id);

    let pointsAwarded = target.points;

    if (target.type === 'standard') { // Time-sensitive scoring only for standard
      const age = Date.now() - target.spawnTime;
      const ageRatio = Math.min(1, age / target.despawnTime); // How far into its lifespan it was clicked
      pointsAwarded = Math.round(target.points * (1 - ageRatio * SCORE_DECAY_FACTOR));
      // Ensure some minimum points for standard targets if not clicked instantly and points are positive
      if (target.points > 0 && pointsAwarded <= 0) {
        pointsAwarded = Math.max(1, Math.round(target.points * 0.1)); 
      }
    }
    // For 'precision' and 'decoy', pointsAwarded is already target.points (their fixed value)
    
    setScore(prevScore => Math.max(0, prevScore + pointsAwarded));

    if (target.type === 'decoy') {
      toast({
        title: `Decoy Hit! ${pointsAwarded} points!`,
        variant: 'destructive',
        duration: 1500,
      });
    } else if (target.type === 'precision') {
       toast({
        title: `Precision! +${pointsAwarded} points!`,
        duration: 1200,
      });
    } else { // Standard
      toast({
        title: `+${pointsAwarded} points!`,
        duration: 1000,
      });
    }
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
    currentMode,
    startGame,
    restartGame,
    handleTargetClick,
    loadLeaderboard,
    setGameStatus,
    setCurrentMode,
  };
};

