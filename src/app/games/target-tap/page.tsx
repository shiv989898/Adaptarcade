
'use client';

import { useState, useEffect } from 'react';
import HUD from '@/components/game/HUD';
import LeaderboardDialog from '@/components/game/LeaderboardDialog';
import StartScreen from '@/components/game/StartScreen';
import ReactionGameBoard from '@/components/game/ReactionGameBoard';
import GameOverScreen from '@/components/game/GameOverScreen';
import { useGameLogic } from '@/hooks/useGameLogic';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';

// It's not possible to export metadata from a client component.
// If you need dynamic metadata, consider moving this to a layout.tsx for this route,
// or fetch metadata in a server component if possible.
// For now, this static approach won't work as expected in a client component.
// export const metadata: Metadata = {
//   title: 'Target Tap - Reflex Game',
//   description: 'Test your reflexes in this fast-paced target tapping game!',
// };

export default function TargetTapPage() {
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
  } = useGameLogic();

  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard, gameStatus]);

  const toggleLeaderboard = () => setIsLeaderboardOpen(!isLeaderboardOpen);

  const handlePlayAgainFromGameOver = () => {
    startGame();
  };
  
  const handleShowLeaderboardFromGameOver = () => {
    setIsLeaderboardOpen(true);
  };

  return (
    <main className="flex-grow flex flex-col items-center justify-center p-2 sm:p-4 relative overflow-hidden bg-gradient-to-br from-background to-primary/10">
      <Button asChild variant="outline" className="absolute top-4 left-4 z-20">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Arcade
        </Link>
      </Button>

      <AnimatePresence>
        {gameStatus !== 'idle' && gameStatus !== 'countdown' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full contents"
          >
            <HUD
              score={score}
              timeLeft={timeLeft}
              onToggleLeaderboard={toggleLeaderboard}
              onRestart={restartGame} // This will restart Target Tap
              gameStatus={gameStatus}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {gameStatus === 'idle' && (
         <StartScreen onStartGame={startGame} title="Target Tap" description="Tap the appearing targets as fast as you can!" />
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
            className="w-full flex justify-center mt-20 sm:mt-24" 
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

// For dynamic titles on game pages, you'd typically use a generateMetadata function
// in a server component or a layout.tsx file for the specific game route.
// Example (if this file were a server component or in layout.tsx for /games/target-tap):
// export async function generateMetadata(): Promise<Metadata> {
//   return {
//     title: 'Target Tap - Reflex Game',
//     description: 'Test your reflexes in this fast-paced target tapping game!',
//   };
// }
