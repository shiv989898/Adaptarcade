
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
  score: number; // Generic score, used as WPM for typing, points for others
  date: string;
  // Game-specific data
  mode?: DecoyFrequencyMode; // For TargetTap
  accuracy?: number; // For Typing Game
  difficulty?: Difficulty; // For MoleMash
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

export type Difficulty = 'easy' | 'medium' | 'hard';

// For Typing Game
export interface Word {
  id: string; // Unique ID for each word instance
  text: string; // The word itself
  typed: string; // What the user has typed for this word so far
  status: 'pending' | 'active' | 'correct' | 'incorrect';
  isCorrect?: boolean; // Final state after user moves to next word
}

export type TypingGameStatus = 'idle' | 'countdown' | 'playing' | 'gameOver';

export interface TypingStats {
  wpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  totalCharsTyped: number; // All characters typed including corrections
  totalWordsAttempted: number;
  correctWords: number;
}
