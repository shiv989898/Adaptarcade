
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { TargetConfig, ScoreEntry, TargetType, DecoyFrequencyMode } from '@/types/game';
import { getLeaderboard, addScoreToLeaderboard } from '@/lib/localStorageHelper';
import { useToast } from '@/hooks/use-toast';
import { Disc, Crosshair, ShieldX } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type GameStatus = 'idle' | 'countdown' | 'playing' | 'gameOver';

const GAME_DURATION = 30; // seconds
const COUNTDOWN_SECONDS = 3;
const SCORE_DECAY_FACTOR = 0.75; // How much score decays for standard targets

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
  { type: 'precision', basePoints: 30, initialSize: 20, maxSize: 20, color: 'hsl(var(--accent))', icon: Crosshair, despawnTimeMultiplier: 0.9 }, // Increased from 0.7
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
  if (nonDecoyTypes.length === 0) return availableTypes[0]; // Should not happen with current config

  const nonDecoyRoll = Math.random();
  // Adjust distribution: 60% chance for standard, 40% for precision among non-decoys
  if (nonDecoyRoll < 0.6 || nonDecoyTypes.filter(p => p.type === 'precision').length === 0) {
     const standardParams = nonDecoyTypes.find(p => p.type === 'standard');
     if (standardParams) return standardParams;
  } else {
     const precisionParams = nonDecoyTypes.find(p => p.type === 'precision');
     if (precisionParams) return precisionParams;
  }
  // Fallback, should ideally be covered by above logic
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
  
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const targetGrowthTimerRef = useRef<NodeJS.Timeout | null>(null);
  const targetSpawnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const targetDespawnTimeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const playerNameRef = useRef<string>('PrecisionPro');

  const generateTargetFnRef = useRef<() => void>();
  const scheduleNextTargetFnRef = useRef<() => void>();
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);


  const clearAllTimers = useCallback(() => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (targetGrowthTimerRef.current) clearInterval(targetGrowthTimerRef.current);
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
      points: targetParams.basePoints,
      color: targetParams.color,
      type: targetParams.type,
      icon: targetParams.icon,
      spawnTime: Date.now(),
      despawnTime: despawnDuration,
    };
    setTargets(prevTargets => [...prevTargets, newTarget]);

    const despawnTimeout = setTimeout(() => {
      if (gameStatus === 'playing') { // Ensure game is still playing when despawn triggers
        const despawningTarget = targets.find(t => t.id === newTargetId); // Get current state of target
        removeTarget(newTargetId);
        if (despawningTarget && despawningTarget.type === 'precision') {
            setScore(prev => Math.max(0, prev - Math.round(despawningTarget.points / 10))); // Penalty for missed precision
            toast({ title: `Missed Precision! -${Math.round(despawningTarget.points / 10)}`, variant: 'destructive', duration: 1000 });
        }
      }
    }, despawnDuration);
    targetDespawnTimeoutRefs.current.set(newTargetId, despawnTimeout);

  }, [gameStatus, currentMode, removeTarget, toast, targets]); // Added targets to dependency array for despawningTarget


  const scheduleNextTarget = useCallback(() => {
    if (gameStatus !== 'playing') return;
    if (targetSpawnTimeoutRef.current) clearTimeout(targetSpawnTimeoutRef.current);

    const config = MODE_CONFIG[currentMode];
    const spawnDelay = Math.random() * (config.maxSpawnDelay - config.minSpawnDelay) + config.minSpawnDelay;

    targetSpawnTimeoutRef.current = setTimeout(() => {
       if (targets.length < 8 && generateTargetFnRef.current) { 
         generateTargetFnRef.current();
       }
       if (scheduleNextTargetFnRef.current) {
        scheduleNextTargetFnRef.current();
       }
    }, spawnDelay);
  }, [gameStatus, currentMode, targets.length]);

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
    setTargets([]); // Clear targets at the very start
    setGameStatus('countdown');

    let currentCountdown = COUNTDOWN_SECONDS;
    countdownTimerRef.current = setInterval(() => {
      currentCountdown--;
      setCountdownValue(currentCountdown);
      if (currentCountdown === 0) {
        clearInterval(countdownTimerRef.current!);
        setGameStatus('playing');
        
        gameTimerRef.current = setInterval(() => {
          setTimeLeft(prevTime => {
            const newTime = prevTime - 1;
            if (newTime < 0) { // Check if newTime is less than 0
              // Game over logic moved to useEffect watching gameStatus
              return 0; // Return 0 to stop further decrements here
            }
            return newTime;
          });
        }, 1000);

        targetGrowthTimerRef.current = setInterval(() => {
          setTargets(prevTs =>
            prevTs.map(t => {
              if (t.type === 'standard') {
                const age = Date.now() - t.spawnTime;
                const growthRatio = Math.min(1, age / (t.despawnTime * 0.9)); 
                const newSize = t.initialSize + (t.maxSize - t.initialSize) * growthRatio;
                return { ...t, currentSize: Math.max(t.initialSize, Math.min(newSize, t.maxSize)) };
              }
              return t;
            })
          );
        }, 1000 / 30); 
      }
    }, 1000);
  }, [clearAllTimers]);


  useEffect(() => {
    if (timeLeft <= 0 && gameStatus === 'playing') {
      setGameStatus('gameOver');
    }
  }, [timeLeft, gameStatus]);


  useEffect(() => {
    if (gameStatus === 'playing') {
      if (scheduleNextTargetFnRef.current) {
        scheduleNextTargetFnRef.current();
      }
    } else { 
      if (targetSpawnTimeoutRef.current) clearTimeout(targetSpawnTimeoutRef.current);
    }
    
    if (gameStatus === 'gameOver') {
      clearAllTimers(); // Ensure all timers are cleared on game over
      addScoreToLeaderboard({ playerName: playerNameRef.current, score, mode: currentMode });
      loadLeaderboard(); 
      setTargets([]); 
    }
    
    if (gameStatus === 'idle') {
      setTargets([]); 
    }

    return () => { // Cleanup for the effect itself
        if (gameStatus !== 'playing' && targetSpawnTimeoutRef.current) {
             clearTimeout(targetSpawnTimeoutRef.current);
        }
    }
  }, [gameStatus, score, currentMode, loadLeaderboard, clearAllTimers]); // Added clearAllTimers

  const handleTargetClick = useCallback((id: string) => {
    if (gameStatus !== 'playing') return;

    const target = targets.find(t => t.id === id);
    if (!target) return;

    removeTarget(id);

    let pointsAwarded = target.points;
    if (target.type === 'standard') {
      const age = Date.now() - target.spawnTime;
      const ageRatio = Math.min(1, age / target.despawnTime); // Ensure ratio doesn't exceed 1
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
    } else { 
      // Standard target toast, less frequent or more subtle if desired
      // For now, keeping it consistent
      toast({ title: `+${pointsAwarded} points!`, duration: 1000 });
    }
  }, [gameStatus, toast, removeTarget, targets]);

  const restartGame = useCallback(() => {
    clearAllTimers();
    setGameStatus('idle');
    // Score and timeLeft will be reset when startGame is called from idle.
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
    currentMode, 
    startGame,
    restartGame,
    handleTargetClick,
    loadLeaderboard,
    setGameStatus, // Exposing for potential direct state changes if ever needed (e.g., debug)
    setCurrentMode, // To allow mode change from UI before starting
  };
};

    