
'use client';

import type { BirdState } from '@/types/game';
import { motion } from 'framer-motion';
import { Bird as BirdIcon } from 'lucide-react';

interface BirdProps {
  bird: BirdState;
  gameAreaWidth: number;
  birdXPositionPercent: number;
}

const BirdComponent: React.FC<BirdProps> = ({ bird, gameAreaWidth, birdXPositionPercent }) => {
  const birdX = gameAreaWidth * (birdXPositionPercent / 100);

  return (
    <motion.div
      className="absolute z-20" // Ensure bird is above pipes
      style={{
        width: bird.size,
        height: bird.size,
        left: birdX - bird.size / 2, // Center the bird icon on its X position
        top: bird.y,
        // transformOrigin: 'center center', // For rotation
      }}
      animate={{ 
        y: bird.y, 
        rotate: bird.rotation // Apply rotation from bird state
      }}
      transition={{ type: 'spring', stiffness: 700, damping: 30, mass: 0.5 }} // Smooth out y movement
    >
      <BirdIcon 
        className="text-yellow-400 fill-yellow-400" 
        size={bird.size} 
        strokeWidth={1.5}
      />
    </motion.div>
  );
};

export default BirdComponent;
