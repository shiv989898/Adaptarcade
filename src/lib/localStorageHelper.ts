
import type { ScoreEntry, DecoyFrequencyMode } from '@/types/game';

const TARGET_TAP_LEADERBOARD_KEY = 'precisionTapLeaderboard'; // Updated key name
const MAX_LEADERBOARD_ENTRIES = 10;

export const getLeaderboard = (): ScoreEntry[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(TARGET_TAP_LEADERBOARD_KEY);
  return data ? JSON.parse(data) : [];
};

// Omit 'id' and 'date' as they are generated, mode is now required
export const addScoreToLeaderboard = (newScore: { playerName: string; score: number; mode: DecoyFrequencyMode }): void => {
  if (typeof window === 'undefined') return;
  const scores = getLeaderboard();
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
    // If scores are equal, sort by date (newest first)
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  const updatedScores = scores.slice(0, MAX_LEADERBOARD_ENTRIES);
  localStorage.setItem(TARGET_TAP_LEADERBOARD_KEY, JSON.stringify(updatedScores));
};


// Note: For Quick Click Challenge and Mole Mash, their leaderboard logic remains
// self-contained in their respective hooks using their own localStorage keys.
