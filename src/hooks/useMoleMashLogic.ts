
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
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const despawnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const spawnScheduleTimerRef = useRef<NodeJS.Timeout | null>(null);
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
    if (despawnTimerRef.current) {
        clearTimeout(despawnTimerRef.current);
        despawnTimerRef.current = null;
    }
    if (spawnScheduleTimerRef.current) {
        clearTimeout(spawnScheduleTimerRef.current);
        spawnScheduleTimerRef.current = null;
    }
  }, []);

  const spawnMole = useCallback(() => {
    if (gameStatus !== 'playing') return;
    
    let newMoleIdx: number | null = null;
    setMoles(prevMoles => {
      // Ensure all moles are initially marked as not having a mole for this spawn cycle
      const molesReset = prevMoles.map(m => ({ ...m, hasMole: false }));
      const allHoleIndices = molesReset.map((_, index) => index);
      
      if (allHoleIndices.length > 0) {
        newMoleIdx = allHoleIndices[Math.floor(Math.random() * allHoleIndices.length)];
        molesReset[newMoleIdx].hasMole = true;
        setActiveMoleIndex(newMoleIdx); // Set active index based on the chosen mole
      } else {
        setActiveMoleIndex(null); // Should ideally not happen in a 3x3 grid
      }
      return molesReset;
    });
  }, [gameStatus, setActiveMoleIndex, setMoles]);

  useEffect(() => {
    spawnMoleFnRef.current = spawnMole;
  }, [spawnMole]);

  // useEffect for scheduling spawns when no mole is active
  useEffect(() => {
    if (gameStatus === 'playing' && activeMoleIndex === null) {
      const { moleSpawnDelay } = MOLE_MASH_DIFFICULTY_CONFIG[currentDifficulty];
      
      if (spawnScheduleTimerRef.current) clearTimeout(spawnScheduleTimerRef.current);
      spawnScheduleTimerRef.current = setTimeout(() => {
        if (spawnMoleFnRef.current && gameStatus === 'playing') { // Double check status
          spawnMoleFnRef.current();
        }
      }, moleSpawnDelay);
    } else if (gameStatus !== 'playing') {
      // If game is not playing, ensure spawn scheduling timer is cleared
      if (spawnScheduleTimerRef.current) {
        clearTimeout(spawnScheduleTimerRef.current);
        spawnScheduleTimerRef.current = null;
      }
    }

    return () => { // Cleanup for this effect
      if (spawnScheduleTimerRef.current) {
        clearTimeout(spawnScheduleTimerRef.current);
        spawnScheduleTimerRef.current = null;
      }
    };
  }, [gameStatus, currentDifficulty, activeMoleIndex]);

  // useEffect for handling mole despawn when a mole becomes active
  useEffect(() => {
    if (gameStatus === 'playing' && activeMoleIndex !== null) {
      const { moleVisibleMinDuration, moleVisibleMaxDuration } = MOLE_MASH_DIFFICULTY_CONFIG[currentDifficulty];
      const moleDuration = Math.random() * (moleVisibleMaxDuration - moleVisibleMinDuration) + moleVisibleMinDuration;
      const currentActiveMole = activeMoleIndex; // Capture for the timeout closure

      if (despawnTimerRef.current) clearTimeout(despawnTimerRef.current); 

      despawnTimerRef.current = setTimeout(() => {
        if (gameStatus === 'playing' && activeMoleIndex === currentActiveMole) {
          setMoles(prevMoles =>
            prevMoles.map((mole, idx) => (idx === currentActiveMole ? { ...mole, hasMole: false } : mole))
          );
          setActiveMoleIndex(null); // This will trigger the spawn-scheduling useEffect
        }
      }, moleDuration);
    } else {
      // If game not playing or no active mole, ensure despawn timer is cleared
      if (despawnTimerRef.current) {
        clearTimeout(despawnTimerRef.current);
        despawnTimerRef.current = null;
      }
    }

    return () => { // Cleanup for this effect
      if (despawnTimerRef.current) {
        clearTimeout(despawnTimerRef.current);
        despawnTimerRef.current = null;
      }
    };
  }, [gameStatus, activeMoleIndex, currentDifficulty, setMoles, setActiveMoleIndex]);


  const handleMoleClick = useCallback((index: number) => {
    if (gameStatus !== 'playing' || index !== activeMoleIndex || !moles[index]?.hasMole) {
        return;
    }

    if (despawnTimerRef.current) {
      clearTimeout(despawnTimerRef.current);
      despawnTimerRef.current = null;
    }

    setScore(prevScore => prevScore + 1);
    setMoles(prevMoles =>
      prevMoles.map((mole, idx) => (idx === index ? { ...mole, hasMole: false } : mole))
    );
    setActiveMoleIndex(null); 

    toast({ title: `+1 Point!`, description: "Good Mash!", duration: 1000 });
  }, [gameStatus, activeMoleIndex, moles, toast, setScore, setMoles, setActiveMoleIndex]);


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
    gameTimerRef.current = setInterval(() => {
      currentCountdown--;
      setCountdownValue(currentCountdown);
      if (currentCountdown === 0) {
        if(gameTimerRef.current) clearInterval(gameTimerRef.current);
        setGameStatus('playing');

        gameTimerRef.current = setInterval(() => {
          setTimeLeft(prevTime => {
            if (prevTime <= 1) {
              if(gameTimerRef.current) clearInterval(gameTimerRef.current);
              // Game over logic will be handled by the useEffect watching gameStatus
              setGameStatus('gameOver');
              return 0;
            }
            return prevTime - 1;
          });
        }, 1000);
      }
    }, 1000);
  }, [clearAllGameTimers, setCurrentDifficulty, setGameStatus, setScore, setTimeLeft, setCountdownValue, setActiveMoleIndex, setMoles]);


  useEffect(() => {
    if (gameStatus === 'gameOver') {
      clearAllGameTimers(); 
      if (typeof window !== 'undefined') {
        const currentScores = JSON.parse(localStorage.getItem(MOLE_MASH_LEADERBOARD_KEY) || '[]') as ScoreEntry[];
        const newEntry: ScoreEntry = {
          id: Date.now().toString() + Math.random().toString(36).substring(2,9),
          playerName: playerNameRef.current,
          score: score, // Use the current score from state
          date: new Date().toISOString(),
          difficulty: currentDifficulty, // Use current difficulty from state
        };
        currentScores.push(newEntry);
        currentScores.sort((a,b) => b.score - a.score);
        const updatedLeaderboard = currentScores.slice(0, 10);
        localStorage.setItem(MOLE_MASH_LEADERBOARD_KEY, JSON.stringify(updatedLeaderboard));
        loadLeaderboard();
      }
      // Ensure moles are cleared on game over screen
      setMoles(prev => prev.map(m => ({...m, hasMole: false})));
      setActiveMoleIndex(null);
    }
  }, [gameStatus, score, currentDifficulty, loadLeaderboard, clearAllGameTimers]);


  const restartGame = useCallback(() => {
    clearAllGameTimers();
    setGameStatus('idle');
    // Reset score and time, moles/activeMoleIndex will reset via startGame or effects
    setScore(0);
    setTimeLeft(MOLE_MASH_GAME_DURATION);
    setActiveMoleIndex(null);
    setMoles(prev => prev.map(m => ({...m, hasMole: false})));
  }, [clearAllGameTimers]);

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
