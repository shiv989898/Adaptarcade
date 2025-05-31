
import type { TargetConfig } from '@/types/game';
import { motion } from 'framer-motion';
import { HandMetal, Zap, Star } from 'lucide-react'; // Added Zap and Star for variety

interface TargetComponentProps {
  target: TargetConfig;
  onClick: (id: string, points: number) => void;
}

const TargetComponent: React.FC<TargetComponentProps> = ({ target, onClick }) => {
  // Choose icon based on points for more visual distinction
  const IconComponent = target.points > 15 ? Star : (target.points > 8 ? Zap : HandMetal);

  return (
    <motion.button
      layoutId={target.id}
      initial={{ scale: 0, opacity: 0, rotate: Math.random() * 60 - 30 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.85, opacity: 0.7, rotate: 10 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      style={{
        position: 'absolute',
        left: `${target.x}%`,
        top: `${target.y}%`,
        width: `${target.size}px`,
        height: `${target.size}px`,
        backgroundColor: target.color,
        borderRadius: target.points > 15 ? '10px' : '50%', // Star-like targets could be more angular
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid rgba(255,255,255,0.6)',
        boxShadow: `0px 0px 15px ${target.color}aa, 0 0 5px rgba(0,0,0,0.3)`,
      }}
      className="transform transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
      onClick={() => onClick(target.id, target.points)}
      aria-label={`Target worth ${target.points} points`}
    >
      <IconComponent size={target.size * 0.55} className="text-white/90" />
       {/* Optional: Display points directly on target if desired, can be cluttered
       <span className="absolute text-xs font-bold text-white" style={{ WebkitTextStroke: '0.5px black'}}>
        {target.points}
      </span> */}
    </motion.button>
  );
};

export default TargetComponent;
