
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react'; // Removed Hammer, Trophy as they are in other components
import { AnimatePresence, motion } from 'framer-motion';
import HUD from '@/components/game/HUD';
import LeaderboardDialog from '@/components/game/LeaderboardDialog';
import StartScreen from '@/components/game/StartScreen';
import GameOverScreen from '@/components/game/GameOverScreen';
import Mole from '@/components/game/Mole';
import { useMoleMashLogic, type MoleMashGameStatus } from '@/hooks/useMoleMashLogic';
import type { ScoreEntry } from '@/types/game';
import { Hammer } from 'lucide-react'; // Icon for StartScreen

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
    startGame(); 
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
    <main className="flex-grow flex flex-col items-center justify-center p-2 sm:p-4 relative overflow-hidden bg-gradient-to-br from-green-800/20 to-yellow-700/20">
      <Button asChild variant="outline" className="absolute top-4 left-4 z-30 shadow-md">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Arcade
        </Link>
      </Button>

      <AnimatePresence>
        {gameStatus !== 'idle' && gameStatus !== 'countdown' && gameStatus !== 'gameOver' && (
          <motion.div
            key="hud-mm"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full contents" 
          >
            <HUD
              score={score}
              timeLeft={timeLeft}
              onToggleLeaderboard={toggleLeaderboard}
              onRestart={restartGame} 
              gameStatus={gameStatus as any}
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
            icon={Hammer}
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
            className="flex flex-col items-center justify-center w-full mt-16 sm:mt-20" // Adjusted margin for HUD
          >
            <div 
              className="grid gap-2 sm:gap-3 p-3 sm:p-4 bg-lime-200/70 dark:bg-yellow-900/50 border-4 border-yellow-700/80 dark:border-yellow-600/70 rounded-xl shadow-xl"
              style={{
                gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                // Mole width is 5rem (w-20) or 6rem (w-24) + gap + padding.
                // Assuming sm:w-24 (6rem) and sm:gap-3 (0.75rem), p-4 (1rem each side = 2rem)
                width: `calc(${gridSize} * 6rem + (${gridSize-1} * 0.75rem) + 2rem)`, 
                maxWidth: '90vw',
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
            <p className="text-muted-foreground text-center mt-4 font-semibold">Mash those moles!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {gameStatus === 'gameOver' && (
        <GameOverScreen 
          score={score} 
          onPlayAgain={handlePlayAgainFromGameOver} 
          onShowLeaderboard={handleShowLeaderboardFromGameOver}
          gameName={gameTitle}
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
