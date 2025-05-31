
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, RotateCcw, Trophy } from 'lucide-react';

interface GameOverScreenProps {
  score: number;
  onPlayAgain: () => void;
  onShowLeaderboard: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ score, onPlayAgain, onShowLeaderboard }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-20 p-4 fade-in-scale">
      <Card className="w-full max-w-md shadow-2xl bg-card text-card-foreground">
        <CardHeader className="text-center">
           <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-primary/20 mb-4">
            <Award className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-4xl font-headline text-primary">Game Over!</CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-2">
            You scored an impressive
          </CardDescription>
           <p className="text-5xl font-bold text-accent py-2">{score} points!</p>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Button onClick={onPlayAgain} size="lg" className="w-full shadow-lg hover:shadow-primary/50">
            <RotateCcw className="mr-2 h-5 w-5" /> Play Again
          </Button>
          <Button onClick={onShowLeaderboard} variant="outline" size="lg" className="w-full">
            <Trophy className="mr-2 h-5 w-5" /> View Leaderboard
          </Button>
        </CardContent>
         <CardFooter className="pt-6">
            <p className="text-xs text-muted-foreground text-center w-full">Well done, quick fingers!</p>
         </CardFooter>
      </Card>
    </div>
  );
};

export default GameOverScreen;
