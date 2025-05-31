
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
  birdXPositionPercent: number;
  groundHeight: number;
}

const FlappyBirdGameArea: React.FC<FlappyBirdGameAreaProps> = ({
  bird,
  pipes,
  gameAreaHeight,
  gameAreaWidth,
  birdXPositionPercent,
  groundHeight,
}) => {
  return (
    <div
      className="relative bg-sky-400 dark:bg-sky-600 overflow-hidden shadow-2xl border-4 border-primary/30 rounded-lg"
      style={{
        width: `${gameAreaWidth}px`,
        height: `${gameAreaHeight}px`,
      }}
      aria-label="Flappy Bird Game Area"
    >
      {/* Background elements: Simple Clouds */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`cloud-bg-${i}`}
            className="absolute bg-white/50 dark:bg-white/20 rounded-full"
            style={{
              width: `${120 + Math.random() * 150}px`,
              height: `${50 + Math.random() * 50}px`,
              top: `${10 + Math.random() * 40}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{ x: `-${gameAreaWidth * 1.8}px` }} // Slow scroll to the left
            transition={{ 
              duration: 30 + Math.random() * 20, 
              repeat: Infinity, 
              ease: "linear",
              delay: i * 5 // Stagger cloud start
            }}
          />
        ))}
      </div>
      
      <Bird bird={bird} gameAreaWidth={gameAreaWidth} birdXPositionPercent={birdXPositionPercent} />
      
      {pipes.map(pipe => (
        <PipePair key={pipe.id} pipe={pipe} gameAreaHeight={gameAreaHeight} />
      ))}

      {/* Ground */}
      <div 
        className="absolute bottom-0 left-0 w-full bg-yellow-600 dark:bg-yellow-800 border-t-4 border-yellow-700 dark:border-yellow-900 z-10"
        style={{ height: `${groundHeight}px` }}
      >
        {/* Optional: Ground texture (e.g., repeating diagonal lines) */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="groundPattern" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(45)">
                <line x1="0" y1="10" x2="20" y2="10" stroke="black" strokeWidth="5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#groundPattern)" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default FlappyBirdGameArea;
