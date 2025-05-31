
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StartScreenProps {
  onStartGame: () => void;
  title?: string;
  description?: string;
  instructions?: { title: string; steps: string[] };
  icon?: LucideIcon;
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
  icon: IconComponent = Zap, // Default to Zap icon
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center min-h-full p-4 w-full max-w-md"
    >
      <Card className="w-full shadow-2xl bg-card/90 backdrop-blur-sm border-primary/30">
        <CardHeader className="text-center pb-4">
          <div className="inline-flex items-center justify-center mb-4 text-primary animate-pulse">
            <IconComponent className="h-16 w-16 sm:h-20 sm:w-20" strokeWidth={1.5} />
          </div>
          <CardTitle className="text-4xl sm:text-5xl font-headline text-primary">{title}</CardTitle>
          <CardDescription className="text-md sm:text-lg text-muted-foreground pt-2 max-w-xs mx-auto">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 px-4 sm:px-6 pb-6">
          <Button 
            onClick={onStartGame} 
            size="lg" 
            className="w-full text-lg sm:text-xl py-6 sm:py-8 shadow-lg hover:shadow-primary/50 transition-all duration-300 hover:scale-105 active:scale-100"
          >
            <Play className="mr-3 h-6 w-6 sm:h-7 sm:w-7" /> Start Game
          </Button>
          <div className="text-xs sm:text-sm text-center text-muted-foreground bg-muted/50 p-3 rounded-md w-full">
            <p className="font-bold text-foreground/90 mb-1">{instructions.title}</p>
            {instructions.steps.map((step, index) => (
              <p key={index}>{step}</p>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StartScreen;
