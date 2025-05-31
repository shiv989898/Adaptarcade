import { useState, useEffect, useCallback, useRef } from 'react';
import type { MazeData, PlayerPosition, Obstacle, ScoreEntry } from '@/types/maze';
import { generateMaze, getStartPosition, checkWinCondition, canMove } from '@/lib/mazeGenerator';
import { getLeaderboard, addScoreToLeaderboard } from '@/lib/localStorageHelper';
import { getObstaclesForMaze, getHintForPlayer } from '@/ai/flows/mazeGame'; // Mock AI
import { useToast } from '@/hooks/use-toast';

const INITIAL_LEVEL = 1;
const BASE_MAZE_SIZE = 7; // Ensure odd numbers for better maze structure
const MAZE_SIZE_INCREMENT = 2; // Increment by 2 to keep it odd
const HINT_COOLDOWN = 10000; // 10 seconds

export type GameStatus = 'idle' | 'playing' | 'levelComplete' | 'gameOver' | 'loading';

export const useGameLogic = () => {
  const [level, setLevel] = useState(INITIAL_LEVEL);
  const [maze, setMaze] = useState<MazeData | null>(null);
  const [playerPosition, setPlayerPosition] = useState<PlayerPosition>(getStartPosition());
  const [timer, setTimer] = useState(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [leaderboardScores, setLeaderboardScores] = useState<ScoreEntry[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [hintAvailable, setHintAvailable] = useState(true);
  const lastHintTimeRef = useRef<number>(0);
  const { toast } = useToast();
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const mazeRows = BASE_MAZE_SIZE + (level - 1) * MAZE_SIZE_INCREMENT;
  const mazeCols = BASE_MAZE_SIZE + (level - 1) * MAZE_SIZE_INCREMENT;

  const loadLeaderboard = useCallback(() => {
    setLeaderboardScores(getLeaderboard());
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const resetTimer = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimer(0);
  }, []);
  
  const startTimer = useCallback(() => {
    resetTimer();
    timerIntervalRef.current = setInterval(() => {
      setTimer(prevTime => prevTime + 1);
    }, 1000);
  }, [resetTimer]);


  const setupLevel = useCallback(async (currentLevel: number) => {
    setGameStatus('loading');
    setHint(null);
    const newMaze = generateMaze(mazeRows, mazeCols);
    
    // Add obstacles using AI (mock)
    const obstacles = await getObstaclesForMaze(newMaze, currentLevel);
    obstacles.forEach(obs => {
      if (newMaze[obs.position.r] && newMaze[obs.position.r][obs.position.c]) {
        // Ensure not placing on start/end
        if(!newMaze[obs.position.r][obs.position.c].isStart && !newMaze[obs.position.r][obs.position.c].isEnd) {
           newMaze[obs.position.r][obs.position.c].obstacleType = obs.type;
        }
      }
    });

    setMaze(newMaze);
    setPlayerPosition(getStartPosition());
    resetTimer();
    setGameStatus('playing');
    startTimer();
  }, [mazeRows, mazeCols, resetTimer, startTimer]);

  const startGame = useCallback(() => {
    setLevel(INITIAL_LEVEL);
    setupLevel(INITIAL_LEVEL);
  }, [setupLevel]);

  const restartGame = useCallback(() => {
    setGameStatus('idle');
    resetTimer();
    setHint(null);
    setLevel(INITIAL_LEVEL);
     // No need to call setupLevel here, idle state will show start screen
  }, [resetTimer]);
  
  const handleLevelComplete = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setGameStatus('levelComplete');
    toast({
      title: `Level ${level} Complete!`,
      description: `Time: ${timer}s. Well done!`,
      duration: 3000,
    });
    addScoreToLeaderboard({ playerName: 'Player', level, time: timer });
    loadLeaderboard();
    
    setTimeout(() => {
      setLevel(prevLevel => prevLevel + 1);
    }, 2000); // Brief pause before next level
  }, [level, timer, loadLeaderboard, toast]);

  useEffect(() => {
    if (gameStatus === 'levelComplete' && level > 0) { // check level > 0 to avoid initial setup
      // This effect is triggered after level state is updated by handleLevelComplete's setTimeout
      setupLevel(level);
    } else if (gameStatus === 'idle' && level === INITIAL_LEVEL){
      // This means we are at the very start or after a restart.
      // Don't auto-setup, wait for user to click start.
    }
  }, [level, gameStatus, setupLevel]);

  const movePlayer = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameStatus !== 'playing' || !maze) return;

    if (canMove(maze, playerPosition, direction)) {
      let newR = playerPosition.r;
      let newC = playerPosition.c;

      switch (direction) {
        case 'up': newR--; break;
        case 'down': newR++; break;
        case 'left': newC--; break;
        case 'right': newC++; break;
      }
      setPlayerPosition({ r: newR, c: newC });

      if (checkWinCondition({ r: newR, c: newC }, maze)) {
        handleLevelComplete();
      }
    } else {
      toast({ title: "Ouch!", description: "Can't move there.", variant: "destructive", duration: 1500 });
    }
  }, [gameStatus, maze, playerPosition, handleLevelComplete, toast]);
  
  const requestHint = useCallback(async () => {
    if (!maze || !hintAvailable || gameStatus !== 'playing') return;

    const now = Date.now();
    if (now - lastHintTimeRef.current < HINT_COOLDOWN) {
      toast({ title: "Hint cooldown", description: `Please wait ${Math.ceil((HINT_COOLDOWN - (now - lastHintTimeRef.current))/1000)}s.`, duration: 2000});
      return;
    }

    setHintAvailable(false);
    lastHintTimeRef.current = now;
    
    const aiHint = await getHintForPlayer(maze, playerPosition, level);
    setHint(aiHint);
    toast({ title: "Hint from AI", description: aiHint, duration: 5000 });

    setTimeout(() => {
      setHintAvailable(true);
    }, HINT_COOLDOWN);
  }, [maze, playerPosition, level, hintAvailable, gameStatus, toast]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameStatus !== 'playing') return;
      switch (event.key) {
        case 'ArrowUp': case 'w': case 'W': movePlayer('up'); event.preventDefault(); break;
        case 'ArrowDown': case 's': case 'S': movePlayer('down'); event.preventDefault(); break;
        case 'ArrowLeft': case 'a': case 'A': movePlayer('left'); event.preventDefault(); break;
        case 'ArrowRight': case 'd': case 'D': movePlayer('right'); event.preventDefault(); break;
        case 'h': case 'H': requestHint(); event.preventDefault(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePlayer, requestHint, gameStatus]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  return {
    level,
    maze,
    playerPosition,
    timer,
    gameStatus,
    startGame,
    movePlayer,
    leaderboardScores,
    loadLeaderboard,
    requestHint,
    hint,
    hintAvailable,
    restartGame,
    mazeDimensions: {rows: mazeRows, cols: mazeCols}
  };
};
