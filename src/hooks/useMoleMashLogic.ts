
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { MoleHole, ScoreEntry } from '@/types/game';
import { useToast } from '@/hooks/use-toast';

export type MoleMashGameStatus = 'idle' | 'countdown' | 'playing' | 'gameOver';

const MOLE_MASH_GAME_DURATION = 30; // seconds
const MOLE_MASH_COUNTDOWN_SECONDS = 3;
const MOLE_MASH_LEADERBOARD_KEY = 'moleMashLeaderboard';
const GRID_SIZE = 3; // 3x3 grid
const MOLE_VISIBLE_MIN_DURATION = 700; // ms
const MOLE_VISIBLE_MAX_DURATION = 1500; // ms
const MOLE_SPAWN_DELAY = 200; // ms after hit or miss

export const useMoleMashLogic = () => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MOLE_MASH_GAME_DURATION);
  const [gameStatus, setGameStatus] = useState<MoleMashGameStatus>('idle');
  const [countdownValue, setCountdownValue] = useState(MOLE_MASH_COUNTDOWN_SECONDS);
  const [leaderboardScores, setLeaderboardScores] = useState<ScoreEntry[]>([]);
  const [moles, setMoles] = useState<MoleHole[]>(
    Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => ({ id: i, hasMole: false }))
  );
  const [activeMoleIndex, setActiveMoleIndex] = useState<number | null>(null);

  const { toast } = useToast();
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const moleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const playerNameRef = useRef<string>('MoleMasher');

  const loadLeaderboard = useCallback(() => {
    if (typeof window === 'undefined') return;
    const scores = localStorage.getItem(MOLE_MASH_LEADERBOARD_KEY);
    setLeaderboardScores(scores ? JSON.parse(scores) : []);
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const clearTimers = useCallback(() => {
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (moleTimerRef.current) clearTimeout(moleTimerRef.current);
  }, []);

  const spawnMole = useCallback(() => {
    if (gameStatus !== 'playing') return;

    if (moleTimerRef.current) clearTimeout(moleTimerRef.current);

    const availableHoles = moles.map((_, i) => i).filter(i => i !== activeMoleIndex);
    if (availableHoles.length === 0) { // Should not happen in a 1-mole game
        setActiveMoleIndex(null);
        setMoles(prev => prev.map(mole => ({ ...mole, hasMole: false })));
        if (gameStatus === 'playing') moleTimerRef.current = setTimeout(spawnMole, MOLE_SPAWN_DELAY); // try again
        return;
    }
    
    const randomIndex = availableHoles[Math.floor(Math.random() * availableHoles.length)];
    
    setMoles(prevMoles => 
      prevMoles.map((mole, idx) => ({ ...mole, hasMole: idx === randomIndex }))
    );
    setActiveMoleIndex(randomIndex);

    const moleDuration = Math.random() * (MOLE_VISIBLE_MAX_DURATION - MOLE_VISIBLE_MIN_DURATION) + MOLE_VISIBLE_MIN_DURATION;
    moleTimerRef.current = setTimeout(() => {
      if (gameStatus === 'playing') {
         // Mole disappeared without being hit
        setMoles(prevMoles => prevMoles.map((mole, idx) => idx === randomIndex ? { ...mole, hasMole: false } : mole));
        setActiveMoleIndex(null);
        moleTimerRef.current = setTimeout(spawnMole, MOLE_SPAWN_DELAY); // Spawn next mole
      }
    }, moleDuration);
  }, [moles, activeMoleIndex, gameStatus]);


  const startGame = useCallback(() => {
    clearTimers();
    setScore(0);
    setTimeLeft(MOLE_MASH_GAME_DURATION);
    setCountdownValue(MOLE_MASH_COUNTDOWN_SECONDS);
    setGameStatus('countdown');
    setActiveMoleIndex(null);
    setMoles(prev => prev.map(mole => ({ ...mole, hasMole: false })));

    let currentCountdown = MOLE_MASH_COUNTDOWN_SECONDS;
    gameTimerRef.current = setInterval(() => {
      currentCountdown--;
      setCountdownValue(currentCountdown);
      if (currentCountdown === 0) {
        clearInterval(gameTimerRef.current!);
        setGameStatus('playing');
        spawnMole();
        
        gameTimerRef.current = setInterval(() => {
          setTimeLeft(prevTime => {
            if (prevTime <= 1) {
              clearTimers();
              setGameStatus('gameOver');
              const finalScore = score; // Capture score at game over
              if (typeof window !== 'undefined') {
                const currentScores = JSON.parse(localStorage.getItem(MOLE_MASH_LEADERBOARD_KEY) || '[]') as ScoreEntry[];
                const newEntry: ScoreEntry = {
                  id: Date.now().toString() + Math.random().toString(36).substring(2,9),
                  playerName: playerNameRef.current,
                  score: finalScore,
                  date: new Date().toISOString(),
                };
                currentScores.push(newEntry);
                currentScores.sort((a,b) => b.score - a.score);
                const updatedLeaderboard = currentScores.slice(0, 10);
                localStorage.setItem(MOLE_MASH_LEADERBOARD_KEY, JSON.stringify(updatedLeaderboard));
              }
              loadLeaderboard();
              setActiveMoleIndex(null);
              setMoles(prev => prev.map(mole => ({ ...mole, hasMole: false })));
              return 0;
            }
            return prevTime - 1;
          });
        }, 1000);
      }
    }, 1000);
  }, [clearTimers, spawnMole, loadLeaderboard, score]);

  const handleMoleClick = useCallback((index: number) => {
    if (gameStatus !== 'playing' || index !== activeMoleIndex) return;

    if (moleTimerRef.current) clearTimeout(moleTimerRef.current);
    
    setScore(prevScore => prevScore + 1);
    setMoles(prevMoles => 
      prevMoles.map((mole, idx) => (idx === index ? { ...mole, hasMole: false } : mole))
    );
    setActiveMoleIndex(null);
    
    toast({
      title: `+1 Point!`,
      description: "Good Mash!",
      duration: 1000,
    });

    moleTimerRef.current = setTimeout(spawnMole, MOLE_SPAWN_DELAY);
  }, [gameStatus, activeMoleIndex, spawnMole, toast]);

  const restartGame = useCallback(() => {
    clearTimers();
    setGameStatus('idle');
    setActiveMoleIndex(null);
    setMoles(prev => prev.map(mole => ({ ...mole, hasMole: false })));
  }, [clearTimers]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);
  
  // Ensure spawnMole is called when gameStatus becomes 'playing'
  useEffect(() => {
    if (gameStatus === 'playing' && activeMoleIndex === null) {
      // Initial spawn or if moles somehow all cleared during play
      const initialSpawnTimeout = setTimeout(spawnMole, MOLE_SPAWN_DELAY);
      return () => clearTimeout(initialSpawnTimeout);
    }
  }, [gameStatus, spawnMole, activeMoleIndex]);


  return {
    score,
    timeLeft,
    gameStatus,
    countdownValue,
    leaderboardScores,
    moles,
    gridSize: GRID_SIZE,
    startGame,
    restartGame,
    handleMoleClick,
    loadLeaderboard,
  };
};
