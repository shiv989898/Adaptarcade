
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StartScreenProps {
  onStartGame: () => void;
  title?: string;
  description?: string;
  instructions?: { title: string; steps: React.ReactNode[] };
  icon?: LucideIcon;
  difficultySelector?: React.ReactNode;
}

const StartScreen: React.FC<StartScreenProps> = ({
  onStartGame,
  title = "Game Title",
  description = "Game description here.",
  instructions = {
    title: "How to Play:",
    steps: [
      "Follow the on-screen prompts.",
      "Try to get the highest score!"
    ]
  },
  icon: IconComponent = Zap,
  difficultySelector,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 300, damping: 20, mass: 0.8 }}
      className="flex flex-col items-center justify-center min-h-full p-4 w-full max-w-md"
    >
      <Card className="w-full shadow-2xl bg-card/90 backdrop-blur-sm border-primary/30">
        <CardHeader className="text-center pb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 10 }}
            className="inline-flex items-center justify-center mb-4 text-primary"
          >
            <IconComponent className="h-16 w-16 sm:h-20 sm:w-20" strokeWidth={1.5} />
          </motion.div>
          <CardTitle className="text-4xl sm:text-5xl font-headline text-primary">{title}</CardTitle>
          <CardDescription className="text-md sm:text-lg text-muted-foreground pt-2 max-w-xs mx-auto">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 px-4 sm:px-6 pb-6">
          {difficultySelector && (
            <div className="w-full space-y-3 py-3 border-y border-border/50">
              <p className="text-sm font-medium text-center text-muted-foreground">Select Difficulty:</p>
              {difficultySelector}
            </div>
          )}
          <Button
            onClick={onStartGame}
            size="lg"
            className="w-full text-lg sm:text-xl py-6 sm:py-8 shadow-lg hover:shadow-primary/50 transition-all duration-300" // Removed hover:scale and active:scale from here as it's now in base button
          >
            <Play className="mr-3 h-6 w-6 sm:h-7 sm:w-7" /> Start Game
          </Button>
          <div className="text-xs sm:text-sm text-left text-muted-foreground bg-muted/50 p-4 rounded-md w-full space-y-1">
            <p className="font-bold text-foreground/90 mb-2 text-center">{instructions.title}</p>
            <ul className="list-disc list-inside space-y-1.5 pl-1 sm:pl-2">
              {instructions.steps.map((step, index) => (
                <li key={index} className="leading-snug">{step}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StartScreen;
