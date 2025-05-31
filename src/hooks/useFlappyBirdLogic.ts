
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { BirdState, PipeState, FlappyBirdGameStatus, ScoreEntry } from '@/types/game';
import { useToast } from '@/hooks/use-toast';
import { FLAPPY_BIRD_LEADERBOARD_KEY } from '@/types/game';

const GRAVITY = 0.6;
const FLAP_STRENGTH = -10;
const BIRD_SIZE = 30;
const GAME_AREA_HEIGHT = 500; // pixels
const GAME_AREA_WIDTH = 380; // pixels
const PIPE_WIDTH = 60;
const PIPE_GAP = 150; // Vertical gap between pipes
const PIPE_SPAWN_INTERVAL = 2000; // ms
const PIPE_SPEED = 2.5;
const COUNTDOWN_SECONDS = 3;

export const useFlappyBirdLogic = () => {
  const [bird, setBird] = useState<BirdState>({ y: GAME_AREA_HEIGHT / 2, velocity: 0, size: BIRD_SIZE });
  const [pipes, setPipes] = useState<PipeState[]>([]);
  const [score, setScore] = useState(0);
  const [gameStatus, setGameStatus] = useState<FlappyBirdGameStatus>('idle');
  const [countdownValue, setCountdownValue] = useState(COUNTDOWN_SECONDS);
  const [leaderboardScores, setLeaderboardScores] = useState<ScoreEntry[]>([]);

  const { toast } = useToast();
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null); // For main game physics/pipe movement
  const pipeGeneratorRef = useRef<NodeJS.Timeout | null>(null); // For generating new pipes
  const playerNameRef = useRef<string>('FlappyAce');
  const passedPipeIds = useRef<Set<string>>(new Set());


  const loadLeaderboard = useCallback(() => {
    if (typeof window === 'undefined') return;
    const scoresData = localStorage.getItem(FLAPPY_BIRD_LEADERBOARD_KEY);
    setLeaderboardScores(scoresData ? JSON.parse(scoresData) : []);
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const resetGame = useCallback(() => {
    setBird({ y: GAME_AREA_HEIGHT / 2, velocity: 0, size: BIRD_SIZE });
    setPipes([]);
    setScore(0);
    passedPipeIds.current.clear();
  }, []);

  const clearTimers = useCallback(() => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    if (pipeGeneratorRef.current) {
      clearInterval(pipeGeneratorRef.current);
      pipeGeneratorRef.current = null;
    }
  }, []);
  
  const saveScore = useCallback(() => {
    if (typeof window === 'undefined') return;
    const currentScores = JSON.parse(localStorage.getItem(FLAPPY_BIRD_LEADERBOARD_KEY) || '[]') as ScoreEntry[];
    const newEntry: ScoreEntry = {
      id: Date.now().toString() + Math.random().toString(36).substring(2,9),
      playerName: playerNameRef.current,
      score: score,
      date: new Date().toISOString(),
    };
    currentScores.push(newEntry);
    currentScores.sort((a, b) => b.score - a.score);
    const updatedLeaderboard = currentScores.slice(0, 10);
    localStorage.setItem(FLAPPY_BIRD_LEADERBOARD_KEY, JSON.stringify(updatedLeaderboard));
    loadLeaderboard();
  }, [score, loadLeaderboard]);

  const startGame = useCallback(() => {
    clearTimers(); // Clear any existing game timers
    resetGame();
    setGameStatus('countdown');
    setCountdownValue(COUNTDOWN_SECONDS);

    let currentCountdown = COUNTDOWN_SECONDS;
    // This timer is local to the startGame execution and is not stored in gameLoopRef
    const localCountdownTimerId = setInterval(() => {
      currentCountdown--;
      setCountdownValue(currentCountdown);
      if (currentCountdown === 0) {
        clearInterval(localCountdownTimerId); // Clear this specific countdown timer
        setGameStatus('playing'); // Transition to playing state
      }
    }, 1000);
  }, [clearTimers, resetGame]);

  const generatePipe = useCallback(() => {
    const topPipeHeight = Math.random() * (GAME_AREA_HEIGHT - PIPE_GAP - 100) + 50; // Ensure some min/max height
    const newPipe: PipeState = {
      id: `pipe-${Date.now()}`,
      x: GAME_AREA_WIDTH,
      topHeight: topPipeHeight,
      gap: PIPE_GAP,
      width: PIPE_WIDTH,
    };
    setPipes(prevPipes => [...prevPipes, newPipe]);
  }, []);


  useEffect(() => {
    if (gameStatus === 'playing') {
      // Start main game loop for bird physics and pipe movement
      gameLoopRef.current = setInterval(() => {
        setBird(prevBird => {
          const newVelocity = prevBird.velocity + GRAVITY;
          const newY = prevBird.y + newVelocity;
          return { ...prevBird, y: newY, velocity: newVelocity };
        });

        setPipes(prevPipes =>
          prevPipes
            .map(pipe => ({ ...pipe, x: pipe.x - PIPE_SPEED }))
            .filter(pipe => pipe.x + PIPE_WIDTH > 0) // Remove off-screen pipes
        );
      }, 20); // ~50 FPS

      // Start pipe generation
      pipeGeneratorRef.current = setInterval(() => {
        if (gameStatus === 'playing') { // Double check status before generating
            generatePipe();
        }
      }, PIPE_SPAWN_INTERVAL);

      // Return a cleanup function for when gameStatus is no longer 'playing' or component unmounts
      return () => {
        clearTimers();
      };
    } else if (gameStatus === 'gameOver') {
      saveScore();
      clearTimers(); // Ensure timers are cleared on game over
    } else if (gameStatus === 'idle') {
      clearTimers(); // Ensure timers are cleared when idle
    }
    // For 'countdown', this effect does nothing; countdown is managed by startGame.
  }, [gameStatus, generatePipe, saveScore, clearTimers]);


  // Collision detection and scoring
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    // Bird boundaries
    if (bird.y < 0 || bird.y + bird.size > GAME_AREA_HEIGHT) {
      setGameStatus('gameOver');
      toast({ title: "Game Over!", description: "Hit the boundary!", variant: "destructive", duration: 2000 });
      return;
    }

    // Pipe collision & scoring
    const birdRect = {
      left: GAME_AREA_WIDTH / 4 - bird.size / 2, 
      right: GAME_AREA_WIDTH / 4 + bird.size / 2,
      top: bird.y,
      bottom: bird.y + bird.size,
    };

    for (const pipe of pipes) {
      const pipeTopRect = {
        left: pipe.x,
        right: pipe.x + pipe.width,
        top: 0,
        bottom: pipe.topHeight,
      };
      const pipeBottomRect = {
        left: pipe.x,
        right: pipe.x + pipe.width,
        top: pipe.topHeight + pipe.gap,
        bottom: GAME_AREA_HEIGHT,
      };

      const collidesWithTop = birdRect.right > pipeTopRect.left && birdRect.left < pipeTopRect.right &&
                              birdRect.bottom > pipeTopRect.top && birdRect.top < pipeTopRect.bottom;
      const collidesWithBottom = birdRect.right > pipeBottomRect.left && birdRect.left < pipeBottomRect.right &&
                                 birdRect.bottom > pipeBottomRect.top && birdRect.top < pipeBottomRect.bottom;

      if (collidesWithTop || collidesWithBottom) {
        setGameStatus('gameOver');
        toast({ title: "Game Over!", description: "Hit a pipe!", variant: "destructive", duration: 2000 });
        return;
      }
      
      if (pipe.x + pipe.width < birdRect.left && !passedPipeIds.current.has(pipe.id)) {
        setScore(s => s + 1);
        passedPipeIds.current.add(pipe.id);
        toast({ title: "+1 Point!", duration: 1000 });
      }
    }
  }, [bird, pipes, gameStatus, toast]);


  const flapBird = useCallback(() => {
    if (gameStatus === 'playing') {
      setBird(prevBird => ({ ...prevBird, velocity: FLAP_STRENGTH }));
    }
  }, [gameStatus]);

  const restartGame = useCallback(() => {
    // clearTimers is implicitly called by startGame or by useEffect when status changes to idle
    setGameStatus('idle'); 
    // Resetting score and time directly here might be redundant if startGame handles it,
    // but ensures a clean state if idle is reached from other paths.
    setScore(0); 
    resetGame(); // Ensure bird/pipe visual state is also reset
  }, [resetGame]);
  
  // Global cleanup for timers when the hook unmounts
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return {
    bird,
    pipes,
    score,
    timeLeft: -1, 
    gameStatus,
    countdownValue,
    leaderboardScores,
    startGame,
    restartGame,
    flapBird,
    loadLeaderboard,
    gameAreaHeight: GAME_AREA_HEIGHT,
    gameAreaWidth: GAME_AREA_WIDTH,
  };
};

    