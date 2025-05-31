import type { Cell } from '@/types/maze';
import { cn } from '@/lib/utils';
import { Home, Flag, User, Zap, ShieldAlert } from 'lucide-react'; // Zap for obstacle, ShieldAlert for a different type

interface CellComponentProps {
  cellData: Cell;
  cellSize: number;
}

const CellComponent: React.FC<CellComponentProps> = ({ cellData, cellSize }) => {
  const { r, c, walls, isStart, isEnd, isPlayer, isHint, obstacleType } = cellData;

  const cellClasses = cn(
    'flex items-center justify-center transition-colors duration-300 ease-in-out',
    walls.top && 'border-t-2',
    walls.right && 'border-r-2',
    walls.bottom && 'border-b-2',
    walls.left && 'border-l-2',
    isStart && 'bg-green-500/30',
    isEnd && 'bg-blue-500/30 animate-pulse-accent',
    isPlayer && 'bg-primary/70',
    isHint && 'bg-accent/50',
    obstacleType && 'bg-destructive/30',
    'border-foreground/20' // Default border color
  );
  
  const iconSize = cellSize * 0.6;

  return (
    <div
      style={{ width: cellSize, height: cellSize }}
      className={cellClasses}
      aria-label={`Cell ${r}-${c}`}
    >
      {isPlayer && <User size={iconSize} className="text-primary-foreground" />}
      {isStart && !isPlayer && <Home size={iconSize} className="text-green-300" />}
      {isEnd && !isPlayer && <Flag size={iconSize} className="text-blue-300" />}
      {obstacleType === 'rock' && <ShieldAlert size={iconSize} className="text-destructive-foreground opacity-70" />}
      {obstacleType && obstacleType !== 'rock' && <Zap size={iconSize} className="text-destructive-foreground opacity-70" />}
    </div>
  );
};

export default CellComponent;
