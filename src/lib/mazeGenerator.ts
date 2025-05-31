import type { MazeData, Cell, PlayerPosition } from '@/types/maze';

export const generateMaze = (rows: number, cols: number): MazeData => {
  const maze: MazeData = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      r,
      c,
      walls: { top: true, right: true, bottom: true, left: true },
      visited: false,
    }))
  );

  const stack: Cell[] = [];
  const startCell = maze[0][0];
  startCell.isStart = true;
  startCell.visited = true;
  stack.push(startCell);

  while (stack.length > 0) {
    const current = stack.pop()!;
    const { r, c } = current;

    const neighbors: { cell: Cell; wallToRemove: keyof Cell['walls']; oppositeWall: keyof Cell['walls']; dr: number; dc: number }[] = [];

    // Top
    if (r > 0 && !maze[r - 1][c].visited) {
      neighbors.push({ cell: maze[r - 1][c], wallToRemove: 'top', oppositeWall: 'bottom', dr: -1, dc: 0 });
    }
    // Right
    if (c < cols - 1 && !maze[r][c + 1].visited) {
      neighbors.push({ cell: maze[r][c + 1], wallToRemove: 'right', oppositeWall: 'left', dr: 0, dc: 1 });
    }
    // Bottom
    if (r < rows - 1 && !maze[r + 1][c].visited) {
      neighbors.push({ cell: maze[r + 1][c], wallToRemove: 'bottom', oppositeWall: 'top', dr: 1, dc: 0 });
    }
    // Left
    if (c > 0 && !maze[r][c - 1].visited) {
      neighbors.push({ cell: maze[r][c - 1], wallToRemove: 'left', oppositeWall: 'right', dr: 0, dc: -1 });
    }

    if (neighbors.length > 0) {
      stack.push(current);
      const { cell: nextCell, wallToRemove, oppositeWall } = neighbors[Math.floor(Math.random() * neighbors.length)];
      
      current.walls[wallToRemove] = false;
      nextCell.walls[oppositeWall] = false;
      nextCell.visited = true;
      stack.push(nextCell);
    }
  }
  
  maze[rows - 1][cols - 1].isEnd = true;

  // Ensure all cells are marked as not visited initially for pathfinding or other logic if needed
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      maze[r][c].visited = false; 
    }
  }

  return maze;
};

export const getStartPosition = (): PlayerPosition => ({ r: 0, c: 0 });

export const checkWinCondition = (playerPosition: PlayerPosition, maze: MazeData): boolean => {
  return maze[playerPosition.r][playerPosition.c].isEnd || false;
};

export const canMove = (
  maze: MazeData,
  currentPos: PlayerPosition,
  direction: 'up' | 'down' | 'left' | 'right'
): boolean => {
  const { r, c } = currentPos;
  const cell = maze[r][c];

  if (!cell) return false;

  switch (direction) {
    case 'up':
      return r > 0 && !cell.walls.top && !maze[r-1][c].obstacleType;
    case 'down':
      return r < maze.length - 1 && !cell.walls.bottom && !maze[r+1][c].obstacleType;
    case 'left':
      return c > 0 && !cell.walls.left && !maze[r][c-1].obstacleType;
    case 'right':
      return c < maze[0].length - 1 && !cell.walls.right && !maze[r][c+1].obstacleType;
    default:
      return false;
  }
};
