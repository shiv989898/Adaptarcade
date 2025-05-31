
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, RotateCcw, Trophy, PartyPopper } from 'lucide-react';
import { motion } from 'framer-motion';

interface GameOverScreenProps {
  score: number;
  onPlayAgain: () => void;
  onShowLeaderboard: () => void;
  gameName?: string;
  additionalInfo?: string; 
  children?: React.ReactNode;
  scoreUnit?: string; // New prop e.g., "WPM", "Points", "Clicks"
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ 
  score, 
  onPlayAgain, 
  onShowLeaderboard, 
  gameName = "Game",
  additionalInfo,
  children,
  scoreUnit 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-20 p-4"
    >
      <Card className="w-full max-w-lg shadow-2xl bg-card text-card-foreground border-primary/30">
        <CardHeader className="text-center pb-4">
           <div className="mx-auto flex items-center justify-center h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/20 mb-3 sm:mb-4 animate-pulse">
            <Award className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl sm:text-4xl font-headline text-primary">
            {gameName} Complete!
          </CardTitle>
          <p className="text-4xl sm:text-5xl font-bold text-accent py-1 sm:py-2">
            {score} 
            {scoreUnit && <span className="text-2xl sm:text-3xl text-muted-foreground ml-2">{scoreUnit}</span>}
          </p>
          {additionalInfo && (
             <CardDescription className="text-md sm:text-lg text-muted-foreground pt-1">
              {additionalInfo}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 sm:gap-4 px-4 sm:px-6 pb-4 sm:pb-6">
          {children && <div className="w-full mb-4">{children}</div>}
          <Button 
            onClick={onPlayAgain} 
            size="lg" 
            className="w-full shadow-lg hover:shadow-primary/50 transition-transform hover:scale-105 active:scale-100"
          >
            <RotateCcw className="mr-2 h-5 w-5" /> Play Again
          </Button>
          <Button 
            onClick={onShowLeaderboard} 
            variant="outline" 
            size="lg" 
            className="w-full transition-transform hover:scale-105 active:scale-100"
          >
            <Trophy className="mr-2 h-5 w-5" /> View Leaderboard
          </Button>
        </CardContent>
         <CardFooter className="pt-4 sm:pt-6">
            <p className="text-xs sm:text-sm text-muted-foreground text-center w-full flex items-center justify-center gap-1">
              <PartyPopper className="h-4 w-4 text-accent" />
              {score > 0 ? (scoreUnit === "WPM" ? "Well Typed!" : "Great Job!") : "Keep Practicing!"}
            </p>
         </CardFooter>
      </Card>
    </motion.div>
  );
};

export default GameOverScreen;
