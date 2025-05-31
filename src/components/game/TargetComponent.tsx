
import type { TargetConfig } from '@/types/game';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TargetComponentProps {
  target: TargetConfig;
  onClick: (id: string) => void;
}

const TargetComponent: React.FC<TargetComponentProps> = ({ target, onClick }) => {
  const IconComponent = target.icon;

  const displaySize = target.currentSize;

  const targetBaseClasses = "transform focus:outline-none flex items-center justify-center";
  const targetTypeClasses = {
    standard: "focus:ring-2 focus:ring-offset-2 focus:ring-primary border-2 border-white/60",
    precision: "focus:ring-2 focus:ring-offset-2 focus:ring-accent border-2 border-white/80 shadow-lg",
    decoy: "focus:ring-2 focus:ring-offset-2 focus:ring-destructive border-2 border-white/50 opacity-90 hover:opacity-100",
  };

  return (
    <motion.button
      layoutId={target.id} // Important for AnimatePresence
      initial={{ scale: 0, opacity: 0, rotate: Math.random() * 30 - 15 }}
      animate={{ 
        scale: 1, 
        opacity: 1, 
        rotate: 0,
        width: `${displaySize}px`, 
        height: `${displaySize}px`,
      }}
      exit={{ scale: 0, opacity: 0, transition: { duration: 0.15, ease: "easeOut" } }}
      whileTap={{ scale: 0.85, opacity: 0.7, rotate: 3 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }} // Slightly softer spring
      style={{
        position: 'absolute',
        left: `calc(${target.x}% - ${displaySize / 2}px)`,
        top: `calc(${target.y}% - ${displaySize / 2}px)`,
        backgroundColor: target.color,
        borderRadius: target.type === 'precision' ? '8px' : '50%',
        cursor: 'pointer',
        boxShadow: `0px 0px ${displaySize / 5}px ${target.color}99, 0 0 4px rgba(0,0,0,0.2)`,
      }}
      className={cn(targetBaseClasses, targetTypeClasses[target.type])}
      onClick={() => onClick(target.id)}
      aria-label={`Target type ${target.type} worth up to ${target.points} points`}
    >
      {IconComponent && <IconComponent size={displaySize * 0.6} className={cn(
        "pointer-events-none",
        target.type === 'precision' ? 'text-accent-foreground' : 'text-white/90'
        )} />}
    </motion.button>
  );
};

export default TargetComponent;

    