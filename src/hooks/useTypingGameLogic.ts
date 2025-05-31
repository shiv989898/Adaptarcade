
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Word, TypingGameStatus, TypingStats, ScoreEntry, WpmEntry } from '@/types/game';
import { useToast } from '@/hooks/use-toast'; // Kept for potential future use, but not actively toasting
import { getTypingTestLeaderboard, addTypingTestScore } from '@/lib/localStorageHelper';

const DEFAULT_TYPING_GAME_DURATION = 60; // seconds
const TYPING_GAME_COUNTDOWN_SECONDS = 3;
const PLAYER_NAME = 'SpeedTyper';

const COMMON_WORDS = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "I", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
  "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
  "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time", "no", "just", "him", "know", "take",
  "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", "than", "then", "now", "look", "only", "come", "its", "over", "think",
  "also", "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", "even", "new", "want", "because", "any", "these", "give", "day",
  "most", "us", "system", "program", "computer", "code", "develop", "project", "firebase", "studio", "react", "nextjs", "game", "arcade", "challenge",
  "keyboard", "mouse", "click", "target", "speed", "accuracy", "leaderboard", "player", "score", "level", "purple", "green", "gray", "font", "modern",
  "minimalist", "layout", "smooth", "transition", "animation", "feedback", "generate", "control", "timer", "difficulty", "render", "procedural", "obstacle", "hint"
];

const WORDS_PER_MINUTE_BASE = 50; // Estimate average words someone might type in a minute for generation

const generateWords = (durationInSeconds: number): Word[] => {
  const estimatedWordsNeeded = Math.ceil((durationInSeconds / 60) * WORDS_PER_MINUTE_BASE * 1.5); // Generate 50% more words than estimated
  const count = Math.max(20, estimatedWordsNeeded); // Ensure at least 20 words
  const selectedWords: Word[] = [];
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * COMMON_WORDS.length);
    selectedWords.push({
      id: `word-${i}-${Date.now()}-${Math.random()}`,
      text: COMMON_WORDS[randomIndex],
      typed: '',
      status: 'pending',
    });
  }
  return selectedWords;
};


export const useTypingGameLogic = (initialDuration: number = DEFAULT_TYPING_GAME_DURATION) => {
  const [gameStatus, setGameStatus] = useState<TypingGameStatus>('idle');
  const [words, setWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [selectedDuration, setSelectedDuration] = useState(initialDuration);
  const [countdownValue, setCountdownValue] = useState(TYPING_GAME_COUNTDOWN_SECONDS);
  
  const [stats, setStats] = useState<TypingStats>({
    wpm: 0,
    accuracy: 0,
    correctChars: 0,
    incorrectChars: 0,
    totalCharsTyped: 0,
    totalWordsAttempted: 0,
    correctWords: 0,
    wpmHistory: [],
  });
  const [leaderboardScores, setLeaderboardScores] = useState<ScoreEntry[]>([]);

  // const { toast } = useToast(); // Available if needed for subtle feedback
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gameStartTimeRef = useRef<number>(0);

  const loadLeaderboard = useCallback(() => {
    setLeaderboardScores(getTypingTestLeaderboard());
  }, []);

  useEffect(() => { loadLeaderboard(); }, [loadLeaderboard]);

  const resetGameState = useCallback((duration: number) => {
    const newWords = generateWords(duration);
    if (newWords.length > 0) {
      newWords[0].status = 'active';
    }
    setWords(newWords);
    setCurrentWordIndex(0);
    setStats({
      wpm: 0,
      accuracy: 0,
      correctChars: 0,
      incorrectChars: 0,
      totalCharsTyped: 0,
      totalWordsAttempted: 0,
      correctWords: 0,
      wpmHistory: [],
    });
    setTimeLeft(duration);
    setSelectedDuration(duration);
    setCountdownValue(TYPING_GAME_COUNTDOWN_SECONDS);
  }, []);

  const clearTimers = useCallback(() => {
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
  }, []);

  const startGame = useCallback((duration: number) => {
    clearTimers();
    resetGameState(duration);
    setGameStatus('countdown');

    let currentCountdown = TYPING_GAME_COUNTDOWN_SECONDS;
    countdownTimerRef.current = setInterval(() => {
      currentCountdown--;
      setCountdownValue(currentCountdown);
      if (currentCountdown === 0) {
        clearInterval(countdownTimerRef.current!);
        setGameStatus('playing');
        gameStartTimeRef.current = Date.now();
        setStats(prev => ({ ...prev, wpmHistory: [] })); // Clear history at start

        gameTimerRef.current = setInterval(() => {
          setTimeLeft(prevTime => {
            const newTime = prevTime - 1;
            const timeElapsedSeconds = duration - newTime;
            
            setStats(prevStats => {
              const minutes = timeElapsedSeconds / 60;
              const currentWpm = minutes > 0 ? Math.round((prevStats.correctChars / 5) / minutes) : 0;
              const newWpmHistory = [...prevStats.wpmHistory, { time: timeElapsedSeconds, wpm: currentWpm }];
              return { ...prevStats, wpm: currentWpm, wpmHistory: newWpmHistory };
            });

            if (newTime <= 0) {
              clearInterval(gameTimerRef.current!);
              setGameStatus('gameOver');
              return 0;
            }
            return newTime;
          });
        }, 1000);
      }
    }, 1000);
  }, [clearTimers, resetGameState]);

  useEffect(() => {
    if (gameStatus === 'gameOver') {
      clearTimers();
      const timeElapsedMinutes = selectedDuration / 60; // Use selectedDuration for final calc
      
      setStats(prev => {
        const finalWPM = timeElapsedMinutes > 0 ? Math.round((prev.correctChars / 5) / timeElapsedMinutes) : 0;
        const finalAccuracy = prev.totalCharsTyped > 0 ? Math.round((prev.correctChars / prev.totalCharsTyped) * 100) : 0;
        const finalStats = { ...prev, wpm: finalWPM, accuracy: finalAccuracy };
        
        addTypingTestScore({ 
            playerName: PLAYER_NAME, 
            score: finalWPM, 
            accuracy: finalAccuracy, 
            duration: selectedDuration 
        });
        loadLeaderboard();
        return finalStats;
      });
    }
  }, [gameStatus, selectedDuration, loadLeaderboard, clearTimers]);

  const handleUserKeyPress = useCallback((key: string) => {
    if (gameStatus !== 'playing' || currentWordIndex >= words.length) return;

    setWords(prevWords => {
      const newWords = [...prevWords];
      const activeWord = { ...newWords[currentWordIndex] };
      let newCurrentWordIndex = currentWordIndex;

      let tempCorrectChars = stats.correctChars;
      let tempIncorrectChars = stats.incorrectChars;
      let tempTotalCharsTyped = stats.totalCharsTyped;
      let tempCorrectWords = stats.correctWords;
      let tempTotalWordsAttempted = stats.totalWordsAttempted;

      if (key === ' ') {
        if (activeWord.typed.length === 0) return prevWords;

        activeWord.status = activeWord.typed === activeWord.text ? 'correct' : 'incorrect';
        activeWord.isCorrect = activeWord.typed === activeWord.text;
        if (activeWord.isCorrect) tempCorrectWords++;
        tempTotalWordsAttempted++;
        
        newWords[currentWordIndex] = activeWord;
        if (currentWordIndex + 1 < newWords.length) {
          newCurrentWordIndex++;
          newWords[newCurrentWordIndex] = { ...newWords[newCurrentWordIndex], status: 'active', typed: '' };
        } else {
          setGameStatus('gameOver'); // Or generate more words
        }
      } else if (key === 'Backspace') {
        if (activeWord.typed.length > 0) {
          const charRemoved = activeWord.typed.slice(-1);
          const originalCharIndex = activeWord.typed.length - 1;
          
          if (originalCharIndex < activeWord.text.length) {
            if (charRemoved === activeWord.text[originalCharIndex]) {
              tempCorrectChars = Math.max(0, tempCorrectChars -1);
            } else {
              tempIncorrectChars = Math.max(0, tempIncorrectChars -1);
            }
          } else { // Backspacing an extra character
            tempIncorrectChars = Math.max(0, tempIncorrectChars-1);
          }
          tempTotalCharsTyped = Math.max(0, tempTotalCharsTyped -1); // Decrement total typed on effective backspace
          activeWord.typed = activeWord.typed.slice(0, -1);
          newWords[currentWordIndex] = activeWord;
        }
      } else if (key.length === 1) { // Regular character typed
        activeWord.typed += key;
        tempTotalCharsTyped++;
        const typedCharIndex = activeWord.typed.length - 1;
        if (typedCharIndex < activeWord.text.length) {
          if (key === activeWord.text[typedCharIndex]) {
            tempCorrectChars++;
          } else {
            tempIncorrectChars++;
          }
        } else { // User typed more characters than the word length (extra char)
          tempIncorrectChars++;
        }
        newWords[currentWordIndex] = activeWord;
      }
      
      // Update stats outside the setWords updater if possible, or ensure this is handled carefully
      // For simplicity, direct update here, but can lead to stale closures if not careful with dependencies.
      // It's better to update stats in a separate effect or based on the newWords state.
      // However, for immediate feedback on WPM/accuracy, we need to update stats here.
      const timeElapsedSeconds = selectedDuration - timeLeft;
      const minutes = timeElapsedSeconds > 0 ? timeElapsedSeconds / 60 : (1/60); // Avoid division by zero if game starts instantly
      const currentWpm = minutes > 0 ? Math.round((tempCorrectChars / 5) / minutes) : 0;
      const currentAccuracy = tempTotalCharsTyped > 0 ? Math.round((tempCorrectChars / tempTotalCharsTyped) * 100) : 0;

      setStats(prev => ({
          ...prev,
          correctChars: tempCorrectChars,
          incorrectChars: tempIncorrectChars,
          totalCharsTyped: tempTotalCharsTyped,
          correctWords: tempCorrectWords,
          totalWordsAttempted: tempTotalWordsAttempted,
          wpm: currentWpm,
          accuracy: currentAccuracy,
      }));
      
      setCurrentWordIndex(newCurrentWordIndex);
      return newWords;
    });

  }, [gameStatus, currentWordIndex, words, stats, selectedDuration, timeLeft]);


  const restartGame = useCallback(() => {
    clearTimers();
    resetGameState(selectedDuration); // Restart with the last selected duration
    setGameStatus('idle');
  }, [clearTimers, resetGameState, selectedDuration]);

  useEffect(() => { 
    resetGameState(initialDuration);
  }, [resetGameState, initialDuration]);
  
  return {
    gameStatus,
    words,
    currentWordIndex,
    timeLeft,
    selectedDuration,
    setSelectedDuration, // To be called by UI
    countdownValue,
    stats,
    leaderboardScores,
    startGame,
    restartGame,
    handleUserKeyPress,
    loadLeaderboard,
  };
};

