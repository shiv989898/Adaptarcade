
import type { TargetConfig } from '@/types/game';
import { motion } from 'framer-motion'; // For simple animation
import { HandMetal } from 'lucide-react';

interface TargetComponentProps {
  target: TargetConfig;
  onClick: (id: string, points: number) => void;
}

const TargetComponent: React.FC<TargetComponentProps> = ({ target, onClick }) => {
  return (
    <motion.button
      layoutId={target.id} // For potential animated removal/addition
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      style={{
        position: 'absolute',
        left: `${target.x}%`,
        top: `${target.y}%`,
        width: `${target.size}px`,
        height: `${target.size}px`,
        backgroundColor: target.color, // Use dynamic color
        borderRadius: '50%', // Keep it circular
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid rgba(255,255,255,0.7)',
        boxShadow: '0px 0px 15px rgba(0,0,0,0.3)',
      }}
      className="transform transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
      onClick={() => onClick(target.id, target.points)}
      aria-label={`Target worth ${target.points} points`}
    >
      <HandMetal size={target.size * 0.5} className="text-white/80" />
    </motion.button>
  );
};

export default TargetComponent;
