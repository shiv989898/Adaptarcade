
import type { TargetConfig } from '@/types/game';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TargetComponentProps {
  target: TargetConfig;
  onClick: (id: string) => void;
}

const TargetComponent: React.FC<TargetComponentProps> = ({ target, onClick }) => {
  const IconComponent = target.icon;

  // Calculate scale: only standard targets grow.
  const currentScale = target.type === 'standard' ? target.currentSize / target.initialSize : 1;
  
  // Shadow blur radius should be dynamic with the visual size
  const shadowBlurRadius = target.currentSize / 5;

  const targetBaseClasses = "transform focus:outline-none flex items-center justify-center";
  const targetTypeClasses = {
    standard: "focus:ring-2 focus:ring-offset-2 focus:ring-primary border-2 border-white/60",
    precision: "focus:ring-2 focus:ring-offset-2 focus:ring-accent border-2 border-white/80 shadow-lg",
    decoy: "focus:ring-2 focus:ring-offset-2 focus:ring-destructive border-2 border-white/50 opacity-90 hover:opacity-100",
  };

  return (
    <motion.button
      layoutId={target.id} 
      initial={{ scale: 0, opacity: 0, rotate: Math.random() * 10 - 5 }} // Slightly reduced initial rotation
      animate={{ 
        scale: currentScale, // Animate scale
        opacity: 1, 
        rotate: 0,
      }}
      exit={{ scale: 0, opacity: 0, transition: { duration: 0.15, ease: "easeOut" } }}
      whileTap={{ scale: currentScale * 0.85, opacity: 0.7, rotate: 3 }} // Tap scale relative to currentScale
      transition={{ type: 'spring', stiffness: 500, damping: 30 }} // Adjusted damping
      style={{
        position: 'absolute',
        // Positioning is based on the center of the INITIAL size
        left: `calc(${target.x}% - ${target.initialSize / 2}px)`,
        top: `calc(${target.y}% - ${target.initialSize / 2}px)`,
        // Base dimensions are the INITIAL size
        width: `${target.initialSize}px`,
        height: `${target.initialSize}px`,
        backgroundColor: target.color,
        borderRadius: target.type === 'precision' ? '8px' : '50%',
        cursor: 'pointer',
        // Shadow based on CURRENT visual size for a dynamic effect
        boxShadow: `0px 0px ${shadowBlurRadius}px ${target.color}99, 0 0 4px rgba(0,0,0,0.2)`,
        transformOrigin: 'center center', // Ensure scaling from the center
      }}
      className={cn(targetBaseClasses, targetTypeClasses[target.type])}
      onClick={() => onClick(target.id)}
      aria-label={`Target type ${target.type} worth up to ${target.points} points`}
    >
      {IconComponent && <IconComponent 
        // Icon size should be relative to initialSize, as the parent's scale transform will resize it.
        size={target.initialSize * 0.6} 
        className={cn(
        "pointer-events-none",
        target.type === 'precision' ? 'text-accent-foreground' : 'text-white/90'
        )} />}
    </motion.button>
  );
};

export default TargetComponent;
