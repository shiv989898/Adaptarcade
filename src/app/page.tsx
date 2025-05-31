
'use client';

import { useState, useEffect } from 'react';
import HUD from '@/components/game/HUD';
import LeaderboardDialog from '@/components/game/LeaderboardDialog';
import StartScreen from '@/components/game/StartScreen';
import ReactionGameBoard from '@/components/game/ReactionGameBoard';
import GameOverScreen from '@/components/game/GameOverScreen';
import { useGameLogic } from '@/hooks/useGameLogic';
import { Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function HomePage() {
  const {
    score,
    timeLeft,
    gameStatus,
    targets,
    leaderboardScores,
    countdownValue,
    startGame,
    restartGame,
    handleTargetClick,
    loadLeaderboard,
    setGameStatus, // Added to handle navigation from GameOverScreen
  } = useGameLogic();

  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard, gameStatus]);

  const toggleLeaderboard = () => setIsLeaderboardOpen(!isLeaderboardOpen);

  const handlePlayAgainFromGameOver = () => {
    // setGameStatus('idle'); // This will show StartScreen briefly, then startGame will trigger countdown
    startGame(); // Directly start the game sequence
  };
  
  const handleShowLeaderboardFromGameOver = () => {
    // setGameStatus('idle'); // Or keep game over screen in background?
    setIsLeaderboardOpen(true);
  }

  return (
    <main className="flex-grow flex flex-col items-center justify-center p-2 sm:p-4 relative overflow-hidden bg-gradient-to-br from-background to-primary/10">
      <AnimatePresence>
        {gameStatus !== 'idle' && gameStatus !== 'countdown' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full contents" // Use contents to not interfere with HUD's fixed positioning
          >
            <HUD
              score={score}
              timeLeft={timeLeft}
              onToggleLeaderboard={toggleLeaderboard}
              onRestart={restartGame}
              gameStatus={gameStatus}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {gameStatus === 'idle' && (
         <StartScreen onStartGame={startGame} />
      )}

      {gameStatus === 'countdown' && (
        <motion.div 
          key="countdown"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-20 backdrop-blur-sm text-center"
        >
          <p className="text-8xl font-bold text-primary animate-ping" style={{animationDuration: '1s'}}>{countdownValue}</p>
          <p className="text-2xl font-headline mt-4">Get Ready!</p>
        </motion.div>
      )}
      
      <AnimatePresence>
        {gameStatus === 'playing' && (
          <motion.div
            key="gameboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full flex justify-center mt-20 sm:mt-24" // Add margin for HUD
          >
            <ReactionGameBoard targets={targets} onTargetClick={handleTargetClick} />
          </motion.div>
        )}
      </AnimatePresence>

      {gameStatus === 'gameOver' && (
        <GameOverScreen 
          score={score} 
          onPlayAgain={handlePlayAgainFromGameOver} 
          onShowLeaderboard={handleShowLeaderboardFromGameOver}
        />
      )}
      
      <LeaderboardDialog isOpen={isLeaderboardOpen} onClose={toggleLeaderboard} scores={leaderboardScores} />
    </main>
  );
}
