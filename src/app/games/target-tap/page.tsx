
'use client';

import { useState, useEffect, useCallback } from 'react';
import HUD from '@/components/game/HUD';
import LeaderboardDialog from '@/components/game/LeaderboardDialog';
import StartScreen from '@/components/game/StartScreen';
import ReactionGameBoard from '@/components/game/ReactionGameBoard';
import GameOverScreen from '@/components/game/GameOverScreen';
import { useGameLogic } from '@/hooks/useGameLogic';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Zap, Crosshair, ShieldX, Disc, Smile, Meh, Frown } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { DecoyFrequencyMode, ScoreEntry } from '@/types/game';

const MODE_DETAILS: Record<DecoyFrequencyMode, { label: string; icon: LucideIcon; description: string }> = {
  zen: { label: "Zen", icon: Smile, description: "0% Decoys: Pure precision practice." },
  challenging: { label: "Challenging", icon: Meh, description: "25% Decoys: A balanced test." },
  expert: { label: "Expert", icon: Frown, description: "40% Decoys: High risk, high reward!" },
};

export default function TargetTapPage() {
  const {
    score,
    timeLeft,
    gameStatus,
    targets,
    leaderboardScores,
    countdownValue,
    currentMode, // Use currentMode from hook
    startGame,
    restartGame,
    handleTargetClick,
    loadLeaderboard,
    setCurrentMode, // Use to set mode from UI
  } = useGameLogic();

  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  // Selected mode for the UI, hook's currentMode is the source of truth during game
  const [selectedUIMode, setSelectedUIMode] = useState<DecoyFrequencyMode>('challenging'); 

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard, gameStatus]);

  useEffect(() => {
    // Sync UI selection with hook's mode if it changes (e.g. on initial load if hook has a different default)
    // This is mostly for consistency if the hook's default changes.
    setSelectedUIMode(currentMode);
  }, [currentMode]);


  const toggleLeaderboard = () => setIsLeaderboardOpen(!isLeaderboardOpen);

  const handleStartGameWithMode = () => {
    startGame(selectedUIMode);
  };

  const handlePlayAgainFromGameOver = () => {
    // Restart will use the mode that was active during the game over
    // or we can let the user re-select from the idle screen after restartGame puts it there.
    // For now, restartGame transitions to idle, allowing re-selection.
    restartGame(); 
  };

  const handleShowLeaderboardFromGameOver = () => {
    setIsLeaderboardOpen(true);
  };

  const gameTitle = "Precision Tap";
  const gameDescription = "Targets grow, points decay! Tap fast & accurately. Choose your challenge.";
  const gameInstructions = {
    title: "How to Tap with Precision:",
    steps: [
      <>Select your game mode (decoy frequency).</>,
      <>Targets start small and <span className="font-semibold text-accent">grow</span>. Tap them quick!</>,
      <>The <span className="font-semibold text-primary">smaller</span> the target when tapped, the <span className="font-semibold text-primary">more points</span> you get.</>,
      <>Blue/Purple targets (<Disc className='inline h-3 w-3 text-primary relative top-[-1px]' />): Standard points.</>,
      <>Bright Green, smaller targets (<Crosshair className='inline h-3 w-3 text-accent relative top-[-1px]' />): High value! Hit them fast.</>,
      <>Red decoy targets (<ShieldX className='inline h-3 w-3 text-destructive relative top-[-1px]' />): Deduct points! Do NOT tap.</>,
      <>Score as high as you can before time runs out!</>
    ]
  };

  const handleModeChange = useCallback((value: string) => {
    const newMode = value as DecoyFrequencyMode;
    setSelectedUIMode(newMode);
    // Optional: if you want the hook's mode to update instantly on selection, not just on game start
    // setCurrentMode(newMode); 
  }, [setSelectedUIMode]);

  const modeSelectorUI = useCallback((
    <RadioGroup
      value={selectedUIMode}
      onValueChange={handleModeChange}
      className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 py-2"
    >
      {(['zen', 'challenging', 'expert'] as DecoyFrequencyMode[]).map(mode => {
        const Icon = MODE_DETAILS[mode].icon;
        return (
          <div key={mode} className="flex items-center space-x-2 group cursor-pointer" onClick={() => handleModeChange(mode)}>
            <RadioGroupItem value={mode} id={`mode-${mode}`} className="text-primary focus:ring-primary"/>
            <Label htmlFor={`mode-${mode}`} className="capitalize text-sm sm:text-base font-medium hover:text-primary cursor-pointer flex items-center gap-1.5">
              <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors"/> {MODE_DETAILS[mode].label}
            </Label>
          </div>
        );
      })}
    </RadioGroup>
  ), [selectedUIMode, handleModeChange]);
  
  const currentModeDetails = MODE_DETAILS[gameStatus === 'playing' || gameStatus === 'gameOver' ? currentMode : selectedUIMode];


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
            key="hud-pt"
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
            onStartGame={handleStartGameWithMode}
            title={gameTitle}
            description={gameDescription}
            instructions={gameInstructions}
            icon={Zap}
            difficultySelector={modeSelectorUI} // Pass modeSelectorUI here
          />
      )}

      {gameStatus === 'countdown' && (
        <motion.div
          key="countdown-pt"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-20 backdrop-blur-sm text-center"
        >
          <p className="text-8xl font-bold text-primary animate-ping" style={{animationDuration: '1s'}}>{countdownValue}</p>
          <p className="text-2xl font-headline mt-4">Get Ready for {gameTitle} ({currentModeDetails.label} Mode)!</p>
          <p className="text-sm text-muted-foreground">{currentModeDetails.description}</p>
        </motion.div>
      )}

      <AnimatePresence>
        {gameStatus === 'playing' && (
          <motion.div
            key="gameboard-pt"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full flex justify-center mt-16 sm:mt-20"
          >
            <ReactionGameBoard targets={targets} onTargetClick={handleTargetClick} gameAreaHeight="min(75vh, 500px)" />
          </motion.div>
        )}
      </AnimatePresence>

      {gameStatus === 'gameOver' && (
        <GameOverScreen
          score={score}
          onPlayAgain={handlePlayAgainFromGameOver}
          onShowLeaderboard={handleShowLeaderboardFromGameOver}
          gameName={`${gameTitle} (${currentModeDetails.label} Mode)`}
          additionalInfo={score > 150 ? "Incredible precision!" : (score > 50 ? "Great tapping!" : "Keep practicing that accuracy!")}
        />
      )}

      <LeaderboardDialog
        isOpen={isLeaderboardOpen}
        onClose={toggleLeaderboard}
        scores={leaderboardScores as ScoreEntry[]}
        gameName={`${gameTitle} (${currentModeDetails.label})`}
      />
    </main>
  );
}
