
import type { ScoreEntry } from '@/types/game';

const LEADERBOARD_KEY = 'targetTapLeaderboard'; // Updated key for the new game
const MAX_LEADERBOARD_ENTRIES = 10;

export const getLeaderboard = (): ScoreEntry[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(LEADERBOARD_KEY);
  return data ? JSON.parse(data) : [];
};

export const addScoreToLeaderboard = (newScore: Omit<ScoreEntry, 'id' | 'date'>): void => {
  if (typeof window === 'undefined') return;
  const scores = getLeaderboard();
  const entry: ScoreEntry = {
    ...newScore,
    id: Date.now().toString() + Math.random().toString(36).substring(2,9),
    date: new Date().toISOString(),
  };
  
  scores.push(entry);
  // Sort by score (descending), then by date (most recent for ties, though less likely with unique IDs)
  scores.sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score; 
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  const updatedScores = scores.slice(0, MAX_LEADERBOARD_ENTRIES);
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updatedScores));
};
