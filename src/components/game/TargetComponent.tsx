
import type { TargetConfig } from '@/types/game';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TargetComponentProps {
  target: TargetConfig;
  onClick: (id: string, points: number, type: TargetConfig['type']) => void;
}

const TargetComponent: React.FC<TargetComponentProps> = ({ target, onClick }) => {
  const IconComponent = target.icon;

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
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      exit={{ scale: 0, opacity: 0, transition: { duration: 0.15 } }} // Faster exit
      whileTap={{ scale: 0.85, opacity: 0.7, rotate: 5 }}
      transition={{ type: 'spring', stiffness: 450, damping: 18 }} // Slightly stiffer spring
      style={{
        position: 'absolute',
        left: `${target.x}%`,
        top: `${target.y}%`,
        width: `${target.size}px`,
        height: `${target.size}px`,
        backgroundColor: target.color,
        borderRadius: target.type === 'precision' ? '8px' : '50%', // square-ish for precision
        cursor: 'pointer',
        boxShadow: `0px 0px 12px ${target.color}99, 0 0 4px rgba(0,0,0,0.2)`,
      }}
      className={cn(targetBaseClasses, targetTypeClasses[target.type])}
      onClick={() => onClick(target.id, target.points, target.type)}
      aria-label={`Target type ${target.type} worth ${target.points} points`}
    >
      {IconComponent && <IconComponent size={target.size * 0.6} className={cn(
        "pointer-events-none",
        target.type === 'precision' ? 'text-accent-foreground' : 'text-white/90'
        )} />}
    </motion.button>
  );
};

export default TargetComponent;
