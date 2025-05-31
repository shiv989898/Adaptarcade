
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, RotateCcw, AlarmClock, Star } from 'lucide-react';
import type { GameStatus } from '@/hooks/useGameLogic';

interface HUDProps {
  score: number;
  timeLeft: number;
  onToggleLeaderboard: () => void;
  onRestart: () => void;
  gameStatus: GameStatus;
}

const HUD: React.FC<HUDProps> = ({ score, timeLeft, onToggleLeaderboard, onRestart, gameStatus }) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isGameOver = gameStatus === 'gameOver';

  return (
    <Card className="fixed top-4 left-1/2 -translate-x-1/2 w-auto max-w-[calc(100%-2rem)] bg-card/80 backdrop-blur-sm shadow-xl z-10">
      <CardContent className="p-3 flex items-center justify-center gap-3 sm:gap-6">
        <div className="text-center">
          <p className="text-xs text-muted-foreground font-headline flex items-center gap-1 justify-center"><Star className="h-3 w-3" />SCORE</p>
          <p className="text-xl sm:text-2xl font-bold text-primary">{score}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground font-headline flex items-center gap-1 justify-center"><AlarmClock className="h-3 w-3" />TIME</p>
          <p className={`text-xl sm:text-2xl font-bold ${timeLeft <= 5 && !isGameOver && gameStatus === 'playing' ? 'text-destructive animate-pulse' : ''}`}>
            {formatTime(timeLeft)}
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggleLeaderboard} 
          aria-label="Show Leaderboard"
          className="text-foreground/80 hover:text-foreground"
        >
          <Trophy className="h-6 w-6" />
        </Button>
         <Button 
          variant="ghost" 
          size="icon" 
          onClick={onRestart} 
          aria-label="Restart Game"
          className="text-foreground/80 hover:text-foreground"
          disabled={gameStatus === 'countdown'}
        >
          <RotateCcw className="h-6 w-6" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default HUD;
