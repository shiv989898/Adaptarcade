export interface Cell {
  r: number;
  c: number;
  walls: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
  visited: boolean;
  isStart?: boolean;
  isEnd?: boolean;
  isPlayer?: boolean;
  isPath?: boolean; // For showing solved path or hint
  obstacleType?: string; // e.g., 'blocker', 'slow'
  isHint?: boolean;
}

export type MazeData = Cell[][];

export interface PlayerPosition {
  r: number;
  c: number;
}

export interface ScoreEntry {
  id: string;
  playerName: string;
  level: number;
  time: number; // in seconds
  date: string;
}

export interface Obstacle {
  position: PlayerPosition;
  type: string; // e.g. 'rock', 'portal' - from LLM
  description?: string; // from LLM
}
