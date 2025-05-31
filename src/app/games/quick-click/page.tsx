
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useQuickClickLogic, type QuickClickScoreEntry } from '@/hooks/useQuickClickLogic';
import Link from 'next/link';
import { ArrowLeft, MousePointerClick, Play, RotateCcw, Trophy, Star, Award, Zap, Timer } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import LeaderboardDialog from '@/components/game/LeaderboardDialog';
import StartScreen from '@/components/game/StartScreen'; // Import StartScreen
import GameOverScreen from '@/components/game/GameOverScreen'; // Import GameOverScreen

const QUICK_CLICK_GAME_TOTAL_DURATION = 5; 

export default function QuickClickPage() {
  const {
    score,
    timeLeft,
    gameStatus,
    countdownValue,
    leaderboardScores,
    startGame,
    restartGame,
    handleGameButtonClick,
    loadLeaderboard,
  } = useQuickClickLogic();

  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard, gameStatus]);

  const toggleLeaderboard = () => setIsLeaderboardOpen(!isLeaderboardOpen);

  const formatTime = (seconds: number) => {
    return seconds.toFixed(1); 
  };

  const timeProgress = (timeLeft / QUICK_CLICK_GAME_TOTAL_DURATION) * 100;

  const gameTitle = "Quick Click";
  const gameDescription = `Click the button as many times as you can in ${QUICK_CLICK_GAME_TOTAL_DURATION} seconds!`;
  const gameInstructions = {
    title: "How to Click:",
    steps: [
      "Repeatedly click or tap the large button.",
      "Each click scores 1 point.",
      "Aim for the highest score in 5 seconds!"
    ]
  };
  
  const handlePlayAgainFromGameOver = () => {
    startGame();
  };
  
  const handleShowLeaderboardFromGameOver = () => {
    setIsLeaderboardOpen(true);
  };


  return (
    <main className="flex-grow flex flex-col items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-purple-700/10 via-indigo-600/10 to-purple-800/10">
      <Button asChild variant="outline" className="absolute top-4 left-4 z-30 shadow-md">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Arcade
        </Link>
      </Button>
      
      <AnimatePresence>
        {gameStatus !== 'idle' && gameStatus !== 'countdown' && gameStatus !== 'gameOver' && (
          <motion.div
            key="hud-qc"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 w-auto max-w-[calc(100%-2rem)] z-10"
          >
             <Card className="bg-card/80 backdrop-blur-sm shadow-xl">
              <CardContent className="p-3 flex items-center justify-center gap-4 sm:gap-6">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground font-headline flex items-center gap-1 justify-center"><Star className="h-3 w-3" />CLICKS</p>
                  <p className="text-2xl sm:text-3xl font-bold text-primary">{score}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground font-headline flex items-center gap-1 justify-center"><Timer className="h-3 w-3" />TIME</p>
                  <p className={`text-2xl sm:text-3xl font-bold ${timeLeft <= 1.5 ? 'text-destructive animate-pulse' : 'text-accent'}`}>
                    {formatTime(timeLeft)}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={toggleLeaderboard} aria-label="Show Leaderboard" className="text-foreground/80 hover:text-foreground">
                  <Trophy className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
                 <Button variant="ghost" size="icon" onClick={restartGame} aria-label="Restart Game" className="text-foreground/80 hover:text-foreground" disabled={gameStatus === 'countdown'}>
                  <RotateCcw className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>


      {gameStatus === 'idle' && (
        <StartScreen 
            onStartGame={startGame} 
            title={gameTitle} 
            description={gameDescription}
            instructions={gameInstructions}
            icon={MousePointerClick}
          />
      )}

      {gameStatus === 'countdown' && (
        <motion.div 
          key="countdown-qc"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-20 backdrop-blur-sm text-center"
        >
          <p className="text-8xl font-bold text-primary animate-ping" style={{animationDuration: '1s'}}>{countdownValue}</p>
          <p className="text-2xl font-headline mt-4">Get Ready to Click!</p>
        </motion.div>
      )}

      <AnimatePresence>
        {gameStatus === 'playing' && (
          <motion.div
            key="playing-qc"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-6 w-full max-w-lg mt-20 sm:mt-24" // Adjusted margin for HUD
          >
            <Progress value={timeProgress} className="w-full h-4 [&>div]:bg-accent shadow-md" />
            
            <motion.div 
              whileTap={{ scale: 0.95, transition: { duration: 0.05 } }} 
              className="w-full"
            >
              <Button 
                onClick={handleGameButtonClick} 
                className="w-full h-56 sm:h-64 text-3xl sm:text-4xl font-bold shadow-2xl hover:scale-[1.02] active:scale-[0.98] transform transition-transform duration-100 ease-out bg-gradient-to-br from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 active:from-primary/80 active:to-purple-600/80 rounded-2xl"
                style={{ WebkitTapHighlightColor: 'transparent' }} 
              >
                CLICK ME!
              </Button>
            </motion.div>
             <p className="text-muted-foreground text-center text-sm sm:text-base">Keep clicking until the time runs out!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {gameStatus === 'gameOver' && (
         <GameOverScreen 
          score={score} 
          onPlayAgain={handlePlayAgainFromGameOver} 
          onShowLeaderboard={handleShowLeaderboardFromGameOver}
          gameName={gameTitle}
          additionalInfo={`You clicked ${score} times!`}
        />
      )}
      
      <LeaderboardDialog 
        isOpen={isLeaderboardOpen} 
        onClose={toggleLeaderboard} 
        scores={leaderboardScores as QuickClickScoreEntry[]}
        gameName={gameTitle}
      />
    </main>
  );
}
