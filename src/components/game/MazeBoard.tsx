import type { MazeData, PlayerPosition } from '@/types/maze';
import CellComponent from './CellComponent';

interface MazeBoardProps {
  maze: MazeData;
  playerPosition: PlayerPosition;
  cellSize?: number;
}

const MazeBoard: React.FC<MazeBoardProps> = ({ maze, playerPosition, cellSize = 32 }) => {
  if (!maze || maze.length === 0) {
    return <div className="text-center p-4">Loading maze...</div>;
  }

  // Create a deep copy of the maze to modify for player position
  const displayMaze = maze.map(row => 
    row.map(cell => ({ ...cell, isPlayer: false }))
  );
  
  if (displayMaze[playerPosition.r] && displayMaze[playerPosition.r][playerPosition.c]) {
    displayMaze[playerPosition.r][playerPosition.c].isPlayer = true;
  }

  return (
    <div 
      className="grid border-2 border-primary shadow-2xl rounded-lg overflow-hidden bg-background/50"
      style={{
        gridTemplateColumns: `repeat(${maze[0].length}, ${cellSize}px)`,
        width: maze[0].length * cellSize + 4, // +4 for borders
        height: maze.length * cellSize + 4,
      }}
    >
      {displayMaze.flat().map((cell) => (
        <CellComponent key={`cell-${cell.r}-${cell.c}`} cellData={cell} cellSize={cellSize} />
      ))}
    </div>
  );
};

export default MazeBoard;
