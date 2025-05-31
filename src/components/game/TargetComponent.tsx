
import type { TargetConfig } from '@/types/game';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TargetComponentProps {
  target: TargetConfig;
  onClick: (id: string) // Send only id, hook will calculate points
}

const TargetComponent: React.FC<TargetComponentProps> = ({ target, onClick }) => {
  const IconComponent = target.icon;

  // Use target.currentSize for rendering
  const displaySize = target.currentSize;

  const targetBaseClasses = "transform transition-transform focus:outline-none flex items-center justify-center";
  const targetTypeClasses = {
    standard: "focus:ring-2 focus:ring-offset-2 focus:ring-primary border-2 border-white/60",
    precision: "focus:ring-2 focus:ring-offset-2 focus:ring-accent border-2 border-white/80 shadow-lg",
    decoy: "focus:ring-2 focus:ring-offset-2 focus:ring-destructive border-2 border-white/50 opacity-90 hover:opacity-100",
  };

  return (
    <motion.button
      layoutId={target.id}
      initial={{ scale: 0, opacity: 0, rotate: Math.random() * 40 - 20 }}
      animate={{ 
        scale: 1, 
        opacity: 1, 
        rotate: 0,
        width: `${displaySize}px`, // Animate size change
        height: `${displaySize}px`,
      }}
      exit={{ scale: 0, opacity: 0, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.85, opacity: 0.7, rotate: 5 }}
      transition={{ type: 'spring', stiffness: 450, damping: 18 }}
      style={{
        position: 'absolute',
        left: `${target.x}%`,
        top: `${target.y}%`,
        // width and height are now handled by animate prop
        backgroundColor: target.color,
        borderRadius: target.type === 'precision' ? '8px' : '50%',
        cursor: 'pointer',
        boxShadow: `0px 0px ${displaySize / 5}px ${target.color}99, 0 0 4px rgba(0,0,0,0.2)`, // Dynamic shadow
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
