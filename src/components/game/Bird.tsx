
'use client';

import type { BirdState } from '@/types/game';
import { motion } from 'framer-motion';
import { Bird as BirdIcon } from 'lucide-react'; // Using lucide icon

interface BirdProps {
  bird: BirdState;
  gameAreaHeight: number; // To constrain bird's visual position if needed
}

const BirdComponent: React.FC<BirdProps> = ({ bird, gameAreaHeight }) => {
  // Bird is conceptually at a fixed X, but its Y changes.
  // For rendering, we can place it in the first quarter of the game area width.
  const birdXPosition = "25%"; 

  return (
    <motion.div
      className="absolute z-10 text-yellow-400"
      style={{
        width: bird.size,
        height: bird.size,
        left: birdXPosition,
        top: bird.y,
        transform: 'translateX(-50%)', // Center the bird icon on its X position
      }}
      animate={{ y: bird.y, rotate: bird.velocity > 0 ? Math.min(bird.velocity * 3, 45) : Math.max(bird.velocity * 2, -30) }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }} // Smooth out flap/fall
    >
      <BirdIcon fill="currentColor" size={bird.size} />
    </motion.div>
  );
};

export default BirdComponent;
