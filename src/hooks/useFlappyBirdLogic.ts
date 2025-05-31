
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { BirdState, PipeState, FlappyBirdGameStatus, ScoreEntry } from '@/types/game';
import { useToast } from '@/hooks/use-toast';
import { FLAPPY_BIRD_LEADERBOARD_KEY } from '@/types/game';

// --- Game Constants ---
const GRAVITY = 0.5; // Adjusted for a slightly heavier feel
const FLAP_STRENGTH = -9; // Strength of bird's upward flap
const MAX_FALL_SPEED = 12; // Terminal velocity for falling
const BIRD_SIZE = 30;
const BIRD_X_POSITION_PERCENT = 25; // Bird's fixed horizontal position as a percentage of game width

const GAME_AREA_HEIGHT = 500;
const GAME_AREA_WIDTH = 380;

const PIPE_WIDTH = 70; // Slightly wider pipes
const PIPE_GAP_VERTICAL = 140; // Vertical space for the bird to pass through
const PIPE_SPEED = 2.0; // How fast pipes move to the left
const PIPE_SPAWN_INTERVAL = 1800; // Milliseconds between new pipe pairs appearing

const MIN_PIPE_HEIGHT = 60; // Minimum height for top or bottom pipe segment
const MAX_PIPE_HEIGHT_VARIATION = GAME_AREA_HEIGHT - PIPE_GAP_VERTICAL - (MIN_PIPE_HEIGHT * 2); // Max variation for top pipe height

const GROUND_HEIGHT = 50; // Visual ground height, adjust with game area styling
const SKY_LIMIT = 0; // Top boundary for the bird

const COUNTDOWN_SECONDS = 3;

export const useFlappyBirdLogic = () => {
  const [bird, setBird] = useState<BirdState>({
    y: GAME_AREA_HEIGHT / 2 - BIRD_SIZE / 2,
    velocity: 0,
    size: BIRD_SIZE,
    rotation: 0,
  });
  const [pipes, setPipes] = useState<PipeState[]>([]);
  const [score, setScore] = useState(0);
  const [gameStatus, setGameStatus] = useState<FlappyBirdGameStatus>('idle');
  const [countdownValue, setCountdownValue] = useState(COUNTDOWN_SECONDS);
  const [leaderboardScores, setLeaderboardScores] = useState<ScoreEntry[]>([]);

  const { toast } = useToast();
  const gameLoopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pipeGeneratorTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const playerNameRef = useRef<string>('FlappyPro');
  const passedPipeIdsRef = useRef<Set<string>>(new Set());

  const clearAllTimers = useCallback(() => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (gameLoopTimerRef.current) clearInterval(gameLoopTimerRef.current);
    if (pipeGeneratorTimerRef.current) clearInterval(pipeGeneratorTimerRef.current);
    countdownTimerRef.current = null;
    gameLoopTimerRef.current = null;
    pipeGeneratorTimerRef.current = null;
  }, []);

  const resetGame = useCallback(() => {
    setBird({
      y: GAME_AREA_HEIGHT / 2 - BIRD_SIZE / 2,
      velocity: 0,
      size: BIRD_SIZE,
      rotation: 0,
    });
    setPipes([]);
    setScore(0);
    passedPipeIdsRef.current.clear();
  }, []);

  const loadLeaderboard = useCallback(() => {
    if (typeof window === 'undefined') return;
    const scoresData = localStorage.getItem(FLAPPY_BIRD_LEADERBOARD_KEY);
    setLeaderboardScores(scoresData ? JSON.parse(scoresData) : []);
  }, []);

  const saveScoreToLeaderboard = useCallback(() => {
    if (typeof window === 'undefined') return;
    const currentScores = JSON.parse(localStorage.getItem(FLAPPY_BIRD_LEADERBOARD_KEY) || '[]') as ScoreEntry[];
    const newEntry: ScoreEntry = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      playerName: playerNameRef.current,
      score: score, // Use the score from state at the moment of game over
      date: new Date().toISOString(),
    };
    currentScores.push(newEntry);
    currentScores.sort((a, b) => b.score - a.score);
    localStorage.setItem(FLAPPY_BIRD_LEADERBOARD_KEY, JSON.stringify(currentScores.slice(0, 10)));
    loadLeaderboard();
  }, [score, loadLeaderboard]);


  const handleGameOver = useCallback(() => {
    clearAllTimers();
    setGameStatus('gameOver');
    saveScoreToLeaderboard();
    toast({ title: "Game Over!", description: `Your score: ${score}`, variant: "destructive", duration: 3000 });
  }, [clearAllTimers, saveScoreToLeaderboard, score, toast]);


  const startGame = useCallback(() => {
    clearAllTimers();
    resetGame();
    setGameStatus('countdown');
    setCountdownValue(COUNTDOWN_SECONDS);

    let currentCountdown = COUNTDOWN_SECONDS;
    countdownTimerRef.current = setInterval(() => {
      currentCountdown--;
      setCountdownValue(currentCountdown);
      if (currentCountdown <= 0) {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
        
        setBird(prev => ({ ...prev, velocity: FLAP_STRENGTH * 0.6 })); // Initial gentle flap
        setGameStatus('playing');
      }
    }, 1000);
  }, [clearAllTimers, resetGame]);


  // Pipe Generation
  useEffect(() => {
    if (gameStatus === 'playing') {
      if (pipeGeneratorTimerRef.current) clearInterval(pipeGeneratorTimerRef.current); // Clear existing before setting new
      pipeGeneratorTimerRef.current = setInterval(() => {
        if (gameStatus !== 'playing') return; // Double check status

        const topPipeHeight = MIN_PIPE_HEIGHT + Math.random() * MAX_PIPE_HEIGHT_VARIATION;
        const newPipe: PipeState = {
          id: `pipe-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          x: GAME_AREA_WIDTH,
          topHeight: topPipeHeight,
          gap: PIPE_GAP_VERTICAL,
          width: PIPE_WIDTH,
        };
        setPipes(prevPipes => [...prevPipes, newPipe]);
      }, PIPE_SPAWN_INTERVAL);
    } else {
      if (pipeGeneratorTimerRef.current) {
        clearInterval(pipeGeneratorTimerRef.current);
        pipeGeneratorTimerRef.current = null;
      }
    }
    return () => {
      if (pipeGeneratorTimerRef.current) {
        clearInterval(pipeGeneratorTimerRef.current);
        pipeGeneratorTimerRef.current = null;
      }
    };
  }, [gameStatus]);


  // Game Loop: Physics, Pipe Movement, Scoring, Collision Detection
  useEffect(() => {
    if (gameStatus === 'playing') {
      if (gameLoopTimerRef.current) clearInterval(gameLoopTimerRef.current); // Clear existing before setting new
      gameLoopTimerRef.current = setInterval(() => {
        if (gameStatus !== 'playing') return; // Double check status

        // Bird Physics
        setBird(prevBird => {
          let newVelocity = prevBird.velocity + GRAVITY;
          if (newVelocity > MAX_FALL_SPEED) newVelocity = MAX_FALL_SPEED;
          if (newVelocity < FLAP_STRENGTH * 1.2) newVelocity = FLAP_STRENGTH * 1.2; // Prevent extreme upward velocity if spamming flap

          const newY = prevBird.y + newVelocity;
          
          // Calculate rotation: more pronounced rotation
          let rotation = newVelocity * 3; // Tilt based on velocity
          if (rotation < -30) rotation = -30; // Max upward tilt
          if (rotation > 90) rotation = 90;   // Max downward tilt (nosedive)

          return { ...prevBird, y: newY, velocity: newVelocity, rotation };
        });

        // Pipe Movement & Scoring
        const birdFixedX = GAME_AREA_WIDTH * (BIRD_X_POSITION_PERCENT / 100);
        setPipes(prevPipes =>
          prevPipes
            .map(pipe => {
              const newPipeX = pipe.x - PIPE_SPEED;
              // Scoring: Check if bird's front has passed the pipe's center
              if (!passedPipeIdsRef.current.has(pipe.id) && (birdFixedX > newPipeX + pipe.width / 2)) {
                passedPipeIdsRef.current.add(pipe.id);
                setScore(s => s + 1);
                toast({ title: "+1 Point!", duration: 800 });
              }
              return { ...pipe, x: newPipeX };
            })
            .filter(pipe => pipe.x + PIPE_WIDTH > 0) // Remove off-screen pipes
        );

        // Collision Detection (moved inside setBird updater to use its latest 'y')
        setBird(currentBird => { // currentBird is the just-updated bird state
          const birdRect = {
            left: birdFixedX - currentBird.size / 2,
            right: birdFixedX + currentBird.size / 2,
            top: currentBird.y,
            bottom: currentBird.y + currentBird.size,
          };

          // Boundary Collision
          if (birdRect.top < SKY_LIMIT || birdRect.bottom > GAME_AREA_HEIGHT - GROUND_HEIGHT) {
            handleGameOver();
            return currentBird; // Return currentBird to prevent further state changes this tick
          }

          // Pipe Collision
          for (const pipe of pipes) { // use 'pipes' state which is updated just before this
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

            const collides = (rect1: typeof birdRect, rect2: typeof pipeTopRect) =>
              rect1.right > rect2.left && rect1.left < rect2.right &&
              rect1.bottom > rect2.top && rect1.top < rect2.bottom;

            if (collides(birdRect, pipeTopRect) || collides(birdRect, pipeBottomRect)) {
              handleGameOver();
              return currentBird; // Return currentBird
            }
          }
          return currentBird; // No collision, bird state is fine
        });

      }, 20); // Approx 50 FPS
    } else {
       if (gameLoopTimerRef.current) {
        clearInterval(gameLoopTimerRef.current);
        gameLoopTimerRef.current = null;
      }
    }
    return () => {
      if (gameLoopTimerRef.current) {
        clearInterval(gameLoopTimerRef.current);
        gameLoopTimerRef.current = null;
      }
    };
  }, [gameStatus, handleGameOver, pipes, toast]); // Added pipes and toast to deps


  const flapBird = useCallback(() => {
    if (gameStatus === 'playing') {
      setBird(prevBird => ({ ...prevBird, velocity: FLAP_STRENGTH, rotation: -30 }));
    } else if (gameStatus === 'idle' || gameStatus === 'gameOver') {
        // Allow starting game by flapping on idle/gameover screen.
        // startGame();
        // This is handled by page click, this function is for in-game flap.
    }
  }, [gameStatus]);

  const restartGame = useCallback(() => {
    clearAllTimers();
    resetGame();
    setGameStatus('idle'); // Go to idle to allow start screen to show
    // startGame(); // Optionally directly start after reset, but idle is better UX
  }, [clearAllTimers, resetGame]);

  // Initial leaderboard load
  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  // Global cleanup
  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

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
    birdXPositionPercent: BIRD_X_POSITION_PERCENT,
    groundHeight: GROUND_HEIGHT
  };
};
