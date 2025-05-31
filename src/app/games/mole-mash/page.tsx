
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Hammer } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import HUD from '@/components/game/HUD';
import LeaderboardDialog from '@/components/game/LeaderboardDialog';
import StartScreen from '@/components/game/StartScreen';
import GameOverScreen from '@/components/game/GameOverScreen';
import Mole from '@/components/game/Mole';
import { useMoleMashLogic } from '@/hooks/useMoleMashLogic';
import type { ScoreEntry, Difficulty } from '@/types/game';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function MoleMashPage() {
  const {
    score,
    timeLeft,
    gameStatus,
    countdownValue,
    leaderboardScores,
    moles,
    gridSize,
    currentDifficulty, // This is from the hook, reflects difficulty *during* the game
    startGame,
    restartGame,
    handleMoleClick,
    loadLeaderboard,
  } = useMoleMashLogic();

  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium'); // This is for the UI selector

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard, gameStatus]);

  const toggleLeaderboard = () => setIsLeaderboardOpen(!isLeaderboardOpen);

  const handleStartGameWithDifficulty = () => {
    startGame(selectedDifficulty);
  };

  const handlePlayAgainFromGameOver = () => {
    restartGame();
  };

  const handleShowLeaderboardFromGameOver = () => {
    setIsLeaderboardOpen(true);
  };

  const gameTitle = "Mole Mash";
  const gameDescription = "Whack the moles as they appear! Quick reflexes are key. Difficulty affects mole speed.";
  const gameInstructions = {
    title: "How to Mash:",
    steps: [
      "Select your difficulty.",
      "Click or tap moles that pop out of holes.",
      "Each mole hit scores 1 point.",
      "Score as many as you can before time runs out!"
    ]
  };

  const handleDifficultyChange = useCallback((value: string) => {
    setSelectedDifficulty(value as Difficulty);
  }, []); 

  const difficultySelectorUI = useCallback((
    <RadioGroup
      value={selectedDifficulty}
      onValueChange={handleDifficultyChange}
      className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 py-2"
    >
      {(['easy', 'medium', 'hard'] as Difficulty[]).map(diff => (
        <div key={diff} className="flex items-center space-x-2">
          <RadioGroupItem value={diff} id={`diff-mm-${diff}`} className="text-primary focus:ring-primary"/>
          <Label htmlFor={`diff-mm-${diff}`} className="capitalize text-sm sm:text-base font-medium hover:text-primary cursor-pointer">
            {diff}
          </Label>
        </div>
      ))}
    </RadioGroup>
  ), [selectedDifficulty, handleDifficultyChange]);

  return (
    <main className="flex-grow flex flex-col items-center justify-center p-2 sm:p-4 relative overflow-hidden bg-gradient-to-br from-purple-600/40 via-pink-500/30 to-orange-500/20">
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
              gameStatus={gameStatus}
              scoreLabel="SCORE"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {gameStatus === 'idle' && (
         <StartScreen
            onStartGame={handleStartGameWithDifficulty}
            title={gameTitle}
            description={gameDescription}
            instructions={gameInstructions}
            icon={Hammer}
            difficultySelector={difficultySelectorUI}
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
          <p className="text-2xl font-headline mt-4">Get Ready to Mash ({selectedDifficulty})!</p>
        </motion.div>
      )}

      <AnimatePresence>
        {gameStatus === 'playing' && (
          <motion.div
            key="gameboard-mm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center w-full mt-16 sm:mt-20"
          >
            <div
              className="grid gap-2 sm:gap-3 p-3 sm:p-4 bg-lime-200/70 dark:bg-yellow-900/50 border-4 border-yellow-700/80 dark:border-yellow-600/70 rounded-xl shadow-xl"
              style={{
                gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
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
          gameName={`${gameTitle} (${currentDifficulty})`}
          scoreUnit="Points"
        />
      )}

      <LeaderboardDialog
        isOpen={isLeaderboardOpen}
        onClose={toggleLeaderboard}
        scores={leaderboardScores as ScoreEntry[]}
        gameName={gameTitle}
        scoreColumnName="Score"
      />
    </main>
  );
}
