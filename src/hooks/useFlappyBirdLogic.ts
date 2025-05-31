
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { BirdState, PipeState, FlappyBirdGameStatus, ScoreEntry } from '@/types/game';
import { useToast } from '@/hooks/use-toast';
import { FLAPPY_BIRD_LEADERBOARD_KEY } from '@/types/game';

const GRAVITY = 0.4;
const FLAP_STRENGTH = -10;
const MAX_FALL_SPEED = 10;
const BIRD_SIZE = 30;
const GAME_AREA_HEIGHT = 500;
const GAME_AREA_WIDTH = 380;
const PIPE_WIDTH = 60;
const PIPE_GAP = 150;
const PIPE_SPAWN_INTERVAL = 2000;
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
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const pipeGeneratorRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const playerNameRef = useRef<string>('FlappyAce');
  const passedPipeIds = useRef<Set<string>>(new Set());

  const loadLeaderboard = useCallback(() => {
    if (typeof window === 'undefined') return;
    const scoresData = localStorage.getItem(FLAPPY_BIRD_LEADERBOARD_KEY);
    setLeaderboardScores(scoresData ? JSON.parse(scoresData) : []);
  }, []);

  const clearTimers = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    if (pipeGeneratorRef.current) {
      clearInterval(pipeGeneratorRef.current);
      pipeGeneratorRef.current = null;
    }
  }, []);

  const resetGame = useCallback(() => {
    setBird({ y: GAME_AREA_HEIGHT / 2, velocity: 0, size: BIRD_SIZE });
    setPipes([]);
    setScore(0);
    passedPipeIds.current.clear(); // Ensure passed pipes are cleared
  }, []);

  const startGame = useCallback(() => {
    clearTimers(); // Clear all timers first
    resetGame();   // Then reset game state
    setGameStatus('countdown');
    setCountdownValue(COUNTDOWN_SECONDS);

    let currentCountdown = COUNTDOWN_SECONDS;
    countdownTimerRef.current = setInterval(() => {
      currentCountdown--;
      setCountdownValue(currentCountdown);
      if (currentCountdown === 0) {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
        
        // Explicitly set bird state for a gentle start
        setBird({ y: GAME_AREA_HEIGHT / 2, velocity: FLAP_STRENGTH / 1.5, size: BIRD_SIZE });
        setGameStatus('playing');
      }
    }, 1000);
  }, [clearTimers, resetGame]);

  const generatePipe = useCallback(() => {
    const minTopHeight = 50;
    const maxTopHeight = GAME_AREA_HEIGHT - PIPE_GAP - 100; // Ensure enough space for bird and ground clearance
    const topPipeHeight = Math.random() * (maxTopHeight - minTopHeight) + minTopHeight;

    const newPipe: PipeState = {
      id: `pipe-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      x: GAME_AREA_WIDTH,
      topHeight: topPipeHeight,
      gap: PIPE_GAP,
      width: PIPE_WIDTH,
    };
    setPipes(prevPipes => [...prevPipes, newPipe]);
  }, []);

  // Effect for managing game loop and pipe generation when 'playing'
  useEffect(() => {
    if (gameStatus === 'playing') {
      // Safeguard: Clear any existing game loop or pipe gen timers before starting new ones
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      if (pipeGeneratorRef.current) clearInterval(pipeGeneratorRef.current);

      gameLoopRef.current = setInterval(() => {
        setBird(prevBird => {
          let newVelocity = prevBird.velocity + GRAVITY;
          if (newVelocity > MAX_FALL_SPEED) {
            newVelocity = MAX_FALL_SPEED;
          }
          const newY = prevBird.y + newVelocity;
          return { ...prevBird, y: newY, velocity: newVelocity };
        });

        setPipes(prevPipes =>
          prevPipes
            .map(pipe => ({ ...pipe, x: pipe.x - PIPE_SPEED }))
            .filter(pipe => pipe.x + PIPE_WIDTH > 0)
        );
      }, 20);

      pipeGeneratorRef.current = setInterval(() => {
        // Ensure still playing before generating a pipe, to avoid race conditions
        if (gameStatus === 'playing') {
            generatePipe();
        }
      }, PIPE_SPAWN_INTERVAL);

    } else {
      // If not 'playing' (e.g., countdown, gameOver, idle), ensure these specific timers are cleared.
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      if (pipeGeneratorRef.current) {
        clearInterval(pipeGeneratorRef.current);
        pipeGeneratorRef.current = null;
      }
    }

    // Cleanup function for this effect: only clears timers managed by this effect.
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      if (pipeGeneratorRef.current) {
        clearInterval(pipeGeneratorRef.current);
        pipeGeneratorRef.current = null;
      }
    };
  }, [gameStatus, generatePipe]); // generatePipe is memoized

  // Effect for collision detection, scoring, and game over
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const birdRect = {
      left: GAME_AREA_WIDTH / 4 - bird.size / 2,
      right: GAME_AREA_WIDTH / 4 + bird.size / 2,
      top: bird.y,
      bottom: bird.y + bird.size,
    };

    // Boundary collision (ground or sky)
    if (bird.y < 0 || bird.y + bird.size > GAME_AREA_HEIGHT - 10) { // 10px buffer for ground appearance
      clearTimers();
      setGameStatus('gameOver');
      if (typeof window !== 'undefined') {
        const currentScores = JSON.parse(localStorage.getItem(FLAPPY_BIRD_LEADERBOARD_KEY) || '[]') as ScoreEntry[];
        const newEntry: ScoreEntry = {
          id: Date.now().toString() + Math.random().toString(36).substring(2,9),
          playerName: playerNameRef.current,
          score: score,
          date: new Date().toISOString(),
        };
        currentScores.push(newEntry);
        currentScores.sort((a, b) => b.score - a.score);
        localStorage.setItem(FLAPPY_BIRD_LEADERBOARD_KEY, JSON.stringify(currentScores.slice(0, 10)));
        loadLeaderboard();
      }
      toast({ title: "Game Over!", description: "Hit the boundary!", variant: "destructive", duration: 2000 });
      return;
    }

    // Pipe collision
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
        clearTimers();
        setGameStatus('gameOver');
        if (typeof window !== 'undefined') {
          const currentScores = JSON.parse(localStorage.getItem(FLAPPY_BIRD_LEADERBOARD_KEY) || '[]') as ScoreEntry[];
          const newEntry: ScoreEntry = {
            id: Date.now().toString() + Math.random().toString(36).substring(2,9),
            playerName: playerNameRef.current,
            score: score,
            date: new Date().toISOString(),
          };
          currentScores.push(newEntry);
          currentScores.sort((a, b) => b.score - a.score);
          localStorage.setItem(FLAPPY_BIRD_LEADERBOARD_KEY, JSON.stringify(currentScores.slice(0, 10)));
          loadLeaderboard();
        }
        toast({ title: "Game Over!", description: "Hit a pipe!", variant: "destructive", duration: 2000 });
        return;
      }

      // Score point
      if (pipe.x + pipe.width < (GAME_AREA_WIDTH / 4 - bird.size / 2) && !passedPipeIds.current.has(pipe.id)) {
        setScore(s => s + 1);
        passedPipeIds.current.add(pipe.id);
        toast({ title: "+1 Point!", duration: 1000 });
      }
    }
  }, [bird, pipes, gameStatus, score, loadLeaderboard, clearTimers, toast]);

  const flapBird = useCallback(() => {
    if (gameStatus === 'playing') {
      setBird(prevBird => ({ ...prevBird, velocity: FLAP_STRENGTH }));
    }
  }, [gameStatus]);

  const restartGame = useCallback(() => {
    clearTimers();
    resetGame();
    setGameStatus('idle');
  }, [clearTimers, resetGame]);

  useEffect(() => {
    loadLeaderboard(); // Initial load
  }, [loadLeaderboard]);

  useEffect(() => {
    // Global cleanup for any timers when the component unmounts
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return {
    bird,
    pipes,
    score,
    timeLeft: -1, // Flappy bird is not timed
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
