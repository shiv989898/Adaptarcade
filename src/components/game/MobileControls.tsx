import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface MobileControlsProps {
  onMove: (direction: 'up' | 'down' | 'left' | 'right') => void;
  disabled?: boolean;
}

const MobileControls: React.FC<MobileControlsProps> = ({ onMove, disabled }) => {
  return (
    <div className="fixed bottom-8 right-8 md:hidden grid grid-cols-3 gap-2 p-2 bg-card/80 backdrop-blur-sm rounded-lg shadow-xl">
      <div></div>
      <Button variant="outline" size="icon" onClick={() => onMove('up')} className="aspect-square h-16 w-16" disabled={disabled}>
        <ArrowUp className="h-8 w-8" />
      </Button>
      <div></div>
      <Button variant="outline" size="icon" onClick={() => onMove('left')} className="aspect-square h-16 w-16" disabled={disabled}>
        <ArrowLeft className="h-8 w-8" />
      </Button>
      <div className="h-16 w-16"></div> {/* Center placeholder */}
      <Button variant="outline" size="icon" onClick={() => onMove('right')} className="aspect-square h-16 w-16" disabled={disabled}>
        <ArrowRight className="h-8 w-8" />
      </Button>
      <div></div>
      <Button variant="outline" size="icon" onClick={() => onMove('down')} className="aspect-square h-16 w-16" disabled={disabled}>
        <ArrowDown className="h-8 w-8" />
      </Button>
      <div></div>
    </div>
  );
};

export default MobileControls;
