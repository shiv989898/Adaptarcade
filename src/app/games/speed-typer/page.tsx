
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Keyboard, RefreshCw, BarChart2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import HUD from '@/components/game/HUD';
import LeaderboardDialog from '@/components/game/LeaderboardDialog';
import StartScreen from '@/components/game/StartScreen';
import GameOverScreen from '@/components/game/GameOverScreen';
import WordDisplay from '@/components/game/WordDisplay';
import TypingInput from '@/components/game/TypingInput';
import { useTypingGameLogic } from '@/hooks/useTypingGameLogic';
import type { ScoreEntry } from '@/types/game'; // Ensure ScoreEntry is flexible enough or use a specific type

export default function SpeedTyperPage() {
  const {
    gameStatus,
    words,
    currentWordIndex,
    timeLeft,
    countdownValue,
    stats,
    leaderboardScores,
    startGame,
    restartGame,
    handleUserKeyPress,
    loadLeaderboard,
  } = useTypingGameLogic();

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard, gameStatus]);

  const [isLeaderboardOpen, setIsLeaderboardOpen] = React.useState(false);
  const toggleLeaderboard = () => setIsLeaderboardOpen(!isLeaderboardOpen);

  const gameTitle = "Speed Typer";
  const gameDescription = "Test your typing speed and accuracy. Type the displayed words as quickly and accurately as possible!";
  const gameInstructions = {
    title: "How to Type:",
    steps: [
      "Words will appear on the screen.",
      "Type them as fast and accurately as you can.",
      "Press SPACE after each word to move to the next.",
      "Correctly typed characters increase your WPM.",
      "Aim for high WPM and Accuracy!",
    ]
  };

  const handlePlayAgainFromGameOver = () => {
    startGame();
  };

  const handleShowLeaderboardFromGameOver = () => {
    setIsLeaderboardOpen(true);
  };
  
  const currentActiveWordText = gameStatus === 'playing' && words[currentWordIndex] ? words[currentWordIndex].text : "waiting for game";


  return (
    <main className="flex-grow flex flex-col items-center justify-center p-2 sm:p-4 relative overflow-hidden bg-gradient-to-br from-cyan-700/10 via-blue-700/10 to-indigo-700/10">
      <Button asChild variant="outline" className="absolute top-4 left-4 z-30 shadow-md">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Arcade
        </Link>
      </Button>

      <AnimatePresence>
        {gameStatus !== 'idle' && gameStatus !== 'countdown' && gameStatus !== 'gameOver' && (
          <motion.div
            key="hud-st"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full contents"
          >
            {/* HUD uses 'score' prop for primary metric. We'll pass WPM as score. */}
            <HUD
              score={stats.wpm} 
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
            onStartGame={startGame}
            title={gameTitle}
            description={gameDescription}
            instructions={gameInstructions}
            icon={Keyboard}
          />
      )}

      {gameStatus === 'countdown' && (
        <motion.div
          key="countdown-st"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-20 backdrop-blur-sm text-center"
        >
          <p className="text-8xl font-bold text-primary animate-ping" style={{animationDuration: '1s'}}>{countdownValue}</p>
          <p className="text-2xl font-headline mt-4">Get Ready to Type!</p>
        </motion.div>
      )}

      <AnimatePresence>
        {gameStatus === 'playing' && (
          <motion.div
            key="gameboard-st"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center w-full max-w-3xl mt-20 sm:mt-24"
          >
            <WordDisplay words={words} currentWordIndex={currentWordIndex} />
            <TypingInput 
                onKeyPress={handleUserKeyPress} 
                isDisabled={gameStatus !== 'playing'}
                currentWordText={currentActiveWordText}
            />
            <div className="mt-6 grid grid-cols-3 gap-4 text-center w-full max-w-md">
                <div>
                    <p className="text-sm text-muted-foreground">WPM</p>
                    <p className="text-3xl font-bold text-primary">{stats.wpm}</p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Accuracy</p>
                    <p className="text-3xl font-bold text-accent">
                        {stats.totalCharsTyped > 0 ? Math.round((stats.correctChars / stats.totalCharsTyped) * 100) : 100}%
                    </p>
                </div>
                 <div>
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p className="text-3xl font-bold text-primary">{timeLeft}</p>
                </div>
            </div>

            <Button onClick={restartGame} variant="outline" className="mt-8">
              <RefreshCw className="mr-2 h-4 w-4" /> Restart Test
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {gameStatus === 'gameOver' && (
        <GameOverScreen
          score={stats.wpm} // Display WPM as main score
          onPlayAgain={handlePlayAgainFromGameOver}
          onShowLeaderboard={handleShowLeaderboardFromGameOver}
          gameName={gameTitle}
          additionalInfo={`Accuracy: ${stats.accuracy}%`}
        />
      )}

      <LeaderboardDialog
        isOpen={isLeaderboardOpen}
        onClose={toggleLeaderboard}
        scores={leaderboardScores as ScoreEntry[]} // Cast if necessary, ensure ScoreEntry is compatible
        gameName={gameTitle}
      />
    </main>
  );
}
