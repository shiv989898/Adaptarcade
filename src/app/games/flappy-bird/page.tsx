
'use client';

import { useEffect, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Bird as BirdIcon, Info } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import HUD from '@/components/game/HUD';
import LeaderboardDialog from '@/components/game/LeaderboardDialog';
import StartScreen from '@/components/game/StartScreen';
import GameOverScreen from '@/components/game/GameOverScreen';
import FlappyBirdGameArea from '@/components/game/FlappyBirdGameArea';
import { useFlappyBirdLogic } from '@/hooks/useFlappyBirdLogic';
import type { ScoreEntry } from '@/types/game';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function FlappyBirdPage() {
  const {
    bird,
    pipes,
    score,
    gameStatus,
    countdownValue,
    leaderboardScores,
    startGame,
    // restartGame, // Using startGame for play again as it handles countdown
    flapBird,
    loadLeaderboard,
    gameAreaHeight,
    gameAreaWidth,
    birdXPositionPercent,
    groundHeight,
  } = useFlappyBirdLogic();

  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true); // Show initially

  useEffect(() => {
    loadLeaderboard(); // Initial load handled by hook or here
  }, [loadLeaderboard]);

  const toggleLeaderboard = () => setIsLeaderboardOpen(!isLeaderboardOpen);

  const handleGameInteraction = useCallback(() => {
    if (gameStatus === 'playing') {
      flapBird();
    } else if (gameStatus === 'idle' || gameStatus === 'gameOver') {
      // Clicking game area on idle/game over should start a new game
      setShowInstructions(false); // Hide instructions once game starts
      startGame();
    }
  }, [gameStatus, flapBird, startGame]);
  
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.key === ' ') {
        event.preventDefault();
        handleGameInteraction();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleGameInteraction]);

  const gameTitle = "Flappy Bird";
  const gameDescription = "Tap or press Space to make the bird flap and navigate through the pipes. Avoid crashing!";
  const gameInstructionsContent = {
    title: "How to Flap:",
    steps: [
      "Click/Tap the screen or Press Spacebar to flap.",
      "Guide the bird through pipe gaps.",
      "Each pipe passed scores 1 point.",
      "Don't hit pipes, ground, or sky!"
    ]
  };

  // Used for HUD restart, which should bypass countdown for quick restart
  const quickRestartGame = () => {
    setShowInstructions(false);
    startGame(); // startGame handles reset and countdown
  };

  return (
    <main 
      className="flex-grow flex flex-col items-center justify-center p-2 sm:p-4 relative overflow-hidden bg-gradient-to-br from-cyan-500/20 to-blue-700/20"
      onClick={handleGameInteraction} // Unified click handler
      tabIndex={0} 
      style={{ outline: 'none' }}
    >
      <Button asChild variant="outline" className="absolute top-4 left-4 z-50 shadow-md">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Arcade
        </Link>
      </Button>

      <AnimatePresence>
        {gameStatus === 'playing' && (
          <motion.div
            key="hud-fb"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full contents z-40" // Ensure HUD is above game area
          >
            <HUD
              score={score}
              timeLeft={-1} 
              onToggleLeaderboard={toggleLeaderboard}
              onRestart={quickRestartGame} // HUD restart directly starts game
              gameStatus={gameStatus}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {gameStatus === 'idle' && (
         <StartScreen
            onStartGame={() => { setShowInstructions(false); startGame(); }}
            title={gameTitle}
            description={gameDescription}
            instructions={gameInstructionsContent}
            icon={BirdIcon}
          />
      )}

      {gameStatus === 'countdown' && (
        <motion.div
          key="countdown-fb"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-30 backdrop-blur-sm text-center"
        >
          <p className="text-8xl font-bold text-primary animate-ping" style={{animationDuration: '1s'}}>{countdownValue}</p>
          <p className="text-2xl font-headline mt-4">Get Ready to Flap!</p>
        </motion.div>
      )}
      
      {/* Game Area container - always present to catch clicks if not idle */}
      {(gameStatus === 'playing' || gameStatus === 'countdown' || gameStatus === 'gameOver') && (
        <motion.div
          key="gameboard-fb-container"
          initial={{ opacity: 0 }} // Only animate opacity for container
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`flex flex-col items-center justify-center w-full ${gameStatus === 'playing' ? 'mt-16 sm:mt-20' : 'mt-0'}`}
        >
          <FlappyBirdGameArea 
            bird={bird} 
            pipes={pipes} 
            gameAreaHeight={gameAreaHeight} 
            gameAreaWidth={gameAreaWidth} 
            birdXPositionPercent={birdXPositionPercent}
            groundHeight={groundHeight}
          />
        </motion.div>
      )}
      
      {/* Instructions overlay for playing state if not dismissed */}
      {gameStatus === 'playing' && showInstructions && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-30 p-4 bg-card/80 backdrop-blur-sm rounded-lg shadow-xl max-w-xs text-center"
        >
          <p className="text-sm text-card-foreground font-semibold">Tap screen or Space to Flap!</p>
          <Button variant="ghost" size="sm" onClick={() => setShowInstructions(false)} className="mt-2 text-xs">Got it!</Button>
        </motion.div>
      )}


      {gameStatus === 'gameOver' && (
        <GameOverScreen
          score={score}
          onPlayAgain={() => { setShowInstructions(true); startGame(); }} // Reset instructions for new game
          onShowLeaderboard={toggleLeaderboard}
          gameName={gameTitle}
          additionalInfo={`You navigated ${score} pipes!`}
        />
      )}

      <LeaderboardDialog
        isOpen={isLeaderboardOpen}
        onClose={toggleLeaderboard}
        scores={leaderboardScores as ScoreEntry[]}
        gameName={gameTitle}
      />
       <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 right-4 z-50 shadow-md"
              onClick={() => setShowInstructions(s => !s)}
              disabled={gameStatus !== 'playing' && gameStatus !== 'idle'}
            >
              <Info className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Toggle Instructions</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </main>
  );
}
