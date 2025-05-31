
'use client';
import type { TargetConfig } from '@/types/game';
import TargetComponent from './TargetComponent';
import { AnimatePresence } from 'framer-motion';

interface ReactionGameBoardProps {
  targets: TargetConfig[];
  onTargetClick: (id: string, points: number) => void;
  gameAreaHeight?: string; // e.g., "400px" or "80vh"
}

const ReactionGameBoard: React.FC<ReactionGameBoardProps> = ({
  targets,
  onTargetClick,
  gameAreaHeight = 'min(60vh, 400px)', // Default responsive height
}) => {
  return (
    <div
      className="relative w-full max-w-2xl bg-card/50 backdrop-blur-sm border-2 border-primary shadow-2xl rounded-lg overflow-hidden aspect-video"
      style={{ height: gameAreaHeight }}
      aria-label="Game Board"
    >
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
