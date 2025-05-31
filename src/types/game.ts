
import type { LucideIcon } from 'lucide-react';

export type TargetType = 'standard' | 'precision' | 'decoy';

export interface TargetConfig {
  id: string;
  x: number; // percentage
  y: number; // percentage
  size: number; // pixels
  points: number; // Can be negative
  color: string;
  type: TargetType;
  icon?: LucideIcon; // For visual differentiation
  despawnTime?: number; // Optional: specific despawn time for this target
}

export interface ScoreEntry {
  id:string;
  playerName: string;
  score: number;
  date: string;
  difficulty?: Difficulty; // Optional: to track difficulty on leaderboard
}

export interface GameSettings {
  duration: number; // seconds
  targetInterval: number; // ms, how often new targets might appear or change
}

export interface GameMeta {
  id: string;
  name: string;
  description: string;
  route: string;
  icon?: LucideIcon;
}

// For Mole Mash game
export interface MoleHole {
  id: number;
  hasMole: boolean;
}

// Difficulty level type
export type Difficulty = 'easy' | 'medium' | 'hard';

// Removed Flappy Bird specific types as the game was removed.
