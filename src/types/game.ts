
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
  icon?: LucideIcon; 
}

// For Mole Mash game
export interface MoleHole {
  id: number;
  hasMole: boolean;
}

// Difficulty level type
export type Difficulty = 'easy' | 'medium' | 'hard';

// For Flappy Bird game
export interface BirdState {
  y: number; // Vertical position
  velocity: number;
  size: number; // Bird's visual size
}

export interface PipeState {
  id: string;
  x: number; // Horizontal position
  topHeight: number; // Height of the top pipe
  gap: number; // Gap between top and bottom pipe
  width: number;
}

export type FlappyBirdGameStatus = 'idle' | 'countdown' | 'playing' | 'gameOver';

export const FLAPPY_BIRD_LEADERBOARD_KEY = 'flappyBirdLeaderboard';
