
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { TargetConfig, ScoreEntry } from '@/types/game';
import { getLeaderboard, addScoreToLeaderboard } from '@/lib/localStorageHelper';
import { useToast } from '@/hooks/use-toast';

export type GameStatus = 'idle' | 'countdown' | 'playing' | 'gameOver';

const GAME_DURATION = 30; // seconds
const COUNTDOWN_SECONDS = 3;
const TARGET_POINTS = 10;
const TARGET_SIZE_MIN = 40; // px
const TARGET_SIZE_MAX = 70; // px
// Array of vibrant colors for targets
const TARGET_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  '#34D399', // Emerald 500
  '#F59E0B', // Amber 500
  '#EC4899', // Pink 500
  '#8B5CF6', // Violet 500
];


export const useGameLogic = () => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [targets, setTargets] = useState<TargetConfig[]>([]);
  const [leaderboardScores, setLeaderboardScores] = useState<ScoreEntry[]>([]);
  const [countdownValue, setCountdownValue] = useState(COUNTDOWN_SECONDS);

  const { toast } = useToast();
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const targetGenerationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playerNameRef = useRef<string>('Player'); // Could be set via an input later

  const loadLeaderboard = useCallback(() => {
    setLeaderboardScores(getLeaderboard());
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const clearTimers = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (targetGenerationIntervalRef.current) clearInterval(targetGenerationIntervalRef.current);
  }, []);

  const generateTarget = useCallback(() => {
    const newTargetId = `target-${Date.now()}-${Math.random()}`;
    const targetSize = Math.floor(Math.random() * (TARGET_SIZE_MAX - TARGET_SIZE_MIN + 1)) + TARGET_SIZE_MIN;
    // Ensure target is fully visible within the board (assuming board padding/border is handled by CSS)
    // Max x/y should ensure target doesn't go off screen. Assuming 100% is edge.
    // For a target of size `S`, its center's max percentage `P` is `100 - (S / BoardDimension * 100 / 2)`.
    // For simplicity here, we'll just use a slightly reduced range like 5-95% for x and y.
    // A more robust solution would involve knowing game board dimensions.
    const newTarget: TargetConfig = {
      id: newTargetId,
      x: Math.random() * 80 + 10, // % position from left (10% to 90%)
      y: Math.random() * 80 + 10, // % position from top (10% to 90%)
      size: targetSize,
      points: TARGET_POINTS,
      color: TARGET_COLORS[Math.floor(Math.random() * TARGET_COLORS.length)],
    };
    // For "one target at a time" mode
    setTargets([newTarget]);
    // For "multiple targets" mode:
    // setTargets(prevTargets => [...prevTargets, newTarget].slice(-MAX_TARGETS_ON_SCREEN));
  }, []);

  const startGame = useCallback(() => {
    clearTimers();
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setCountdownValue(COUNTDOWN_SECONDS);
    setGameStatus('countdown');
    setTargets([]); // Clear any old targets

    let currentCountdown = COUNTDOWN_SECONDS;
    timerIntervalRef.current = setInterval(() => {
      currentCountdown--;
      setCountdownValue(currentCountdown);
      if (currentCountdown === 0) {
        clearInterval(timerIntervalRef.current!);
        setGameStatus('playing');
        generateTarget(); // Generate first target
        
        // Game timer
        timerIntervalRef.current = setInterval(() => {
          setTimeLeft(prevTime => {
            if (prevTime <= 1) {
              clearInterval(timerIntervalRef.current!);
              setGameStatus('gameOver');
              addScoreToLeaderboard({ playerName: playerNameRef.current, score });
              loadLeaderboard();
              setTargets([]); // Clear targets on game over
              return 0;
            }
            return prevTime - 1;
          });
        }, 1000);

        // Optional: continuously generate targets if desired (for more than one target on screen)
        // targetGenerationIntervalRef.current = setInterval(generateTarget, 2000); 
      }
    }, 1000);
  }, [clearTimers, generateTarget, loadLeaderboard, score]);

  const handleTargetClick = useCallback((id: string, points: number) => {
    if (gameStatus !== 'playing') return;
    setScore(prevScore => prevScore + points);
    setTargets(prevTargets => prevTargets.filter(target => target.id !== id));
    
    // Generate a new target immediately after one is clicked
    generateTarget();

    toast({
      title: `+${points} points!`,
      duration: 1000,
    });
  }, [gameStatus, generateTarget, toast]);

  const restartGame = useCallback(() => {
    clearTimers();
    setGameStatus('idle');
    setTargets([]);
  }, [clearTimers]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return {
    score,
    timeLeft,
    gameStatus,
    targets,
    leaderboardScores,
    countdownValue,
    startGame,
    restartGame,
    handleTargetClick,
    loadLeaderboard, // Expose for manual refresh if needed
    setGameStatus, // Useful for GameOverScreen to navigate
  };
};
