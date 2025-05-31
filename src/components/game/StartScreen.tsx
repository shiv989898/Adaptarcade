
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Zap } from 'lucide-react';

interface StartScreenProps {
  onStartGame: () => void;
  title?: string;
  description?: string;
  instructions?: { title: string; steps: string[] };
}

const StartScreen: React.FC<StartScreenProps> = ({ 
  onStartGame, 
  title = "Target Tap", 
  description = "Test your reflexes! Tap the targets as fast as you can.",
  instructions = {
    title: "How to Play:",
    steps: [
      "Click or tap the colored circles that appear.",
      "Score as many points as possible before time runs out!"
    ]
  }
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-full p-4 fade-in-scale">
      <Card className="w-full max-w-md shadow-2xl bg-card/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <Zap className="h-16 w-16 text-primary animate-pulse" />
          </div>
          <CardTitle className="text-5xl font-headline text-primary">{title}</CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-2">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <Button onClick={onStartGame} size="lg" className="w-full text-xl py-8 shadow-lg hover:shadow-primary/50 transition-shadow duration-300">
            <Play className="mr-3 h-7 w-7" /> Start Game
          </Button>
          <div className="text-sm text-center text-muted-foreground">
            <p className="font-bold">{instructions.title}</p>
            {instructions.steps.map((step, index) => (
              <p key={index}>{step}</p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StartScreen;
