
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Keyboard, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import HUD from '@/components/game/HUD';
import LeaderboardDialog from '@/components/game/LeaderboardDialog';
import StartScreen from '@/components/game/StartScreen';
import GameOverScreen from '@/components/game/GameOverScreen';
import WordDisplay from '@/components/game/WordDisplay';
import TypingInput from '@/components/game/TypingInput';
import { useTypingGameLogic } from '@/hooks/useTypingGameLogic';
import type { ScoreEntry, WpmEntry } from '@/types/game';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import type { ChartConfig } from '@/components/ui/chart';


const TIME_OPTIONS = [
  { label: '15s', value: 15 },
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
  { label: '90s', value: 90 },
  { label: '120s', value: 120 },
];
const DEFAULT_DURATION = 60;

const chartConfig = {
  wpm: {
    label: "WPM",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;


export default function SpeedTyperPage() {
  const [selectedDurationUI, setSelectedDurationUI] = useState<number>(DEFAULT_DURATION);
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
    setSelectedDuration: setLogicSelectedDuration, // from hook
  } = useTypingGameLogic(selectedDurationUI);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard, gameStatus]);

  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const toggleLeaderboard = () => setIsLeaderboardOpen(!isLeaderboardOpen);

  const handleStartGameWithDuration = () => {
    setLogicSelectedDuration(selectedDurationUI); // Ensure hook uses UI selected duration
    startGame(selectedDurationUI);
  };
  
  const handleDurationChange = useCallback((value: string) => {
    setSelectedDurationUI(parseInt(value, 10));
  }, []);

  const durationSelectorUI = useMemo(() => (
    <RadioGroup
      value={selectedDurationUI.toString()}
      onValueChange={handleDurationChange}
      className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 py-2"
    >
      {TIME_OPTIONS.map(option => (
        <div key={option.value} className="flex items-center space-x-2">
          <RadioGroupItem value={option.value.toString()} id={`duration-${option.value}`} className="text-primary focus:ring-primary"/>
          <Label htmlFor={`duration-${option.value}`} className="text-sm sm:text-base font-medium hover:text-primary cursor-pointer">
            {option.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  ), [selectedDurationUI, handleDurationChange]);

  const gameTitle = "Speed Typer";
  const gameDescription = "Test your typing speed and accuracy. Select a duration and type the displayed words as quickly and accurately as possible!";
  const gameInstructions = {
    title: "How to Type:",
    steps: [
      "Select your test duration.",
      "Words will appear on the screen.",
      "Type them as fast and accurately as you can.",
      "Press SPACE after each word to move to the next.",
      "Strive for high WPM and Accuracy!",
    ]
  };

  const handlePlayAgainFromGameOver = () => {
    startGame(selectedDurationUI); // Restart with currently selected UI duration
  };

  const handleShowLeaderboardFromGameOver = () => {
    setIsLeaderboardOpen(true);
  };
  
  const currentActiveWordText = gameStatus === 'playing' && words[currentWordIndex] ? words[currentWordIndex].text : "waiting for game";

  const WpmChart = ({ data }: { data: WpmEntry[] }) => {
    if (!data || data.length === 0) return <p className="text-muted-foreground text-center">No WPM data to display.</p>;
    return (
      <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <ResponsiveContainer width="100%" height={250}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" />
          <XAxis dataKey="time" unit="s" stroke="hsl(var(--muted-foreground))" tick={{fontSize: 12}} />
          <YAxis stroke="hsl(var(--muted-foreground))" tick={{fontSize: 12}} label={{ value: 'WPM', angle: -90, position: 'insideLeft', fill:'hsl(var(--muted-foreground))', fontSize: 12, dy:40 }}/>
          <RechartsTooltip
            content={<ChartTooltipContent indicator="line" />}
            cursor={{stroke: "hsl(var(--accent))", strokeWidth: 2, strokeDasharray: "3 3"}}
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Line type="monotone" dataKey="wpm" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{ r: 6, fill: "hsl(var(--primary))" }} />
        </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    );
  };

  return (
    <main className="flex-grow flex flex-col items-center justify-center p-2 sm:p-4 relative overflow-hidden bg-gradient-to-br from-indigo-600/10 via-purple-700/10 to-purple-800/10">
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
            className="w-full contents" // Makes HUD take space in layout flow
          >
            <HUD
              score={stats.wpm} 
              timeLeft={timeLeft}
              onToggleLeaderboard={toggleLeaderboard}
              onRestart={restartGame}
              gameStatus={gameStatus}
              scoreLabel="WPM"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {gameStatus === 'idle' && (
         <StartScreen
            onStartGame={handleStartGameWithDuration}
            title={gameTitle}
            description={gameDescription}
            instructions={gameInstructions}
            icon={Keyboard}
            difficultySelector={durationSelectorUI}
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
          <p className="text-2xl font-headline mt-4">Get Ready to Type! ({selectedDurationUI}s)</p>
        </motion.div>
      )}

      <AnimatePresence>
        {gameStatus === 'playing' && (
          <motion.div
            key="gameboard-st"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center w-full max-w-3xl mt-20 sm:mt-24" // Adjusted margin for HUD
          >
            <WordDisplay words={words} currentWordIndex={currentWordIndex} />
            <TypingInput 
                onKeyPress={handleUserKeyPress} 
                isDisabled={gameStatus !== 'playing'}
                currentWordText={currentActiveWordText} // for aria-label
            />
            <div className="mt-6 grid grid-cols-3 gap-4 text-center w-full max-w-md">
                <div>
                    <p className="text-sm text-muted-foreground">WPM</p>
                    <p className="text-3xl font-bold text-primary">{stats.wpm}</p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Accuracy</p>
                    <p className="text-3xl font-bold text-accent">
                        {stats.totalCharsTyped > 0 ? Math.round(stats.accuracy) : 100}%
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
          score={stats.wpm} 
          onPlayAgain={handlePlayAgainFromGameOver}
          onShowLeaderboard={handleShowLeaderboardFromGameOver}
          gameName={`${gameTitle} (${selectedDurationUI}s Test)`}
          additionalInfo={`Accuracy: ${stats.accuracy.toFixed(1)}%`}
          scoreUnit="WPM"
        >
          <div className="mt-4 w-full">
            <h3 className="text-lg font-semibold text-center mb-2 text-primary">WPM Over Time</h3>
            <WpmChart data={stats.wpmHistory} />
          </div>
        </GameOverScreen>
      )}

      <LeaderboardDialog
        isOpen={isLeaderboardOpen}
        onClose={toggleLeaderboard}
        scores={leaderboardScores as ScoreEntry[]} 
        gameName={gameTitle}
        scoreColumnName="WPM"
      />
    </main>
  );
}
