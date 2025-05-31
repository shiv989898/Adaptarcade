
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { TargetConfig, ScoreEntry, TargetType, DecoyFrequencyMode } from '@/types/game';
import { getLeaderboard, addScoreToLeaderboard } from '@/lib/localStorageHelper';
import { useToast } from '@/hooks/use-toast';
import { Disc, Crosshair, ShieldX } from 'lucide-react'; // Simplified icons for now

export type GameStatus = 'idle' | 'countdown' | 'playing' | 'gameOver';

const GAME_DURATION = 30; // seconds
const COUNTDOWN_SECONDS = 3;
const SCORE_DECAY_FACTOR = 0.75;

interface TargetTypeParams {
  type: TargetType;
  basePoints: number;
  initialSize: number;
  maxSize: number;
  color: string;
  icon: LucideIcon;
  despawnTimeMultiplier?: number;
}

const TARGET_PARAMS_BASE_CONFIG: TargetTypeParams[] = [
  { type: 'standard', basePoints: 15, initialSize: 40, maxSize: 80, color: 'hsl(var(--primary))', icon: Disc, despawnTimeMultiplier: 1 },
  { type: 'precision', basePoints: 50, initialSize: 20, maxSize: 20, color: 'hsl(var(--accent))', icon: Crosshair, despawnTimeMultiplier: 0.7 },
  { type: 'decoy', basePoints: -25, initialSize: 40, maxSize: 40, color: 'hsl(var(--destructive))', icon: ShieldX, despawnTimeMultiplier: 1.2 },
];

interface ModeSettings {
  baseTargetDespawnTime: number;
  minSpawnDelay: number;
  maxSpawnDelay: number;
  decoyChance: number;
  targetParamsList: TargetTypeParams[];
}

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

  const nonDecoyTypes = availableTypes.filter(p => p.type !== 'decoy');
  if (nonDecoyTypes.length === 0) return availableTypes[0]; // Should not happen if config is right

  const nonDecoyRoll = Math.random();
  if (nonDecoyRoll < 0.6 || nonDecoyTypes.length === 1) { // 60% chance for standard, or if only standard is left
     const standardParams = nonDecoyTypes.find(p => p.type === 'standard');
     if (standardParams) return standardParams;
  } else {
     const precisionParams = nonDecoyTypes.find(p => p.type === 'precision');
     if (precisionParams) return precisionParams;
  }
  return (nonDecoyTypes.find(p => p.type === 'standard') || nonDecoyTypes[0]);
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
  
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null); // For 1-second game clock
  const targetGrowthTimerRef = useRef<NodeJS.Timeout | null>(null); // For target visual updates
  const targetSpawnTimeoutRef = useRef<NodeJS.Timeout | null>(null); // For scheduling next target
  const targetDespawnTimeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const playerNameRef = useRef<string>('PrecisionPro'); // Example player name

  // Refs for functions to avoid stale closures in timeouts/intervals
  const generateTargetFnRef = useRef<() => void>();
  const scheduleNextTargetFnRef = useRef<() => void>();

  const clearAllTimers = useCallback(() => {
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (targetGrowthTimerRef.current) clearInterval(targetGrowthTimerRef.current);
    if (targetSpawnTimeoutRef.current) clearTimeout(targetSpawnTimeoutRef.current);
    targetDespawnTimeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
    targetDespawnTimeoutRefs.current.clear();
    // Note: Countdown timer is cleared locally in startGame
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
      x: Math.random() * 85 + 7.5, // % position from left, with margin
      y: Math.random() * 85 + 7.5, // % position from top, with margin
      initialSize: targetParams.initialSize,
      maxSize: targetParams.maxSize,
      currentSize: targetParams.initialSize,
      points: targetParams.basePoints,
      color: targetParams.color,
      type: targetParams.type,
      icon: targetParams.icon,
      spawnTime: Date.now(),
      despawnTime: despawnDuration,
    };
    setTargets(prevTargets => [...prevTargets, newTarget]);

    const despawnTimeout = setTimeout(() => {
      if (gameStatus === 'playing') { // Check status again inside timeout
        removeTarget(newTargetId);
        if (targetParams.type === 'precision') {
            setScore(prev => Math.max(0, prev - Math.round(targetParams.basePoints / 10))); // Penalty for missing precision
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
       if (targets.length < 8 && generateTargetFnRef.current) { // Limit concurrent targets
         generateTargetFnRef.current();
       }
       if (scheduleNextTargetFnRef.current) { // Schedule next one
        scheduleNextTargetFnRef.current();
       }
    }, spawnDelay);
  }, [gameStatus, currentMode, targets.length]);

  // Update function refs
  useEffect(() => { generateTargetFnRef.current = generateTarget; }, [generateTarget]);
  useEffect(() => { scheduleNextTargetFnRef.current = scheduleNextTarget; }, [scheduleNextTarget]);

  const loadLeaderboard = useCallback(() => {
    setLeaderboardScores(getLeaderboard());
  }, []);

  useEffect(() => { loadLeaderboard(); }, [loadLeaderboard]);

  const startGame = useCallback((mode: DecoyFrequencyMode) => {
    clearAllTimers();
    setCurrentMode(mode);
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
        
        // Start 1-second game timer for timeLeft and game over check
        gameTimerRef.current = setInterval(() => {
          setTimeLeft(prevTime => {
            if (prevTime <= 1) { // Game ends when timeLeft hits 1 then goes to 0
              clearAllTimers(); // Stop all game activity
              setGameStatus('gameOver'); // This will trigger the useEffect for gameOver
              return 0;
            }
            return prevTime - 1;
          });
        }, 1000);

        // Start target growth timer (e.g., 30 FPS)
        targetGrowthTimerRef.current = setInterval(() => {
          setTargets(prevTs =>
            prevTs.map(t => {
              if (t.type === 'standard') {
                const age = Date.now() - t.spawnTime;
                const growthRatio = Math.min(1, age / (t.despawnTime * 0.9)); // *0.9 to reach max size a bit before despawn
                const newSize = t.initialSize + (t.maxSize - t.initialSize) * growthRatio;
                return { ...t, currentSize: Math.max(t.initialSize, Math.min(newSize, t.maxSize)) };
              }
              return t;
            })
          );
        }, 1000 / 30); // Update growth ~30fps
      }
    }, 1000);
  }, [clearAllTimers /* loadLeaderboard is not needed here, it's called on gameOver */]);


  // Effect to handle game state changes (playing, gameOver, idle)
  useEffect(() => {
    if (gameStatus === 'playing') {
      if (scheduleNextTargetFnRef.current) {
        scheduleNextTargetFnRef.current();
      }
    } else { // Covers 'gameOver', 'idle', 'countdown'
      if (targetSpawnTimeoutRef.current) clearTimeout(targetSpawnTimeoutRef.current);
    }
    
    if (gameStatus === 'gameOver') {
      // Score saving logic
      addScoreToLeaderboard({ playerName: playerNameRef.current, score, mode: currentMode });
      loadLeaderboard(); // Refresh leaderboard state
      setTargets([]); // Clear targets from the board visually
    }
    
    if (gameStatus === 'idle') {
      setTargets([]); // Ensure targets are cleared when returning to idle
    }

    // Cleanup if the component unmounts or gameStatus changes away from 'playing'
    return () => {
        if (gameStatus !== 'playing' && targetSpawnTimeoutRef.current) {
             clearTimeout(targetSpawnTimeoutRef.current);
        }
    }
  }, [gameStatus, score, currentMode, loadLeaderboard]); // Added dependencies for gameOver logic

  const handleTargetClick = useCallback((id: string) => {
    if (gameStatus !== 'playing') return;

    const target = targets.find(t => t.id === id);
    if (!target) return;

    removeTarget(id);

    let pointsAwarded = target.points;
    if (target.type === 'standard') {
      const age = Date.now() - target.spawnTime;
      const ageRatio = Math.min(1, age / target.despawnTime);
      pointsAwarded = Math.round(target.points * (1 - ageRatio * SCORE_DECAY_FACTOR));
      if (target.points > 0 && pointsAwarded <= 0) {
        pointsAwarded = Math.max(1, Math.round(target.points * 0.1)); 
      }
    }
    
    setScore(prevScore => Math.max(0, prevScore + pointsAwarded));

    if (target.type === 'decoy') {
      toast({ title: `Decoy Hit! ${pointsAwarded} points!`, variant: 'destructive', duration: 1500 });
    } else if (target.type === 'precision') {
       toast({ title: `Precision! +${pointsAwarded} points!`, duration: 1200 });
    } else { // Standard
      toast({ title: `+${pointsAwarded} points!`, duration: 1000 });
    }
  }, [gameStatus, toast, removeTarget, targets]);

  const restartGame = useCallback(() => {
    clearAllTimers();
    setGameStatus('idle');
    // State resets like score, timeLeft will happen when startGame is called again
    // or handled by idle state logic
  }, [clearAllTimers]);

  // Global cleanup for all timers when the hook unmounts
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
    setGameStatus, // Expose if needed for external control, e.g., debug
    setCurrentMode, // Expose for UI to set mode before game starts
  };
};

