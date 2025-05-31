
export interface TargetConfig {
  id: string;
  x: number; // percentage
  y: number; // percentage
  size: number; // pixels
  points: number;
  color: string; // Added for visual variety
}

export interface ScoreEntry {
  id: string;
  playerName: string;
  score: number;
  date: string;
}

// This type can be expanded for game settings if needed
export interface GameSettings {
  duration: number; // seconds
  targetInterval: number; // ms, how often new targets might appear or change
}
