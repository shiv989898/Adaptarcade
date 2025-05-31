
'use client';

import type { PipeState } from '@/types/game';
import { motion } from 'framer-motion';

interface PipePairProps {
  pipe: PipeState;
  gameAreaHeight: number;
}

const PIPE_CAP_HEIGHT = 25; // Visual height of the pipe cap

const PipePairComponent: React.FC<PipePairProps> = ({ pipe, gameAreaHeight }) => {
  const bottomPipeTopY = pipe.topHeight + pipe.gap;
  const bottomPipeActualHeight = gameAreaHeight - bottomPipeTopY;

  return (
    <>
      {/* Top Pipe */}
      <motion.div
        className="absolute z-10" // Ensure pipes are behind bird if bird is z-20
        style={{
          left: pipe.x,
          top: 0,
          width: pipe.width,
          height: pipe.topHeight,
        }}
        initial={{ x: pipe.x + pipe.width, opacity: 1 }} // Enter from right
        animate={{ x: pipe.x, opacity: 1 }}
        exit={{ x: pipe.x - pipe.width, opacity: 0 }} // Exit towards left
        transition={{ type: "tween", ease: "linear", duration: 0.05 }} // Fast, linear for smooth scroll
      >
        <div className="w-full h-full bg-green-500 border-2 border-green-700 rounded-sm overflow-hidden relative">
           {/* Pipe Body Texture (optional subtle lines) */}
          <div className="absolute inset-0 opacity-20">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-2 bg-black/30 my-2 rounded-full"></div>
            ))}
          </div>
          {/* Pipe Cap */}
          <div 
            className="absolute bottom-0 left-[-4px] w-[calc(100%+8px)] bg-green-600 border-x-2 border-b-2 border-green-800 rounded-t-md"
            style={{ height: `${PIPE_CAP_HEIGHT}px` }}
          />
        </div>
      </motion.div>

      {/* Bottom Pipe */}
      <motion.div
        className="absolute z-10"
        style={{
          left: pipe.x,
          top: bottomPipeTopY,
          width: pipe.width,
          height: bottomPipeActualHeight,
        }}
        initial={{ x: pipe.x + pipe.width, opacity: 1 }}
        animate={{ x: pipe.x, opacity: 1 }}
        exit={{ x: pipe.x - pipe.width, opacity: 0 }}
        transition={{ type: "tween", ease: "linear", duration: 0.05 }}
      >
        <div className="w-full h-full bg-green-500 border-2 border-green-700 rounded-sm overflow-hidden relative">
           {/* Pipe Body Texture (optional subtle lines) */}
           <div className="absolute inset-0 opacity-20">
            {[...Array(Math.floor(bottomPipeActualHeight/20))].map((_, i) => (
              <div key={i} className="h-2 bg-black/30 my-2 rounded-full"></div>
            ))}
          </div>
          {/* Pipe Cap */}
          <div 
            className="absolute top-0 left-[-4px] w-[calc(100%+8px)] bg-green-600 border-x-2 border-t-2 border-green-800 rounded-b-md"
            style={{ height: `${PIPE_CAP_HEIGHT}px` }}
          />
        </div>
      </motion.div>
    </>
  );
};

export default PipePairComponent;
