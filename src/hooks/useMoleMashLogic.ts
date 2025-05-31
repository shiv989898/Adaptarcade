
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { MoleHole, ScoreEntry, Difficulty } from '@/types/game';
import { useToast } from '@/hooks/use-toast';
import { addMoleMashScore, getMoleMashLeaderboard } from '@/lib/localStorageHelper';

export type MoleMashGameStatus = 'idle' | 'countdown' | 'playing' | 'gameOver';

const MOLE_MASH_GAME_DURATION = 30; // seconds
const MOLE_MASH_COUNTDOWN_SECONDS = 3;
const PLAYER_NAME = 'MoleMasher';
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
  const spawnMoleFnRef = useRef<() => void>();


  const loadLeaderboard = useCallback(() => {
    setLeaderboardScores(getMoleMashLeaderboard());
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
      const molesReset = prevMoles.map(m => ({ ...m, hasMole: false }));
      const allHoleIndices = molesReset.map((_, index) => index);
      
      if (allHoleIndices.length > 0) {
        newMoleIdx = allHoleIndices[Math.floor(Math.random() * allHoleIndices.length)];
        molesReset[newMoleIdx].hasMole = true;
        setActiveMoleIndex(newMoleIdx); 
      } else {
        setActiveMoleIndex(null); 
      }
      return molesReset;
    });
  }, [gameStatus, setActiveMoleIndex, setMoles]);

  useEffect(() => {
    spawnMoleFnRef.current = spawnMole;
  }, [spawnMole]);

  useEffect(() => {
    if (gameStatus === 'playing' && activeMoleIndex === null) {
      const { moleSpawnDelay } = MOLE_MASH_DIFFICULTY_CONFIG[currentDifficulty];
      
      if (spawnScheduleTimerRef.current) clearTimeout(spawnScheduleTimerRef.current);
      spawnScheduleTimerRef.current = setTimeout(() => {
        if (spawnMoleFnRef.current && gameStatus === 'playing') { 
          spawnMoleFnRef.current();
        }
      }, moleSpawnDelay);
    } else if (gameStatus !== 'playing') {
      if (spawnScheduleTimerRef.current) {
        clearTimeout(spawnScheduleTimerRef.current);
        spawnScheduleTimerRef.current = null;
      }
    }

    return () => { 
      if (spawnScheduleTimerRef.current) {
        clearTimeout(spawnScheduleTimerRef.current);
        spawnScheduleTimerRef.current = null;
      }
    };
  }, [gameStatus, currentDifficulty, activeMoleIndex]);

  useEffect(() => {
    if (gameStatus === 'playing' && activeMoleIndex !== null) {
      const { moleVisibleMinDuration, moleVisibleMaxDuration } = MOLE_MASH_DIFFICULTY_CONFIG[currentDifficulty];
      const moleDuration = Math.random() * (moleVisibleMaxDuration - moleVisibleMinDuration) + moleVisibleMinDuration;
      const currentActiveMole = activeMoleIndex; 

      if (despawnTimerRef.current) clearTimeout(despawnTimerRef.current); 

      despawnTimerRef.current = setTimeout(() => {
        if (gameStatus === 'playing' && activeMoleIndex === currentActiveMole) {
          setMoles(prevMoles =>
            prevMoles.map((mole, idx) => (idx === currentActiveMole ? { ...mole, hasMole: false } : mole))
          );
          setActiveMoleIndex(null); 
        }
      }, moleDuration);
    } else {
      if (despawnTimerRef.current) {
        clearTimeout(despawnTimerRef.current);
        despawnTimerRef.current = null;
      }
    }

    return () => { 
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
      addMoleMashScore({ playerName: PLAYER_NAME, score, difficulty: currentDifficulty });
      loadLeaderboard();
      setMoles(prev => prev.map(m => ({...m, hasMole: false})));
      setActiveMoleIndex(null);
    }
  }, [gameStatus, score, currentDifficulty, loadLeaderboard, clearAllGameTimers]);


  const restartGame = useCallback(() => {
    clearAllGameTimers();
    setGameStatus('idle');
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
