
'use client';
import type { TargetConfig } from '@/types/game';
import TargetComponent from './TargetComponent';
import { AnimatePresence } from 'framer-motion';

interface ReactionGameBoardProps {
  targets: TargetConfig[];
  onTargetClick: (id: string, points: number) => void;
  gameAreaHeight?: string; 
}

const ReactionGameBoard: React.FC<ReactionGameBoardProps> = ({
  targets,
  onTargetClick,
  gameAreaHeight = 'min(70vh, 450px)', // Slightly larger default height
}) => {
  return (
    <div
      className="relative w-full max-w-2xl bg-card/70 dark:bg-slate-800/50 backdrop-blur-md border-2 border-primary/70 shadow-2xl rounded-xl overflow-hidden aspect-[4/3] sm:aspect-video"
      style={{ height: gameAreaHeight }}
      aria-label="Game Board"
    >
      {/* Optional: Subtle background pattern */}
      <div className="absolute inset-0 opacity-5 dark:opacity-[0.03]">
        {/* Example: diagonal lines pattern */}
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="diagonalLines" patternUnits="userSpaceOnUse" width="10" height="10">
              <path d="M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2" stroke="hsl(var(--foreground))" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diagonalLines)" />
        </svg>
      </div>

      <AnimatePresence>
        {targets.map((target) => (
          <TargetComponent
            key={target.id}
            target={target}
            onClick={onTargetClick}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ReactionGameBoard;
