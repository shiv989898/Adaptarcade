
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { MoleHole, ScoreEntry, Difficulty } from '@/types/game';
import { useToast } from '@/hooks/use-toast';

export type MoleMashGameStatus = 'idle' | 'countdown' | 'playing' | 'gameOver';

const MOLE_MASH_GAME_DURATION = 30; // seconds
const MOLE_MASH_COUNTDOWN_SECONDS = 3;
const MOLE_MASH_LEADERBOARD_KEY = 'moleMashLeaderboard';
const GRID_SIZE = 3; // 3x3 grid

interface MoleMashDifficultySettings {
  moleVisibleMinDuration: number;
  moleVisibleMaxDuration: number;
  moleSpawnDelay: number;
}

const MOLE_MASH_DIFFICULTY_CONFIG: Record<Difficulty, MoleMashDifficultySettings> = {
  easy: {
    moleVisibleMinDuration: 1200,
    moleVisibleMaxDuration: 2000,
    moleSpawnDelay: 500,
  },
  medium: {
    moleVisibleMinDuration: 700,
    moleVisibleMaxDuration: 1200,
    moleSpawnDelay: 250,
  },
  hard: {
    moleVisibleMinDuration: 300,
    moleVisibleMaxDuration: 600,
    moleSpawnDelay: 50,
  },
};


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
  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>('medium');

  const { toast } = useToast();
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null); // For countdown and game duration
  const moleTimerRef = useRef<NodeJS.Timeout | null>(null); // For individual mole appearance and next spawn scheduling
  const playerNameRef = useRef<string>('MoleMasher');
  const spawnMoleFnRef = useRef<() => void>();


  const loadLeaderboard = useCallback(() => {
    if (typeof window === 'undefined') return;
    const scores = localStorage.getItem(MOLE_MASH_LEADERBOARD_KEY);
    setLeaderboardScores(scores ? JSON.parse(scores) : []);
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const clearAllGameTimers = useCallback(() => {
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (moleTimerRef.current) clearTimeout(moleTimerRef.current);
  }, []);

  const spawnMole = useCallback(() => {
    if (gameStatus !== 'playing') return;

    // Clear previous mole's despawn/next-spawn timer before creating a new one
    if (moleTimerRef.current) clearTimeout(moleTimerRef.current);

    const { moleVisibleMinDuration, moleVisibleMaxDuration, moleSpawnDelay } = MOLE_MASH_DIFFICULTY_CONFIG[currentDifficulty];

    let newActiveMoleIndex: number | null = null;
    setMoles(prevMoles => {
      const molesCopy = prevMoles.map(mole => ({ ...mole, hasMole: false }));
      const availableHoles = molesCopy.map((_, i) => i).filter(i => i !== activeMoleIndex);

      if (availableHoles.length === 0 && molesCopy.length > 0) {
          newActiveMoleIndex = 0;
      } else if (availableHoles.length > 0) {
          newActiveMoleIndex = availableHoles[Math.floor(Math.random() * availableHoles.length)];
      }

      if (newActiveMoleIndex !== null) {
        molesCopy[newActiveMoleIndex].hasMole = true;
      }
      return molesCopy;
    });
    setActiveMoleIndex(newActiveMoleIndex);

    const moleDuration = Math.random() * (moleVisibleMaxDuration - moleVisibleMinDuration) + moleVisibleMinDuration;

    moleTimerRef.current = setTimeout(() => {
      if (gameStatus === 'playing') {
        if (newActiveMoleIndex !== null) {
            setMoles(prevMoles =>
              prevMoles.map((mole, idx) => idx === newActiveMoleIndex ? { ...mole, hasMole: false } : mole)
            );
        }
        setActiveMoleIndex(null);

        if (spawnMoleFnRef.current) {
            // Schedule the next mole to spawn
            moleTimerRef.current = setTimeout(spawnMoleFnRef.current, moleSpawnDelay);
        }
      }
    }, moleDuration);
  }, [gameStatus, currentDifficulty, activeMoleIndex]);

  useEffect(() => {
    spawnMoleFnRef.current = spawnMole;
  }, [spawnMole]);

  const startGame = useCallback((difficulty: Difficulty) => {
    setCurrentDifficulty(difficulty);
    clearAllGameTimers();
    setScore(0);
    setTimeLeft(MOLE_MASH_GAME_DURATION);
    setCountdownValue(MOLE_MASH_COUNTDOWN_SECONDS);
    setGameStatus('countdown');
    setActiveMoleIndex(null);
    setMoles(prev => prev.map(mole => ({ ...mole, hasMole: false })));

    let currentCountdown = MOLE_MASH_COUNTDOWN_SECONDS;
    const countdownTimer = setInterval(() => {
      currentCountdown--;
      setCountdownValue(currentCountdown);
      if (currentCountdown === 0) {
        clearInterval(countdownTimer); // Stop countdown timer
        setGameStatus('playing');

        // Start main game duration timer
        const mainGameLoopTimer = setInterval(() => {
          setTimeLeft(prevTime => {
            if (prevTime <= 1) {
              clearInterval(mainGameLoopTimer); // Stop game duration timer
              setGameStatus('gameOver'); // Game over state will trigger score saving effect
              return 0;
            }
            return prevTime - 1;
          });
        }, 1000);
        gameTimerRef.current = mainGameLoopTimer; // Assign main game loop timer to ref
      }
    }, 1000);
    gameTimerRef.current = countdownTimer; // Assign countdown timer to ref
  }, [clearAllGameTimers]);


  const handleMoleClick = useCallback((index: number) => {
    if (gameStatus !== 'playing' || index !== activeMoleIndex || !moles[index]?.hasMole) return;

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

    const { moleSpawnDelay } = MOLE_MASH_DIFFICULTY_CONFIG[currentDifficulty];
    if (spawnMoleFnRef.current) {
        moleTimerRef.current = setTimeout(spawnMoleFnRef.current, moleSpawnDelay);
    }
  }, [gameStatus, activeMoleIndex, moles, toast, currentDifficulty]);


  useEffect(() => {
    if (gameStatus === 'playing') {
      const { moleSpawnDelay } = MOLE_MASH_DIFFICULTY_CONFIG[currentDifficulty];
      if (moleTimerRef.current) clearTimeout(moleTimerRef.current); // Clear any existing mole timer

      // Initial mole spawn after a delay
      moleTimerRef.current = setTimeout(() => {
        if (spawnMoleFnRef.current && gameStatus === 'playing') { // Double check status
          spawnMoleFnRef.current();
        }
      }, moleSpawnDelay);

      return () => { // Cleanup when gameStatus changes from 'playing', or currentDifficulty changes, or unmounts
        if (moleTimerRef.current) clearTimeout(moleTimerRef.current);
      };
    } else if (gameStatus === 'idle' || gameStatus === 'countdown' || gameStatus === 'gameOver') {
      // If not 'playing', ensure moles are hidden and mole timers are cleared.
      // This handles transitions to idle, during countdown (before 'playing'), and on game over.
      if (moleTimerRef.current) clearTimeout(moleTimerRef.current);
      setActiveMoleIndex(null);
      setMoles(prev => prev.map(m => ({...m, hasMole: false})));
    }
  }, [gameStatus, currentDifficulty]);


  // Effect to handle game over logic (e.g., saving score)
  useEffect(() => {
    if (gameStatus === 'gameOver') {
      // Ensure all game-related timers are stopped.
      // gameTimerRef (for timeLeft) should have been cleared by its own interval.
      // moleTimerRef is cleared by the effect above when gameStatus is no longer 'playing'.
      // clearAllGameTimers(); // Can be called for good measure, but specific timers should handle their own lifecycle.

      if (typeof window !== 'undefined') {
        const currentScores = JSON.parse(localStorage.getItem(MOLE_MASH_LEADERBOARD_KEY) || '[]') as ScoreEntry[];
        const newEntry: ScoreEntry = {
          id: Date.now().toString() + Math.random().toString(36).substring(2,9),
          playerName: playerNameRef.current,
          score: score, // Uses the current score from state
          date: new Date().toISOString(),
          difficulty: currentDifficulty, // Uses the current difficulty from state
        };
        currentScores.push(newEntry);
        currentScores.sort((a,b) => b.score - a.score);
        const updatedLeaderboard = currentScores.slice(0, 10);
        localStorage.setItem(MOLE_MASH_LEADERBOARD_KEY, JSON.stringify(updatedLeaderboard));
        loadLeaderboard();
      }
      // Moles are reset by the other useEffect listening to gameStatus changes.
    }
  }, [gameStatus, score, currentDifficulty, loadLeaderboard]);


  const restartGame = useCallback(() => {
    clearAllGameTimers();
    setGameStatus('idle');
    setScore(0);
    setTimeLeft(MOLE_MASH_GAME_DURATION);
    // Mole state (activeMoleIndex, moles array) is reset by the useEffect watching gameStatus
  }, [clearAllGameTimers]);

  // General cleanup effect
  useEffect(() => {
    return () => {
      clearAllGameTimers();
    };
  }, [clearAllGameTimers]);

  return {
    score,
    timeLeft,
    gameStatus,
    countdownValue,
    leaderboardScores,
    moles,
    gridSize: GRID_SIZE,
    currentDifficulty,
    startGame,
    restartGame,
    handleMoleClick,
    loadLeaderboard,
  };
};

