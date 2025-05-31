
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { TargetConfig, ScoreEntry, TargetType, DecoyFrequencyMode } from '@/types/game';
import { getLeaderboard, addScoreToLeaderboard } from '@/lib/localStorageHelper';
import { useToast } from '@/hooks/use-toast';
import { Disc, Focus, ShieldX, Crosshair, AlertOctagon, Circle, Zap } from 'lucide-react';

export type GameStatus = 'idle' | 'countdown' | 'playing' | 'gameOver';

const GAME_DURATION = 30; // seconds
const COUNTDOWN_SECONDS = 3;
const SCORE_DECAY_FACTOR = 0.75; // Lose up to 75% of points for late clicks

interface TargetTypeParams {
  type: TargetType;
  basePoints: number;
  initialSize: number;
  maxSize: number;
  color: string;
  icon: LucideIcon;
  despawnTimeMultiplier?: number; // Multiplier for default despawn time
  // Chance is now determined by mode
}

interface ModeSettings {
  baseTargetDespawnTime: number;
  minSpawnDelay: number;
  maxSpawnDelay: number;
  decoyChance: number; // 0 to 1 (e.g., 0, 0.25, 0.40)
  targetParamsList: Omit<TargetTypeParams, 'chance'>[]; // Base parameters without individual chance
}

const TARGET_PARAMS_LIST: Omit<TargetTypeParams, 'chance'>[] = [
  { type: 'standard', basePoints: 15, initialSize: 40, maxSize: 80, color: 'hsl(var(--primary))', icon: Disc, despawnTimeMultiplier: 1 },
  { type: 'precision', basePoints: 50, initialSize: 25, maxSize: 50, color: 'hsl(var(--accent))', icon: Crosshair, despawnTimeMultiplier: 0.7 },
  { type: 'decoy', basePoints: -25, initialSize: 40, maxSize: 75, color: 'hsl(var(--destructive))', icon: ShieldX, despawnTimeMultiplier: 1.2 },
];

const MODE_CONFIG: Record<DecoyFrequencyMode, ModeSettings> = {
  zen: {
    baseTargetDespawnTime: 2500,
    minSpawnDelay: 600,
    maxSpawnDelay: 1200,
    decoyChance: 0,
    targetParamsList: TARGET_PARAMS_LIST,
  },
  challenging: {
    baseTargetDespawnTime: 2200,
    minSpawnDelay: 400,
    maxSpawnDelay: 900,
    decoyChance: 0.25,
    targetParamsList: TARGET_PARAMS_LIST,
  },
  expert: {
    baseTargetDespawnTime: 1800,
    minSpawnDelay: 250,
    maxSpawnDelay: 600,
    decoyChance: 0.40,
    targetParamsList: TARGET_PARAMS_LIST,
  },
};

const getRandomTargetTypeParamsForMode = (mode: DecoyFrequencyMode): TargetTypeParams => {
  const settings = MODE_CONFIG[mode];
  const availableTypes = settings.targetParamsList.filter(p => p.type !== 'decoy');
  
  const randomRoll = Math.random();

  if (randomRoll < settings.decoyChance) {
    const decoyParams = settings.targetParamsList.find(p => p.type === 'decoy');
    if (decoyParams) return decoyParams as TargetTypeParams; // Cast needed as chance is omitted
  }

  // Distribute remaining chance: e.g. 60% standard, 40% precision from the non-decoy pool
  const nonDecoyRoll = Math.random();
  if (nonDecoyRoll < 0.6) { // 60% chance for standard among non-decoys
     const standardParams = availableTypes.find(p => p.type === 'standard');
     if (standardParams) return standardParams as TargetTypeParams;
  } else { // 40% chance for precision among non-decoys
     const precisionParams = availableTypes.find(p => p.type === 'precision');
     if (precisionParams) return precisionParams as TargetTypeParams;
  }
  
  // Fallback to standard if something goes wrong
  return (availableTypes.find(p => p.type === 'standard') || availableTypes[0]) as TargetTypeParams;
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
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null); // Renamed from gameTimerRef for clarity
  const targetSpawnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const targetDespawnTimeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const playerNameRef = useRef<string>('PrecisionAce'); // Updated player name

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
      maxSize: targetParams.maxSize,
      currentSize: targetParams.initialSize,
      points: targetParams.basePoints, // Store base points
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
        if (targetParams.type === 'precision') {
            setScore(prev => Math.max(0, prev - Math.round(targetParams.basePoints / 10))); // Smaller penalty for miss
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
       if (targets.length < 8) { // Max active targets
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
    const countdownTimerId = setInterval(() => { // Store ID to clear specifically
      currentCountdown--;
      setCountdownValue(currentCountdown);
      if (currentCountdown === 0) {
        clearInterval(countdownTimerId); // Clear this specific countdown timer
        setGameStatus('playing');
        
        // Main game loop for time and target growth
        gameLoopRef.current = setInterval(() => {
          setTimeLeft(prevTime => {
            if (prevTime <= 1) {
              clearAllTimers();
              setGameStatus('gameOver');
              addScoreToLeaderboard({ playerName: playerNameRef.current, score, mode: currentMode });
              loadLeaderboard();
              setTargets([]); // Clear targets on game over
              return 0;
            }
            return prevTime - 1;
          });

          // Update target sizes
          setTargets(prevTs =>
            prevTs.map(t => {
              const age = Date.now() - t.spawnTime;
              const growthRatio = Math.min(1, age / (t.despawnTime * 0.9)); // Grow fully a bit before despawn
              const newSize = t.initialSize + (t.maxSize - t.initialSize) * growthRatio;
              return { ...t, currentSize: newSize };
            })
          );
        }, 1000); // Game time ticks every second
      }
    }, 1000);
    // No need to assign countdownTimerId to gameLoopRef.current here
  }, [clearAllTimers, loadLeaderboard]);


  useEffect(() => {
    if (gameStatus === 'playing') {
      if (scheduleNextTargetFnRef.current) {
        scheduleNextTargetFnRef.current();
      }
    } else {
      if (targetSpawnTimeoutRef.current) clearTimeout(targetSpawnTimeoutRef.current);
      // Despawn timeouts are cleared by removeTarget or clearAllTimers
      if (gameStatus === 'gameOver' || gameStatus === 'idle') {
        setTargets([]); // Ensure targets are cleared
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

    let pointsAwarded = target.points; // Base points for the type

    if (target.type !== 'decoy') {
      const age = Date.now() - target.spawnTime;
      const ageRatio = Math.min(1, age / target.despawnTime);
      pointsAwarded = Math.round(target.points * (1 - ageRatio * SCORE_DECAY_FACTOR));
      // Ensure some minimum points for non-decoys if not clicked instantly
      if (target.points > 0 && pointsAwarded < target.points * (1-SCORE_DECAY_FACTOR) && pointsAwarded <=0) {
        pointsAwarded = Math.max(1, Math.round(target.points * 0.1)); // Minimum 10% of base or 1 point
      }
    }
    
    setScore(prevScore => Math.max(0, prevScore + pointsAwarded)); // Score cannot go below 0

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
    // Global cleanup for all timers when the component unmounts
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
    currentMode, // Expose currentMode
    startGame,
    restartGame,
    handleTargetClick,
    loadLeaderboard,
    setGameStatus,
    setCurrentMode, // Allow page to set initial mode if needed, though startGame handles it
  };
};
