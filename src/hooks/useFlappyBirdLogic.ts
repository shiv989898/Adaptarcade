
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
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const pipeGeneratorRef = useRef<NodeJS.Timeout | null>(null);
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

  const resetGame = useCallback(() => {
    setBird({ y: GAME_AREA_HEIGHT / 2, velocity: 0, size: BIRD_SIZE });
    setPipes([]);
    setScore(0);
    passedPipeIds.current.clear();
  }, []);
  
  const startGame = useCallback(() => {
    clearTimers(); 
    resetGame();
    setGameStatus('countdown');
    setCountdownValue(COUNTDOWN_SECONDS);

    let currentCountdown = COUNTDOWN_SECONDS;
    const localCountdownTimerId = setInterval(() => {
      currentCountdown--;
      setCountdownValue(currentCountdown);
      if (currentCountdown === 0) {
        clearInterval(localCountdownTimerId); 
        setGameStatus('playing'); 
      }
    }, 1000);
  }, [clearTimers, resetGame]);

  const generatePipe = useCallback(() => {
    const topPipeHeight = Math.random() * (GAME_AREA_HEIGHT - PIPE_GAP - 100) + 50; 
    const newPipe: PipeState = {
      id: `pipe-${Date.now()}`,
      x: GAME_AREA_WIDTH,
      topHeight: topPipeHeight,
      gap: PIPE_GAP,
      width: PIPE_WIDTH,
    };
    setPipes(prevPipes => [...prevPipes, newPipe]);
  }, []);


  // Main game status effect for starting/stopping game loops
  useEffect(() => {
    if (gameStatus === 'playing') {
      clearTimers(); // Defensive clear before starting new timers for 'playing' state

      gameLoopRef.current = setInterval(() => {
        setBird(prevBird => {
          const newVelocity = prevBird.velocity + GRAVITY;
          const newY = prevBird.y + newVelocity;
          return { ...prevBird, y: newY, velocity: newVelocity };
        });

        setPipes(prevPipes =>
          prevPipes
            .map(pipe => ({ ...pipe, x: pipe.x - PIPE_SPEED }))
            .filter(pipe => pipe.x + PIPE_WIDTH > 0)
        );
      }, 20); // ~50 FPS

      pipeGeneratorRef.current = setInterval(() => {
        if (gameStatus === 'playing') { // Double check status inside interval
            generatePipe();
        }
      }, PIPE_SPAWN_INTERVAL);

      return () => {
        clearTimers(); // Cleanup when gameStatus is no longer 'playing' or component unmounts
      };
    } else if (gameStatus === 'gameOver' || gameStatus === 'idle') {
      clearTimers(); // Ensure all game activity stops
    }
  }, [gameStatus, generatePipe, clearTimers]);


  // Collision detection, scoring, and game over handling
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const birdRect = {
      left: GAME_AREA_WIDTH / 4 - bird.size / 2, 
      right: GAME_AREA_WIDTH / 4 + bird.size / 2,
      top: bird.y,
      bottom: bird.y + bird.size,
    };

    // Bird boundaries
    if (bird.y < 0 || bird.y + bird.size > GAME_AREA_HEIGHT) {
      clearTimers(); // Stop game activity
      setGameStatus('gameOver');
      if (typeof window !== 'undefined') {
        const currentScores = JSON.parse(localStorage.getItem(FLAPPY_BIRD_LEADERBOARD_KEY) || '[]') as ScoreEntry[];
        const newEntry: ScoreEntry = {
          id: Date.now().toString() + Math.random().toString(36).substring(2,9),
          playerName: playerNameRef.current,
          score: score, // Use current score from state
          date: new Date().toISOString(),
        };
        currentScores.push(newEntry);
        currentScores.sort((a, b) => b.score - a.score);
        localStorage.setItem(FLAPPY_BIRD_LEADERBOARD_KEY, JSON.stringify(currentScores.slice(0, 10)));
        loadLeaderboard();
      }
      toast({ title: "Game Over!", description: "Hit the boundary!", variant: "destructive", duration: 2000 });
      return; // Exit effect after handling game over
    }

    // Pipe collision & scoring
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
        clearTimers(); // Stop game activity
        setGameStatus('gameOver');
        if (typeof window !== 'undefined') {
          const currentScores = JSON.parse(localStorage.getItem(FLAPPY_BIRD_LEADERBOARD_KEY) || '[]') as ScoreEntry[];
          const newEntry: ScoreEntry = {
            id: Date.now().toString() + Math.random().toString(36).substring(2,9),
            playerName: playerNameRef.current,
            score: score, // Use current score from state
            date: new Date().toISOString(),
          };
          currentScores.push(newEntry);
          currentScores.sort((a, b) => b.score - a.score);
          localStorage.setItem(FLAPPY_BIRD_LEADERBOARD_KEY, JSON.stringify(currentScores.slice(0, 10)));
          loadLeaderboard();
        }
        toast({ title: "Game Over!", description: "Hit a pipe!", variant: "destructive", duration: 2000 });
        return; // Exit effect after handling game over
      }
      
      // Scoring: if bird's front has passed the pipe's back
      if (pipe.x + pipe.width < birdRect.left && !passedPipeIds.current.has(pipe.id)) {
        setScore(s => s + 1);
        passedPipeIds.current.add(pipe.id);
        toast({ title: "+1 Point!", duration: 1000 });
      }
    }
  }, [bird, pipes, gameStatus, toast, score, loadLeaderboard, clearTimers]); // Added score, loadLeaderboard, clearTimers


  const flapBird = useCallback(() => {
    if (gameStatus === 'playing') {
      setBird(prevBird => ({ ...prevBird, velocity: FLAP_STRENGTH }));
    }
  }, [gameStatus]);

  const restartGame = useCallback(() => {
    // clearTimers(); // Timers are cleared by gameStatus effect when switching to 'idle'
    setGameStatus('idle'); 
    // Score and game elements are reset by startGame when it's next called
  }, []);
  
  // General cleanup for the hook itself
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
