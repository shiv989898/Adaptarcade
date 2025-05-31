
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, RotateCcw, Timer, Star } from 'lucide-react';
import type { GameStatus } from '@/hooks/useGameLogic';

interface HUDProps {
  score: number;
  timeLeft: number;
  onToggleLeaderboard: () => void;
  onRestart: () => void;
  gameStatus: GameStatus | string;
  scoreLabel?: string; // New prop
}

const HUD: React.FC<HUDProps> = ({ score, timeLeft, onToggleLeaderboard, onRestart, gameStatus, scoreLabel }) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(1, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isGameOver = gameStatus === 'gameOver';
  const isPlaying = gameStatus === 'playing';

  return (
    <Card className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 w-auto max-w-[calc(100%-1.5rem)] sm:max-w-[calc(100%-2rem)] bg-card/80 backdrop-blur-md shadow-xl z-10 border-border">
      <CardContent className="p-2 sm:p-3 flex items-center justify-center gap-2.5 sm:gap-4">
        <div className="text-center px-1 sm:px-2">
          <p className="text-xs sm:text-sm text-muted-foreground font-headline flex items-center gap-1 justify-center"><Star className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{scoreLabel || 'SCORE'}</p>
          <p className="text-xl sm:text-2xl font-bold text-primary min-w-[4ch]">{score}</p>
        </div>
        
        <div className="w-px h-8 sm:h-10 bg-border self-center"></div>

        <div className="text-center px-1 sm:px-2">
          <p className="text-xs sm:text-sm text-muted-foreground font-headline flex items-center gap-1 justify-center"><Timer className="h-3 w-3 sm:h-3.5 sm:w-3.5" />TIME</p>
          <p className={`text-xl sm:text-2xl font-bold min-w-[5ch] ${timeLeft <= 5 && !isGameOver && isPlaying ? 'text-destructive animate-pulse' : 'text-accent'}`}>
            {formatTime(timeLeft)}
          </p>
        </div>

        <div className="w-px h-8 sm:h-10 bg-border self-center"></div>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggleLeaderboard} 
          aria-label="Show Leaderboard"
          className="text-foreground/80 hover:text-foreground h-9 w-9 sm:h-10 sm:w-10"
        >
          <Trophy className="h-5 w-5 sm:h-5 sm:w-5" />
        </Button>
         <Button 
          variant="ghost" 
          size="icon" 
          onClick={onRestart} 
          aria-label="Restart Game"
          className="text-foreground/80 hover:text-foreground h-9 w-9 sm:h-10 sm:w-10"
          disabled={gameStatus === 'countdown'}
        >
          <RotateCcw className="h-5 w-5 sm:h-5 sm:w-5" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default HUD;
