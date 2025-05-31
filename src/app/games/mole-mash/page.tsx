
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Hammer, Trophy } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import HUD from '@/components/game/HUD';
import LeaderboardDialog from '@/components/game/LeaderboardDialog';
import StartScreen from '@/components/game/StartScreen';
import GameOverScreen from '@/components/game/GameOverScreen';
import Mole from '@/components/game/Mole';
import { useMoleMashLogic, type MoleMashGameStatus } from '@/hooks/useMoleMashLogic';
import type { ScoreEntry } from '@/types/game';

export default function MoleMashPage() {
  const {
    score,
    timeLeft,
    gameStatus,
    countdownValue,
    leaderboardScores,
    moles,
    gridSize,
    startGame,
    restartGame,
    handleMoleClick,
    loadLeaderboard,
  } = useMoleMashLogic();

  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard, gameStatus]);

  const toggleLeaderboard = () => setIsLeaderboardOpen(!isLeaderboardOpen);

  const handlePlayAgainFromGameOver = () => {
    startGame(); // This will handle the countdown and transition
  };
  
  const handleShowLeaderboardFromGameOver = () => {
    setIsLeaderboardOpen(true);
  };

  const gameTitle = "Mole Mash";
  const gameDescription = "Whack the moles as they appear! Quick reflexes are key.";
  const gameInstructions = {
    title: "How to Mash:",
    steps: [
      "Click or tap moles that pop out of holes.",
      "Each mole hit scores 1 point.",
      "Score as many as you can before time runs out!"
    ]
  };

  return (
    <main className="flex-grow flex flex-col items-center justify-center p-2 sm:p-4 relative overflow-hidden bg-gradient-to-br from-background to-yellow-700/20">
      <Button asChild variant="outline" className="absolute top-4 left-4 z-30">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Arcade
        </Link>
      </Button>

      <AnimatePresence>
        {gameStatus !== 'idle' && gameStatus !== 'countdown' && gameStatus !== 'gameOver' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full contents" // Ensure HUD is positioned correctly by its own fixed styles
          >
            <HUD
              score={score}
              timeLeft={timeLeft}
              onToggleLeaderboard={toggleLeaderboard}
              onRestart={restartGame} 
              gameStatus={gameStatus as any} // Cast for HUD compatibility
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
          />
      )}

      {gameStatus === 'countdown' && (
        <motion.div 
          key="countdown-mm"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-20 backdrop-blur-sm text-center"
        >
          <p className="text-8xl font-bold text-primary animate-ping" style={{animationDuration: '1s'}}>{countdownValue}</p>
          <p className="text-2xl font-headline mt-4">Get Ready to Mash!</p>
        </motion.div>
      )}
      
      <AnimatePresence>
        {gameStatus === 'playing' && (
          <motion.div
            key="gameboard-mm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center w-full mt-20 sm:mt-24"
          >
            <div 
              className="grid gap-2 sm:gap-4 p-2 sm:p-4 bg-green-700/30 border-4 border-green-800/50 rounded-lg shadow-xl"
              style={{
                gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                width: `calc(${gridSize} * 6rem + (${gridSize-1} * 0.5rem) + 2rem)`, // Approx based on Mole size + gap + padding
                maxWidth: '90vw', // Ensure it doesn't overflow on small screens
              }}
            >
              {moles.map((mole, index) => (
                <Mole
                  key={mole.id}
                  hasMole={mole.hasMole}
                  onClick={() => handleMoleClick(index)}
                />
              ))}
            </div>
            <p className="text-muted-foreground text-center mt-4">Mash those moles!</p>
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
      
      <LeaderboardDialog 
        isOpen={isLeaderboardOpen} 
        onClose={toggleLeaderboard} 
        scores={leaderboardScores as ScoreEntry[]} // Cast for LeaderboardDialog compatibility
        gameName={gameTitle}
      />
    </main>
  );
}
