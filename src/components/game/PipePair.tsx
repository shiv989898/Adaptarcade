
'use client';

import type { PipeState } from '@/types/game';
import { motion } from 'framer-motion';

interface PipePairProps {
  pipe: PipeState;
  gameAreaHeight: number;
}

const PipePairComponent: React.FC<PipePairProps> = ({ pipe, gameAreaHeight }) => {
  const bottomPipeTop = pipe.topHeight + pipe.gap;
  const bottomPipeHeight = gameAreaHeight - bottomPipeTop;

  return (
    <>
      {/* Top Pipe */}
      <motion.div
        className="absolute bg-green-500 dark:bg-green-700 border-2 border-green-700 dark:border-green-900 rounded-sm"
        style={{
          left: pipe.x,
          top: 0,
          width: pipe.width,
          height: pipe.topHeight,
        }}
        initial={{ x: pipe.x + 50, opacity: 0 }} // Enter from a bit right
        animate={{ x: pipe.x, opacity: 1 }}
        exit={{ x: pipe.x - 50, opacity: 0 }} // Exit towards left
        transition={{ type: "tween", ease: "linear", duration: 0.1 }} // Match pipe movement
      >
         {/* Pipe Cap */}
        <div className="absolute bottom-0 left-[-4px] w-[calc(100%+8px)] h-6 bg-green-600 dark:bg-green-800 border-x-2 border-b-2 border-green-700 dark:border-green-900 rounded-sm"></div>
      </motion.div>

      {/* Bottom Pipe */}
      <motion.div
        className="absolute bg-green-500 dark:bg-green-700 border-2 border-green-700 dark:border-green-900 rounded-sm"
        style={{
          left: pipe.x,
          top: bottomPipeTop,
          width: pipe.width,
          height: bottomPipeHeight,
        }}
        initial={{ x: pipe.x + 50, opacity: 0 }}
        animate={{ x: pipe.x, opacity: 1 }}
        exit={{ x: pipe.x - 50, opacity: 0 }}
        transition={{ type: "tween", ease: "linear", duration: 0.1 }}
      >
        {/* Pipe Cap */}
        <div className="absolute top-0 left-[-4px] w-[calc(100%+8px)] h-6 bg-green-600 dark:bg-green-800 border-x-2 border-t-2 border-green-700 dark:border-green-900 rounded-sm"></div>
      </motion.div>
    </>
  );
};

export default PipePairComponent;
