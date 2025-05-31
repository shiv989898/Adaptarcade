
'use client';

import type { BirdState, PipeState } from '@/types/game';
import Bird from './Bird';
import PipePair from './PipePair';
import { motion } from 'framer-motion';

interface FlappyBirdGameAreaProps {
  bird: BirdState;
  pipes: PipeState[];
  gameAreaHeight: number;
  gameAreaWidth: number;
}

const FlappyBirdGameArea: React.FC<FlappyBirdGameAreaProps> = ({
  bird,
  pipes,
  gameAreaHeight,
  gameAreaWidth,
}) => {
  return (
    <div
      className="relative bg-sky-300 dark:bg-sky-700 overflow-hidden shadow-lg border-2 border-primary/50 rounded-lg"
      style={{
        width: `${gameAreaWidth}px`,
        height: `${gameAreaHeight}px`,
      }}
      aria-label="Flappy Bird Game Area"
    >
      {/* Background elements (optional) */}
      <div className="absolute inset-0 z-0">
        {/* Simple clouds or pattern */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`cloud-bg-${i}`}
            className="absolute bg-white/30 dark:bg-white/10 rounded-full opacity-50"
            style={{
              width: `${100 + Math.random() * 100}px`,
              height: `${40 + Math.random() * 40}px`,
              top: `${Math.random() * 60}%`, // Position clouds within top 60%
              left: `${Math.random() * 100}%`,
            }}
            animate={{ x: [0, -gameAreaWidth * 1.5] }} // Slow scroll
            transition={{ duration: 20 + Math.random() * 10, repeat: Infinity, ease: "linear" }}
          />
        ))}
      </div>
      
      <Bird bird={bird} gameAreaHeight={gameAreaHeight} />
      {pipes.map(pipe => (
        <PipePair key={pipe.id} pipe={pipe} gameAreaHeight={gameAreaHeight} />
      ))}
       {/* Ground */}
       <div 
        className="absolute bottom-0 left-0 w-full h-12 bg-green-600 dark:bg-green-800 border-t-4 border-green-700 dark:border-green-900 z-10"
        // Could add a repeating pattern for ground texture
      ></div>
    </div>
  );
};

export default FlappyBirdGameArea;
