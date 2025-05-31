'use client';

import { useState, useEffect } from 'react';
import MazeBoard from '@/components/game/MazeBoard';
import HUD from '@/components/game/HUD';
import MobileControls from '@/components/game/MobileControls';
import LeaderboardDialog from '@/components/game/LeaderboardDialog';
import StartScreen from '@/components/game/StartScreen';
import LevelCompleteModal from '@/components/game/LevelCompleteModal';
import { useGameLogic } from '@/hooks/useGameLogic';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const CELL_SIZE_DESKTOP = 32;
const CELL_SIZE_MOBILE = 24;


export default function HomePage() {
  const {
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
    hintAvailable,
    restartGame,
    mazeDimensions
  } = useGameLogic();

  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [cellSize, setCellSize] = useState(CELL_SIZE_DESKTOP);

  useEffect(() => {
    const updateCellSize = () => {
      if (window.innerWidth < 768) { // md breakpoint
        setCellSize(CELL_SIZE_MOBILE);
      } else {
        setCellSize(CELL_SIZE_DESKTOP);
      }
    };
    updateCellSize();
    window.addEventListener('resize', updateCellSize);
    return () => window.removeEventListener('resize', updateCellSize);
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard, gameStatus]); // Reload leaderboard when game status changes, e.g., after level complete

  const toggleLeaderboard = () => setIsLeaderboardOpen(!isLeaderboardOpen);

  const boardWidth = mazeDimensions.cols * cellSize + 4; // +4 for border
  const boardHeight = mazeDimensions.rows * cellSize + 4;

  if (gameStatus === 'idle') {
    return (
      <main className="flex-grow flex items-center justify-center bg-gradient-to-br from-background to-primary/10">
         <StartScreen onStartGame={startGame} />
      </main>
    );
  }
  
  return (
    <main className="flex-grow flex flex-col items-center justify-center p-2 sm:p-4 relative overflow-hidden bg-gradient-to-br from-background to-primary/10">
      <HUD
        level={level}
        timer={timer}
        onHint={requestHint}
        onToggleLeaderboard={toggleLeaderboard}
        onRestart={restartGame}
        hintAvailable={hintAvailable}
        gameStatus={gameStatus}
      />

      {gameStatus === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-20 backdrop-blur-sm">
          <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
          <p className="text-xl font-headline">Generating Level {level}...</p>
        </div>
      )}

      {gameStatus === 'levelComplete' && (
        <LevelCompleteModal isOpen={true} level={level} time={timer} />
      )}
      
      <div 
        className={cn(
          "transition-opacity duration-500 ease-in-out",
          (gameStatus === 'loading' || gameStatus === 'levelComplete') ? 'opacity-0' : 'opacity-100'
        )}
        style={{width: boardWidth, height: boardHeight, margin: 'auto'}} // Ensure it's centered and fits
      >
        {maze && playerPosition && (gameStatus === 'playing' || gameStatus === 'gameOver') && (
          <MazeBoard maze={maze} playerPosition={playerPosition} cellSize={cellSize} />
        )}
      </div>

      <MobileControls onMove={movePlayer} disabled={gameStatus !== 'playing'} />
      <LeaderboardDialog isOpen={isLeaderboardOpen} onClose={toggleLeaderboard} scores={leaderboardScores} />
    </main>
  );
}
