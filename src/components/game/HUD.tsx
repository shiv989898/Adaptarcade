import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, HelpCircle, Trophy, RotateCcw } from 'lucide-react';
import type { GameStatus } from '@/hooks/useGameLogic';

interface HUDProps {
  level: number;
  timer: number;
  onHint: () => void;
  onToggleLeaderboard: () => void;
  onRestart: () => void;
  hintAvailable: boolean;
  gameStatus: GameStatus;
}

const HUD: React.FC<HUDProps> = ({ level, timer, onHint, onToggleLeaderboard, onRestart, hintAvailable, gameStatus }) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="fixed top-4 left-1/2 -translate-x-1/2 w-auto max-w-[calc(100%-2rem)] bg-card/80 backdrop-blur-sm shadow-xl z-10">
      <CardContent className="p-3 flex items-center justify-center gap-3 sm:gap-6">
        <div className="text-center">
          <p className="text-xs text-muted-foreground font-headline">LEVEL</p>
          <p className="text-xl sm:text-2xl font-bold text-primary">{level}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground font-headline">TIME</p>
          <p className="text-xl sm:text-2xl font-bold">{formatTime(timer)}</p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onHint} 
          disabled={!hintAvailable || gameStatus !== 'playing'}
          aria-label="Get Hint"
          className="text-accent hover:text-accent/80 disabled:text-muted-foreground"
        >
          <Lightbulb className="h-6 w-6" />
        </Button>
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
        >
          <RotateCcw className="h-6 w-6" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default HUD;
