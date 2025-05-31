
import type { ScoreEntry } from '@/types/game'; // Standard ScoreEntry for TargetTap

const TARGET_TAP_LEADERBOARD_KEY = 'targetTapLeaderboard';
const MAX_LEADERBOARD_ENTRIES = 10;

// Specific for Target Tap
export const getLeaderboard = (): ScoreEntry[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(TARGET_TAP_LEADERBOARD_KEY);
  return data ? JSON.parse(data) : [];
};

export const addScoreToLeaderboard = (newScore: Omit<ScoreEntry, 'id' | 'date'>): void => {
  if (typeof window === 'undefined') return;
  const scores = getLeaderboard(); // Gets Target Tap scores
  const entry: ScoreEntry = {
    ...newScore,
    id: Date.now().toString() + Math.random().toString(36).substring(2,9),
    date: new Date().toISOString(),
  };
  
  scores.push(entry);
  scores.sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score; 
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  const updatedScores = scores.slice(0, MAX_LEADERBOARD_ENTRIES);
  localStorage.setItem(TARGET_TAP_LEADERBOARD_KEY, JSON.stringify(updatedScores));
};


// Note: For Quick Click Challenge, its leaderboard logic is currently self-contained
// in useQuickClickLogic.ts using its own localStorage key.
// You could generalize this helper more if many games share the exact same ScoreEntry structure
// by passing the leaderboard key as an argument to generic functions.
// e.g. getScoresByKey(key: string), addScoreByKey(key: string, newScore: ...)
