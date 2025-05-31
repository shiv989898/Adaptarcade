
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { addScoreToLeaderboard, getLeaderboard as getQuickClickLeaderboard } from '@/lib/localStorageHelper'; // Assuming generic or separate keys

export type QuickClickGameStatus = 'idle' | 'countdown' | 'playing' | 'gameOver';
export interface QuickClickScoreEntry {
  id: string;
  playerName: string;
  score: number; // clicks
  date: string;
}


const QUICK_CLICK_GAME_DURATION = 5; // seconds
const QUICK_CLICK_COUNTDOWN_SECONDS = 3;
const QUICK_CLICK_LEADERBOARD_KEY = 'quickClickLeaderboard'; // Specific key for this game

export const useQuickClickLogic = () => {
  const [score, setScore] = useState(0); // clicks
  const [timeLeft, setTimeLeft] = useState(QUICK_CLICK_GAME_DURATION);
  const [gameStatus, setGameStatus] = useState<QuickClickGameStatus>('idle');
  const [countdownValue, setCountdownValue] = useState(QUICK_CLICK_COUNTDOWN_SECONDS);
  const [leaderboardScores, setLeaderboardScores] = useState<QuickClickScoreEntry[]>([]);


  const { toast } = useToast();
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playerNameRef = useRef<string>('ClickMaster');

  const loadLeaderboard = useCallback(() => {
    const scoresData = localStorage.getItem(QUICK_CLICK_LEADERBOARD_KEY);
    setLeaderboardScores(scoresData ? JSON.parse(scoresData) : []);
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
            if (prevTime <= 0.1) { // Check against small value to ensure it triggers
              clearInterval(timerIntervalRef.current!);
              setGameStatus('gameOver');
              
              const finalScore = score; // Capture score at this moment
              const currentScores = JSON.parse(localStorage.getItem(QUICK_CLICK_LEADERBOARD_KEY) || '[]') as QuickClickScoreEntry[];
              const newEntry: QuickClickScoreEntry = {
                id: Date.now().toString() + Math.random().toString(36).substring(2,9),
                playerName: playerNameRef.current,
                score: finalScore, 
                date: new Date().toISOString(),
              };
              currentScores.push(newEntry);
              currentScores.sort((a,b) => b.score - a.score);
              const updatedLeaderboard = currentScores.slice(0, 10);
              localStorage.setItem(QUICK_CLICK_LEADERBOARD_KEY, JSON.stringify(updatedLeaderboard));
              loadLeaderboard(); 
              return 0;
            }
            return prevTime - 1;
          });
        }, 1000);
      }
    }, 1000);
  }, [clearTimers, loadLeaderboard]); // Removed score and leaderboardScores from deps

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
