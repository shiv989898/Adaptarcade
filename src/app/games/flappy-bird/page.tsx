
'use client';

import { useEffect, useCallback, useState } from 'react'; // Added useState here
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Bird as BirdIcon } from 'lucide-react'; // Renamed to avoid conflict
import { AnimatePresence, motion } from 'framer-motion';
import HUD from '@/components/game/HUD';
import LeaderboardDialog from '@/components/game/LeaderboardDialog';
import StartScreen from '@/components/game/StartScreen';
import GameOverScreen from '@/components/game/GameOverScreen';
import FlappyBirdGameArea from '@/components/game/FlappyBirdGameArea';
import { useFlappyBirdLogic } from '@/hooks/useFlappyBirdLogic';
import type { ScoreEntry } from '@/types/game';

export default function FlappyBirdPage() {
  const {
    bird,
    pipes,
    score,
    gameStatus,
    countdownValue,
    leaderboardScores,
    startGame,
    restartGame,
    flapBird,
    loadLeaderboard,
    gameAreaHeight,
    gameAreaWidth,
  } = useFlappyBirdLogic();

  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false); // Changed from React.useState

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard, gameStatus]);

  const toggleLeaderboard = () => setIsLeaderboardOpen(!isLeaderboardOpen);

  const handleGameInteraction = useCallback(() => {
    if (gameStatus === 'playing') {
      flapBird();
    } else if (gameStatus === 'idle' || gameStatus === 'gameOver') {
      // For starting via screen click after game over, or on initial idle.
      // Consider if startGame should be directly called or only via StartScreen button
    }
  }, [gameStatus, flapBird]);
  
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.key === ' ') {
        event.preventDefault(); // Prevent scrolling
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
  const gameInstructions = {
    title: "How to Flap:",
    steps: [
      "Click/Tap the screen or Press Spacebar to flap.",
      "Guide the bird through pipe gaps.",
      "Each pipe passed scores 1 point.",
      "Don't hit pipes, ground, or sky!"
    ]
  };

  return (
    <main 
      className="flex-grow flex flex-col items-center justify-center p-2 sm:p-4 relative overflow-hidden bg-gradient-to-br from-cyan-400/20 to-blue-600/20"
      onClick={gameStatus === 'playing' ? handleGameInteraction : undefined} // Allow flap by clicking game area
      tabIndex={0} // Make main focusable for keydown
      style={{ outline: 'none' }} // Remove focus outline
    >
      <Button asChild variant="outline" className="absolute top-4 left-4 z-30 shadow-md">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Arcade
        </Link>
      </Button>

      <AnimatePresence>
        {gameStatus !== 'idle' && gameStatus !== 'countdown' && gameStatus !== 'gameOver' && (
          <motion.div
            key="hud-fb"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full contents"
          >
            <HUD
              score={score}
              timeLeft={-1} // Flappy bird is not timed
              onToggleLeaderboard={toggleLeaderboard}
              onRestart={restartGame}
              gameStatus={gameStatus}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {gameStatus === 'idle' && (
         <StartScreen
            onStartGame={startGame}
            title={gameTitle}
            description={gameDescription}
            instructions={gameInstructions}
            icon={BirdIcon}
          />
      )}

      {gameStatus === 'countdown' && (
        <motion.div
          key="countdown-fb"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-20 backdrop-blur-sm text-center"
        >
          <p className="text-8xl font-bold text-primary animate-ping" style={{animationDuration: '1s'}}>{countdownValue}</p>
          <p className="text-2xl font-headline mt-4">Get Ready to Flap!</p>
        </motion.div>
      )}

      <AnimatePresence>
        {gameStatus === 'playing' && (
          <motion.div
            key="gameboard-fb"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center w-full mt-16 sm:mt-20"
          >
            <FlappyBirdGameArea 
              bird={bird} 
              pipes={pipes} 
              gameAreaHeight={gameAreaHeight} 
              gameAreaWidth={gameAreaWidth} 
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {gameStatus === 'gameOver' && (
        <GameOverScreen
          score={score}
          onPlayAgain={startGame} // Restarting should go through the start sequence
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
    </main>
  );
}
