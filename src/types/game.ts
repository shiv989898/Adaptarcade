
import type { LucideIcon } from 'lucide-react';

export type TargetType = 'standard' | 'precision' | 'decoy';

export type DecoyFrequencyMode = 'zen' | 'challenging' | 'expert';

export interface TargetConfig {
  id: string;
  x: number; // percentage
  y: number; // percentage
  initialSize: number; // pixels, starting size
  maxSize: number; // pixels, maximum size it can grow to
  currentSize: number; // pixels, current animated size
  points: number; // Base points if hit instantly (Can be negative for decoys)
  color: string;
  type: TargetType;
  icon?: LucideIcon;
  spawnTime: number; // Timestamp of when it was spawned
  despawnTime: number; // Duration it stays on screen before auto-removing
}

export interface ScoreEntry {
  id:string;
  playerName: string;
  score: number;
  date: string;
  mode?: DecoyFrequencyMode; // Optional: to track mode on leaderboard
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

// Difficulty level type for Mole Mash (Target Tap no longer uses this)
export type Difficulty = 'easy' | 'medium' | 'hard';
