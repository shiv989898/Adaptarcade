import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Gamepad2 } from 'lucide-react';

interface StartScreenProps {
  onStartGame: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStartGame }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-full p-4 fade-in-scale">
      <Card className="w-full max-w-md shadow-2xl bg-card/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <Gamepad2 className="h-16 w-16 text-primary animate-pulse" />
          </div>
          <CardTitle className="text-5xl font-headline text-primary">AdaptiMaze</CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-2">
            Navigate the ever-changing labyrinth. Each level brings new challenges!
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <Button onClick={onStartGame} size="lg" className="w-full text-xl py-8 shadow-lg hover:shadow-primary/50 transition-shadow duration-300">
            <Play className="mr-3 h-7 w-7" /> Start Game
          </Button>
          <div className="text-sm text-center text-muted-foreground">
            <p className="font-bold">Controls:</p>
            <p>Arrow Keys or WASD to move.</p>
            <p>'H' for a hint.</p>
            <p>On mobile, use on-screen controls.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StartScreen;
