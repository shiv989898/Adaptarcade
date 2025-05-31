
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Word, TypingGameStatus, TypingStats, ScoreEntry } from '@/types/game';
import { useToast } from '@/hooks/use-toast';
import { getTypingTestLeaderboard, addTypingTestScore } from '@/lib/localStorageHelper';

const TYPING_GAME_DURATION = 60; // seconds
const TYPING_GAME_COUNTDOWN_SECONDS = 3;
const PLAYER_NAME = 'SpeedTyper';

// A simple list of words for now.
const COMMON_WORDS = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "I", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
  "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
  "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time", "no", "just", "him", "know", "take",
  "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", "than", "then", "now", "look", "only", "come", "its", "over", "think",
  "also", "back", "after", "use", "two", "how", "our", "work", "first", "well", "way", "even", "new", "want", "because", "any", "these", "give", "day",
  "most", "us"
];

const WORDS_PER_SESSION = 40; // Number of words to display in one game session

const generateWords = (count: number): Word[] => {
  const selectedWords: Word[] = [];
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * COMMON_WORDS.length);
    selectedWords.push({
      id: `word-${i}-${Date.now()}`,
      text: COMMON_WORDS[randomIndex],
      typed: '',
      status: 'pending',
    });
  }
  return selectedWords;
};


export const useTypingGameLogic = () => {
  const [gameStatus, setGameStatus] = useState<TypingGameStatus>('idle');
  const [words, setWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInput, setUserInput] = useState(''); // Stores the full input for the current line/word block for display
  
  const [timeLeft, setTimeLeft] = useState(TYPING_GAME_DURATION);
  const [countdownValue, setCountdownValue] = useState(TYPING_GAME_COUNTDOWN_SECONDS);
  
  const [stats, setStats] = useState<TypingStats>({
    wpm: 0,
    accuracy: 0,
    correctChars: 0,
    incorrectChars: 0,
    totalCharsTyped: 0,
    totalWordsAttempted: 0,
    correctWords: 0,
  });
  const [leaderboardScores, setLeaderboardScores] = useState<ScoreEntry[]>([]);

  const { toast } = useToast();
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const loadLeaderboard = useCallback(() => {
    setLeaderboardScores(getTypingTestLeaderboard());
  }, []);

  useEffect(() => { loadLeaderboard(); }, [loadLeaderboard]);

  const resetGameState = useCallback(() => {
    const newWords = generateWords(WORDS_PER_SESSION);
    if (newWords.length > 0) {
      newWords[0].status = 'active';
    }
    setWords(newWords);
    setCurrentWordIndex(0);
    setUserInput('');
    setStats({
      wpm: 0,
      accuracy: 0,
      correctChars: 0,
      incorrectChars: 0,
      totalCharsTyped: 0,
      totalWordsAttempted: 0,
      correctWords: 0,
    });
    setTimeLeft(TYPING_GAME_DURATION);
    setCountdownValue(TYPING_GAME_COUNTDOWN_SECONDS);
  }, []);

  const clearTimers = useCallback(() => {
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
  }, []);

  const startGame = useCallback(() => {
    clearTimers();
    resetGameState();
    setGameStatus('countdown');

    let currentCountdown = TYPING_GAME_COUNTDOWN_SECONDS;
    countdownTimerRef.current = setInterval(() => {
      currentCountdown--;
      setCountdownValue(currentCountdown);
      if (currentCountdown === 0) {
        clearInterval(countdownTimerRef.current!);
        setGameStatus('playing');
        startTimeRef.current = Date.now();

        gameTimerRef.current = setInterval(() => {
          setTimeLeft(prevTime => {
            const newTime = prevTime - 1;
            const timeElapsedSeconds = TYPING_GAME_DURATION - newTime;
            
            // Update WPM dynamically
            setStats(prevStats => {
              const minutes = timeElapsedSeconds / 60;
              const wpm = minutes > 0 ? Math.round((prevStats.correctChars / 5) / minutes) : 0;
              return { ...prevStats, wpm };
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
      const timeElapsedMinutes = (TYPING_GAME_DURATION - timeLeft) / 60;
      
      const finalWPM = timeElapsedMinutes > 0 ? Math.round((stats.correctChars / 5) / timeElapsedMinutes) : 0;
      const finalAccuracy = stats.totalCharsTyped > 0 ? Math.round((stats.correctChars / stats.totalCharsTyped) * 100) : 0;
      
      setStats(prev => ({ ...prev, wpm: finalWPM, accuracy: finalAccuracy }));
      addTypingTestScore({ playerName: PLAYER_NAME, score: finalWPM, accuracy: finalAccuracy });
      loadLeaderboard();
    }
  }, [gameStatus, stats.correctChars, stats.totalCharsTyped, timeLeft, loadLeaderboard, clearTimers]);

  const handleUserKeyPress = useCallback((key: string) => {
    if (gameStatus !== 'playing' || currentWordIndex >= words.length) return;

    let currentTypedForWord = words[currentWordIndex].typed;
    let newCorrectChars = stats.correctChars;
    let newIncorrectChars = stats.incorrectChars;
    let newTotalCharsTyped = stats.totalCharsTyped + 1;
    let newCorrectWords = stats.correctWords;
    let newTotalWordsAttempted = stats.totalWordsAttempted;

    if (key === ' ') { // Spacebar pressed
      if (currentTypedForWord.length === 0) return; // Ignore space if nothing typed for current word

      const currentWordObject = words[currentWordIndex];
      const isWordCorrect = currentTypedForWord === currentWordObject.text;
      
      setWords(prevWords => prevWords.map((word, index) => 
        index === currentWordIndex ? { ...word, status: isWordCorrect ? 'correct' : 'incorrect', isCorrect: isWordCorrect } : word
      ));

      if (isWordCorrect) newCorrectWords++;
      newTotalWordsAttempted++;
      
      setUserInput(prev => prev + (currentTypedForWord + ' ')); // Add typed word and space to full input for display

      if (currentWordIndex + 1 < words.length) {
        setCurrentWordIndex(prevIndex => prevIndex + 1);
        setWords(prevWords => prevWords.map((word, index) => 
          index === currentWordIndex + 1 ? { ...word, status: 'active', typed: '' } : word
        ));
      } else {
        // All words typed, end game or handle accordingly
        setGameStatus('gameOver');
      }
    } else if (key === 'Backspace') {
      if (currentTypedForWord.length > 0) {
        const charRemoved = currentTypedForWord.slice(-1);
        const originalChar = words[currentWordIndex].text[currentTypedForWord.length - 1];
        
        // Only decrement correct/incorrect if it was part of the actual word comparison
        if (originalChar !== undefined) { 
          if (charRemoved === originalChar) {
            // It was a correct char, but only if it was not an extra char
            if (currentTypedForWord.length <= words[currentWordIndex].text.length) {
              newCorrectChars = Math.max(0, newCorrectChars - 1);
            }
          } else {
            // It was an incorrect char
            if (currentTypedForWord.length <= words[currentWordIndex].text.length) {
             newIncorrectChars = Math.max(0, newIncorrectChars - 1);
            }
          }
        }
        // totalCharsTyped is not decremented on backspace for typical accuracy calculations

        currentTypedForWord = currentTypedForWord.slice(0, -1);
        setWords(prevWords => prevWords.map((w, i) => i === currentWordIndex ? { ...w, typed: currentTypedForWord } : w));
      }
    } else if (key.length === 1) { // Regular character typed
      currentTypedForWord += key;
      setWords(prevWords => prevWords.map((w, i) => i === currentWordIndex ? { ...w, typed: currentTypedForWord } : w));

      const currentWordText = words[currentWordIndex].text;
      const typedCharIndex = currentTypedForWord.length - 1;

      if (typedCharIndex < currentWordText.length) {
        if (key === currentWordText[typedCharIndex]) {
          newCorrectChars++;
        } else {
          newIncorrectChars++;
        }
      } else { // User typed more characters than the word length
        newIncorrectChars++; // Extra characters are incorrect
      }
    }

    setStats(prevStats => ({
      ...prevStats,
      correctChars: newCorrectChars,
      incorrectChars: newIncorrectChars,
      totalCharsTyped: newTotalCharsTyped,
      correctWords: newCorrectWords,
      totalWordsAttempted: newTotalWordsAttempted,
    }));

  }, [gameStatus, currentWordIndex, words, stats]);


  const restartGame = useCallback(() => {
    clearTimers();
    resetGameState();
    setGameStatus('idle');
  }, [clearTimers, resetGameState]);

  useEffect(() => { // Initialize words on mount
    resetGameState();
  }, [resetGameState]);
  
  useEffect(() => { // Update active word status
    if (words.length > 0 && currentWordIndex < words.length && words[currentWordIndex].status !== 'active') {
        setWords(prevWords => prevWords.map((word, index) => {
            if (index === currentWordIndex) return {...word, status: 'active', typed: ''};
            if (word.status === 'active' && index < currentWordIndex) { // Mark previous active word based on typing
                return {...word, status: word.isCorrect ? 'correct' : (word.typed.length > 0 ? 'incorrect' : 'pending')};
            }
            return word;
        }));
    }
  }, [currentWordIndex, words]);


  return {
    gameStatus,
    words,
    currentWordIndex,
    userInput, // The full string of what user has typed (words + spaces)
    timeLeft,
    countdownValue,
    stats,
    leaderboardScores,
    startGame,
    restartGame,
    handleUserKeyPress,
    loadLeaderboard,
  };
};
