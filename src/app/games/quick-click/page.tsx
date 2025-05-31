
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuickClickLogic, type QuickClickScoreEntry } from '@/hooks/useQuickClickLogic';
import Link from 'next/link';
import { ArrowLeft, MousePointerClick, Play, RotateCcw, Trophy, Star, Award, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import LeaderboardDialog from '@/components/game/LeaderboardDialog'; // Re-use for consistency

// Static metadata for this page
// export const metadata = {
//   title: 'Quick Click Challenge',
//   description: 'Click as fast as you can in this speedy challenge!',
// };

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
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <main className="flex-grow flex flex-col items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-background to-secondary/20">
      <Button asChild variant="outline" className="absolute top-4 left-4 z-30">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Arcade
        </Link>
      </Button>

      {gameStatus === 'idle' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl bg-card/90 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="inline-flex items-center justify-center mb-4">
                <MousePointerClick className="h-16 w-16 text-primary animate-pulse" />
              </div>
              <CardTitle className="text-5xl font-headline text-primary">Quick Click</CardTitle>
              <CardDescription className="text-lg text-muted-foreground pt-2">
                Click the button as many times as you can in 5 seconds!
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
              <Button onClick={startGame} size="lg" className="w-full text-xl py-8 shadow-lg hover:shadow-primary/50">
                <Play className="mr-3 h-7 w-7" /> Start Challenge
              </Button>
            </CardContent>
          </Card>
        </motion.div>
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
            className="flex flex-col items-center gap-8 w-full max-w-lg"
          >
            <Card className="w-full bg-card/80 backdrop-blur-sm shadow-xl">
              <CardContent className="p-6 flex items-center justify-around text-center">
                <div>
                  <p className="text-sm text-muted-foreground font-headline flex items-center gap-1 justify-center"><Star className="h-4 w-4" />CLICKS</p>
                  <p className="text-4xl font-bold text-primary">{score}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-headline flex items-center gap-1 justify-center"><Zap className="h-4 w-4" />TIME</p>
                  <p className={`text-4xl font-bold ${timeLeft <= 2 ? 'text-destructive animate-pulse' : 'text-accent'}`}>
                    {formatTime(timeLeft)}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Button 
              onClick={handleGameButtonClick} 
              className="w-full h-48 text-3xl font-bold shadow-2xl hover:scale-105 active:scale-95 transform transition-transform duration-150 ease-out bg-primary hover:bg-primary/90"
              style={{ WebkitTapHighlightColor: 'transparent' }} // For mobile tap feedback
            >
              CLICK ME!
            </Button>
             <p className="text-muted-foreground text-center">Keep clicking until the time runs out!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {gameStatus === 'gameOver' && (
        <motion.div
          key="gameover-qc"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-20 p-4"
        >
          <Card className="w-full max-w-md shadow-2xl bg-card text-card-foreground">
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-primary/20 mb-4">
                <Award className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-4xl font-headline text-primary">Challenge Over!</CardTitle>
              <CardDescription className="text-lg text-muted-foreground pt-2">
                You clicked
              </CardDescription>
              <p className="text-5xl font-bold text-accent py-2">{score} times!</p>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <Button onClick={restartGame} size="lg" className="w-full shadow-lg hover:shadow-primary/50">
                <RotateCcw className="mr-2 h-5 w-5" /> Play Again
              </Button>
              <Button onClick={toggleLeaderboard} variant="outline" size="lg" className="w-full">
                <Trophy className="mr-2 h-5 w-5" /> View Leaderboard
              </Button>
            </CardContent>
            <CardFooter className="pt-6">
              <p className="text-xs text-muted-foreground text-center w-full">Amazing clicking speed!</p>
            </CardFooter>
          </Card>
        </motion.div>
      )}
      
      <LeaderboardDialog 
        isOpen={isLeaderboardOpen} 
        onClose={toggleLeaderboard} 
        scores={leaderboardScores as QuickClickScoreEntry[]} // Cast as ScoreEntry if structure is compatible
        // If LeaderboardDialog expects a specific structure, you might need to adapt scores or the dialog
      />
    </main>
  );
}
