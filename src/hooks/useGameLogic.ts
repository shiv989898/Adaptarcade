
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { TargetConfig, ScoreEntry } from '@/types/game';
import { getLeaderboard, addScoreToLeaderboard } from '@/lib/localStorageHelper';
import { useToast } from '@/hooks/use-toast';

export type GameStatus = 'idle' | 'countdown' | 'playing' | 'gameOver';

const GAME_DURATION = 30; // seconds
const COUNTDOWN_SECONDS = 3;

// Define target tiers: points, size, and color
const TARGET_TIERS = [
  { points: 20, size: 40, color: 'hsl(var(--accent))' }, // Hardest: Smallest, highest points, accent color
  { points: 10, size: 55, color: 'hsl(var(--primary))' }, // Medium: Mid size, standard points, primary color
  { points: 5,  size: 70, color: '#34D399' },          // Easiest: Largest, lowest points, emerald green
  { points: 15, size: 45, color: '#F59E0B' }, // Another option: Amber
  { points: 8,  size: 60, color: '#EC4899' }, // Pink
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
  const playerNameRef = useRef<string>('ReflexMaster');

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
    
    // Randomly select a tier for the new target
    const tier = TARGET_TIERS[Math.floor(Math.random() * TARGET_TIERS.length)];

    const newTarget: TargetConfig = {
      id: newTargetId,
      x: Math.random() * 80 + 10, // % position from left (10% to 90%)
      y: Math.random() * 80 + 10, // % position from top (10% to 90%)
      size: tier.size,
      points: tier.points,
      color: tier.color,
    };
    setTargets([newTarget]);
  }, []);

  const startGame = useCallback(() => {
    clearTimers();
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setCountdownValue(COUNTDOWN_SECONDS);
    setGameStatus('countdown');
    setTargets([]); 

    let currentCountdown = COUNTDOWN_SECONDS;
    timerIntervalRef.current = setInterval(() => {
      currentCountdown--;
      setCountdownValue(currentCountdown);
      if (currentCountdown === 0) {
        clearInterval(timerIntervalRef.current!);
        setGameStatus('playing');
        generateTarget(); 
        
        timerIntervalRef.current = setInterval(() => {
          setTimeLeft(prevTime => {
            if (prevTime <= 1) {
              clearInterval(timerIntervalRef.current!);
              setGameStatus('gameOver');
              // Pass the current score directly to addScoreToLeaderboard
              addScoreToLeaderboard({ playerName: playerNameRef.current, score });
              loadLeaderboard();
              setTargets([]); 
              return 0;
            }
            return prevTime - 1;
          });
        }, 1000);
      }
    }, 1000);
  }, [clearTimers, generateTarget, loadLeaderboard, score]); // Added score to dependency array for addScoreToLeaderboard

  const handleTargetClick = useCallback((id: string, points: number) => {
    if (gameStatus !== 'playing') return;
    setScore(prevScore => prevScore + points);
    setTargets(prevTargets => prevTargets.filter(target => target.id !== id));
    
    generateTarget();

    toast({
      title: `+${points} points!`,
      description: points > 10 ? "Great shot!" : (points < 8 ? "Nice one!" : "Target Hit!"),
      duration: 1200,
      variant: points > 10 ? "default" : "default", // Could have different variants
    });
  }, [gameStatus, generateTarget, toast]);

  const restartGame = useCallback(() => {
    clearTimers();
    setGameStatus('idle');
    setTargets([]);
    // Explicitly call startGame if that's the desired behavior of "Play Again" from idle
    // or let StartScreen handle the startGame call.
    // For HUD restart, it should probably go to 'idle' then StartScreen.
  }, [clearTimers]);

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
    loadLeaderboard,
    setGameStatus, 
  };
};
