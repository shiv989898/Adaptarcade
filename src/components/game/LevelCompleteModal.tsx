import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CheckCircle, Zap } from 'lucide-react';

interface LevelCompleteModalProps {
  isOpen: boolean;
  level: number;
  time: number;
}

const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({ isOpen, level, time }) => {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => { /* Managed by game logic */ }}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground text-center p-8 fade-in-scale">
        <DialogHeader>
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-accent/20 mb-4">
            <CheckCircle className="h-12 w-12 text-accent" />
          </div>
          <DialogTitle className="text-3xl font-headline">Level {level} Complete!</DialogTitle>
          <DialogDescription className="text-lg mt-2">
            You finished in <span className="font-bold text-primary">{time}</span> seconds.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6">
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <Zap className="h-5 w-5 text-primary" /> Get ready for the next challenge...
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LevelCompleteModal;
