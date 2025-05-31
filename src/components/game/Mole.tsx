
'use client';

import { motion } from 'framer-motion';
import Image from 'next/image'; // Keep for potential future image use

interface MoleProps {
  hasMole: boolean;
  onClick: () => void;
  isHit?: boolean; // For visual feedback when hit
}

const Mole: React.FC<MoleProps> = ({ hasMole, onClick, isHit }) => {
  return (
    <div
      onClick={hasMole ? onClick : undefined}
      className="w-20 h-20 sm:w-24 sm:h-24 bg-yellow-800/40 border-4 border-yellow-900/60 rounded-full flex items-center justify-center cursor-pointer overflow-hidden shadow-inner select-none relative group"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* Hole Shadow */}
      <div className="absolute inset-0 rounded-full shadow-[inset_0_5px_10px_rgba(0,0,0,0.3)]"></div>

      {hasMole && (
        <motion.div
          initial={{ y: '100%', scale: 0.5 }}
          animate={{ y: '5%', scale: 1 }} // Mole pops up a bit more
          exit={{ y: '100%', scale: 0.5, transition: { duration: 0.15 } }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="w-16 h-16 sm:w-20 sm:h-20 relative z-10 group-hover:scale-105 transition-transform duration-100"
        >
          {/* Enhanced Mole SVG */}
          <svg viewBox="0 0 100 100" className="fill-current text-stone-600 drop-shadow-sm">
            {/* Body */}
            <ellipse cx="50" cy="60" rx="30" ry="35" />
            {/* Ears */}
            <circle cx="30" cy="35" r="12" className="fill-current text-stone-500" />
            <circle cx="70" cy="35" r="12" className="fill-current text-stone-500" />
            <circle cx="30" cy="35" r="8" className="fill-current text-pink-300" />
            <circle cx="70" cy="35" r="8" className="fill-current text-pink-300" />
            {/* Eyes */}
            <circle cx="40" cy="50" r="5" fill="black" />
            <circle cx="60" cy="50" r="5" fill="black" />
            {/* Nose */}
            <ellipse cx="50" cy="65" rx="8" ry="6" fill="pink" />
             {/* Whiskers (simple lines) */}
            <line x1="25" y1="60" x2="40" y2="62" stroke="black" strokeWidth="1.5" />
            <line x1="25" y1="65" x2="40" y2="65" stroke="black" strokeWidth="1.5" />
            <line x1="25" y1="70" x2="40" y2="68" stroke="black" strokeWidth="1.5" />
            <line x1="75" y1="60" x2="60" y2="62" stroke="black" strokeWidth="1.5" />
            <line x1="75" y1="65" x2="60" y2="65" stroke="black" strokeWidth="1.5" />
            <line x1="75" y1="70" x2="60" y2="68" stroke="black" strokeWidth="1.5" />
          </svg>
           {isHit && ( // Simple star burst for hit
            <motion.div
              initial={{ opacity: 1, scale: 0.5 }}
              animate={{ opacity: 0, scale: 1.5, transition: { duration: 0.3 } }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <StarBurst />
            </motion.div>
           )}
        </motion.div>
      )}
      {!hasMole && (
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-black/30 rounded-full shadow-[inset_0_3px_6px_rgba(0,0,0,0.4)]"></div>
      )}
    </div>
  );
};

// Simple star burst component for hit effect
const StarBurst = () => (
  <svg width="80%" height="80%" viewBox="0 0 100 100" className="text-yellow-400 opacity-80">
    <polygon points="50,5 61,35 95,35 67,55 78,85 50,65 22,85 33,55 5,35 39,35" fill="currentColor"/>
  </svg>
);

export default Mole;
