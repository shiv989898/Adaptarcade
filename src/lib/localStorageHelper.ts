import type { ScoreEntry } from '@/types/maze';

const LEADERBOARD_KEY = 'adaptiMazeLeaderboard';
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
  scores.sort((a, b) => {
    if (a.level !== b.level) {
      return b.level - a.level; // Higher level first
    }
    return a.time - b.time; // Lower time first for same level
  });
  
  const updatedScores = scores.slice(0, MAX_LEADERBOARD_ENTRIES);
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updatedScores));
};
