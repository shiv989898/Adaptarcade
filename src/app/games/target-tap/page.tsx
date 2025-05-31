
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
import { ArrowLeft, Zap, ChevronRight } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { Difficulty } from '@/types/game';

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
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard, gameStatus]);

  const toggleLeaderboard = () => setIsLeaderboardOpen(!isLeaderboardOpen);

  const handleStartGameWithDifficulty = () => {
    startGame(selectedDifficulty);
  };

  const handlePlayAgainFromGameOver = () => {
    // Restarting should ideally bring back to start screen with difficulty selection
    // For now, it will use the last selected difficulty or default
    // A better UX might be to set gameStatus to 'idle' which shows StartScreen
    restartGame(); // This sets status to idle, StartScreen will pick up next start
  };
  
  const handleShowLeaderboardFromGameOver = () => {
    setIsLeaderboardOpen(true);
  };

  const gameTitle = "Target Tap";
  const gameDescription = "Tap the appearing targets as fast as you can! Difficulty affects speed and target types.";
  const gameInstructions = {
    title: "How to Tap:",
    steps: [
      "Select your difficulty.",
      "Click or tap colored targets that appear.",
      "Smaller, accent-colored targets are worth more.",
      "Score as high as you can before time runs out!"
    ]
  };

  const difficultySelectorUI = (
    <RadioGroup 
      value={selectedDifficulty} 
      onValueChange={(value) => setSelectedDifficulty(value as Difficulty)}
      className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 py-2"
    >
      {(['easy', 'medium', 'hard'] as Difficulty[]).map(diff => (
        <div key={diff} className="flex items-center space-x-2">
          <RadioGroupItem value={diff} id={`diff-${diff}`} className="text-primary focus:ring-primary"/>
          <Label htmlFor={`diff-${diff}`} className="capitalize text-sm sm:text-base font-medium hover:text-primary cursor-pointer">
            {diff}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );

  return (
    <main className="flex-grow flex flex-col items-center justify-center p-2 sm:p-4 relative overflow-hidden bg-gradient-to-br from-indigo-700/10 via-purple-700/10 to-pink-700/10">
      <Button asChild variant="outline" className="absolute top-4 left-4 z-30 shadow-md">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Arcade
        </Link>
      </Button>

      <AnimatePresence>
        {gameStatus !== 'idle' && gameStatus !== 'countdown' && gameStatus !== 'gameOver' && (
          <motion.div
            key="hud-tt"
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
            icon={Zap}
            difficultySelector={difficultySelectorUI}
          />
      )}

      {gameStatus === 'countdown' && (
        <motion.div 
          key="countdown-tt"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-20 backdrop-blur-sm text-center"
        >
          <p className="text-8xl font-bold text-primary animate-ping" style={{animationDuration: '1s'}}>{countdownValue}</p>
          <p className="text-2xl font-headline mt-4">Get Ready to Tap ({selectedDifficulty})!</p>
        </motion.div>
      )}
      
      <AnimatePresence>
        {gameStatus === 'playing' && (
          <motion.div
            key="gameboard-tt"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full flex justify-center mt-16 sm:mt-20" 
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
          gameName={`${gameTitle} (${selectedDifficulty})`}
        />
      )}
      
      <LeaderboardDialog 
        isOpen={isLeaderboardOpen} 
        onClose={toggleLeaderboard} 
        scores={leaderboardScores}
        gameName={gameTitle} // Leaderboard shows combined scores for now
      />
    </main>
  );
}
