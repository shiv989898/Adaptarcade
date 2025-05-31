
import type { ScoreEntry, DecoyFrequencyMode, Difficulty } from '@/types/game';

const TARGET_TAP_LEADERBOARD_KEY = 'precisionTapLeaderboard';
const MOLE_MASH_LEADERBOARD_KEY = 'moleMashLeaderboard';
const QUICK_CLICK_LEADERBOARD_KEY = 'quickClickLeaderboard';
const TYPING_TEST_LEADERBOARD_KEY = 'typingTestLeaderboard';

const MAX_LEADERBOARD_ENTRIES = 10;

// Generic function to get leaderboard for any game
const getGameLeaderboard = (key: string): ScoreEntry[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

// Generic function to add score to any game's leaderboard
const addScoreToGameLeaderboard = (key: string, newEntry: ScoreEntry): void => {
  if (typeof window === 'undefined') return;
  const scores = getGameLeaderboard(key);
  
  scores.push(newEntry);
  scores.sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score; // Higher score is better
    }
    // If scores are equal, sort by date (newest first)
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  const updatedScores = scores.slice(0, MAX_LEADERBOARD_ENTRIES);
  localStorage.setItem(key, JSON.stringify(updatedScores));
};


// --- Target Tap Specific ---
export const getTargetTapLeaderboard = (): ScoreEntry[] => getGameLeaderboard(TARGET_TAP_LEADERBOARD_KEY);

export const addTargetTapScore = (scoreData: { playerName: string; score: number; mode: DecoyFrequencyMode }): void => {
  const entry: ScoreEntry = {
    ...scoreData,
    id: Date.now().toString() + Math.random().toString(36).substring(2,9),
    date: new Date().toISOString(),
  };
  addScoreToGameLeaderboard(TARGET_TAP_LEADERBOARD_KEY, entry);
};

// --- Mole Mash Specific ---
export const getMoleMashLeaderboard = (): ScoreEntry[] => getGameLeaderboard(MOLE_MASH_LEADERBOARD_KEY);

export const addMoleMashScore = (scoreData: { playerName: string; score: number; difficulty: Difficulty }): void => {
  const entry: ScoreEntry = {
    ...scoreData,
    id: Date.now().toString() + Math.random().toString(36).substring(2,9),
    date: new Date().toISOString(),
  };
  addScoreToGameLeaderboard(MOLE_MASH_LEADERBOARD_KEY, entry);
};

// --- Quick Click Specific ---
export const getQuickClickLeaderboard = (): ScoreEntry[] => getGameLeaderboard(QUICK_CLICK_LEADERBOARD_KEY);

export const addQuickClickScore = (scoreData: { playerName: string; score: number }): void => {
   const entry: ScoreEntry = {
    ...scoreData,
    id: Date.now().toString() + Math.random().toString(36).substring(2,9),
    date: new Date().toISOString(),
  };
  addScoreToGameLeaderboard(QUICK_CLICK_LEADERBOARD_KEY, entry);
};

// --- Typing Test Specific ---
export const getTypingTestLeaderboard = (): ScoreEntry[] => getGameLeaderboard(TYPING_TEST_LEADERBOARD_KEY);

export const addTypingTestScore = (scoreData: { playerName: string; score: number; accuracy: number }): void => {
  const entry: ScoreEntry = { // score here is WPM
    ...scoreData,
    id: Date.now().toString() + Math.random().toString(36).substring(2,9),
    date: new Date().toISOString(),
  };
  addScoreToGameLeaderboard(TYPING_TEST_LEADERBOARD_KEY, entry);
};
