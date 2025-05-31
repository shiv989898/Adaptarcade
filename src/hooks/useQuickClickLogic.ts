
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { addQuickClickScore, getQuickClickLeaderboard } from '@/lib/localStorageHelper';
import type { ScoreEntry } from '@/types/game';


export type QuickClickGameStatus = 'idle' | 'countdown' | 'playing' | 'gameOver';

const QUICK_CLICK_GAME_DURATION = 5; // seconds
const QUICK_CLICK_COUNTDOWN_SECONDS = 3;
const PLAYER_NAME = 'ClickMaster'; // Default player name


export const useQuickClickLogic = () => {
  const [score, setScore] = useState(0); // clicks
  const [timeLeft, setTimeLeft] = useState(QUICK_CLICK_GAME_DURATION);
  const [gameStatus, setGameStatus] = useState<QuickClickGameStatus>('idle');
  const [countdownValue, setCountdownValue] = useState(QUICK_CLICK_COUNTDOWN_SECONDS);
  const [leaderboardScores, setLeaderboardScores] = useState<ScoreEntry[]>([]);


  const { toast } = useToast();
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadLeaderboard = useCallback(() => {
    setLeaderboardScores(getQuickClickLeaderboard());
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);


  const clearTimers = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  }, []);

  const startGame = useCallback(() => {
    clearTimers();
    setScore(0);
    setTimeLeft(QUICK_CLICK_GAME_DURATION);
    setCountdownValue(QUICK_CLICK_COUNTDOWN_SECONDS);
    setGameStatus('countdown');

    let currentCountdown = QUICK_CLICK_COUNTDOWN_SECONDS;
    timerIntervalRef.current = setInterval(() => {
      currentCountdown--;
      setCountdownValue(currentCountdown);
      if (currentCountdown === 0) {
        clearInterval(timerIntervalRef.current!);
        setGameStatus('playing');
        
        timerIntervalRef.current = setInterval(() => {
          setTimeLeft(prevTime => {
            if (prevTime <= 0.1) { 
              clearInterval(timerIntervalRef.current!);
              setGameStatus('gameOver');
              return 0;
            }
            return prevTime - 1;
          });
        }, 1000);
      }
    }, 1000);
  }, [clearTimers]); 

  useEffect(() => {
    if (gameStatus === 'gameOver') {
      addQuickClickScore({ playerName: PLAYER_NAME, score });
      loadLeaderboard();
    }
  }, [gameStatus, score, loadLeaderboard]);

  const handleGameButtonClick = useCallback(() => {
    if (gameStatus !== 'playing') return;
    setScore(prevScore => prevScore + 1);
  }, [gameStatus]);

  const restartGame = useCallback(() => {
    clearTimers();
    setGameStatus('idle');
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
    countdownValue,
    leaderboardScores,
    startGame,
    restartGame,
    handleGameButtonClick,
    loadLeaderboard,
    setGameStatus,
  };
};
