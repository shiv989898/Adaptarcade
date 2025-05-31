
import type { LucideIcon } from 'lucide-react';

export interface TargetConfig {
  id: string;
  x: number; // percentage
  y: number; // percentage
  size: number; // pixels
  points: number;
  color: string;
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
  icon?: LucideIcon; // Or string for image path
  // thumbnailUrl?: string; // Removed
  // dataAiHint?: string; // Removed
}

// For Mole Mash game
export interface MoleHole {
  id: number;
  hasMole: boolean;
}

// Difficulty level type
export type Difficulty = 'easy' | 'medium' | 'hard';
