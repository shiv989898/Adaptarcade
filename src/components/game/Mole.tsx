
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface MoleProps {
  hasMole: boolean;
  onClick: () => void;
  isHit?: boolean; // For visual feedback when hit
}

const Mole: React.FC<MoleProps> = ({ hasMole, onClick, isHit }) => {
  return (
    <div
      onClick={hasMole ? onClick : undefined}
      className="w-24 h-24 sm:w-28 sm:h-28 bg-yellow-800/40 border-4 border-yellow-900/60 rounded-full flex items-center justify-center cursor-pointer overflow-hidden shadow-inner select-none relative group"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* Hole Shadow */}
      <div className="absolute inset-0 rounded-full shadow-[inset_0_5px_10px_rgba(0,0,0,0.3)]"></div>

      {hasMole && (
        <motion.div
          initial={{ y: '100%', scale: 0.5 }}
          animate={{ y: '10%', scale: 1 }}
          exit={{ y: '100%', scale: 0.5, transition: { duration: 0.15 } }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="w-20 h-20 sm:w-24 sm:h-24 relative z-10"
        >
          {/* Basic Mole SVG - Replace with an Image component for better visuals */}
          <svg viewBox="0 0 100 100" className="fill-current text-amber-700 group-hover:text-amber-600 transition-colors duration-100">
            <circle cx="50" cy="50" r="35" />
            <circle cx="35" cy="40" r="5" fill="black" />
            <circle cx="65" cy="40" r="5" fill="black" />
            <ellipse cx="50" cy="65" rx="10" ry="5" fill="pink" />
             {/* Simple ears */}
            <circle cx="25" cy="25" r="10" />
            <circle cx="75" cy="25" r="10" />
          </svg>
           {isHit && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1}}
              className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-red-500"
            >
              POP!
            </motion.div>
           )}
        </motion.div>
      )}
      {!hasMole && (
        <div className="w-16 h-16 bg-black/20 rounded-full shadow-inner"></div>
      )}
    </div>
  );
};

export default Mole;
