
'use client';

import type { Word } from '@/types/game';
import { cn } from '@/lib/utils';

interface WordDisplayProps {
  words: Word[];
  currentWordIndex: number;
}

const WordDisplay: React.FC<WordDisplayProps> = ({ words, currentWordIndex }) => {
  if (!words || words.length === 0) {
    return <p className="text-muted-foreground text-center py-8">Loading words...</p>;
  }

  // Determine the range of words to display (e.g., current line and next line)
  const wordsToShow = 30; // Show about 2-3 lines of words
  const startIndex = Math.max(0, currentWordIndex - wordsToShow / 3); // Try to keep current word somewhat centered
  const endIndex = Math.min(words.length, startIndex + wordsToShow);
  const visibleWords = words.slice(startIndex, endIndex);


  return (
    <div className="text-2xl md:text-3xl font-mono p-4 md:p-6 bg-muted/30 rounded-lg shadow-inner h-40 overflow-hidden select-none relative" style={{ lineHeight: '2.5rem', letterSpacing: '0.05em' }}>
      {visibleWords.map((word, visibleIdx) => {
        const actualWordIndex = startIndex + visibleIdx;
        const isActiveWord = actualWordIndex === currentWordIndex;

        return (
          <span
            key={word.id}
            className={cn(
              'mr-3 inline-block', // Ensure space between words
              // word.status === 'correct' && 'text-green-400', // Apply to chars instead
              // word.status === 'incorrect' && 'text-red-500 underline decoration-red-600 decoration-wavy', // Apply to chars
              !isActiveWord && word.status === 'pending' && 'text-foreground/50',
              isActiveWord && 'text-foreground'
            )}
          >
            {word.text.split('').map((char, charIdx) => {
              let charClass = '';
              if (isActiveWord) {
                if (charIdx < word.typed.length) {
                  // Character has been typed
                  charClass = word.typed[charIdx] === char ? 'text-primary' : 'text-destructive bg-destructive/20 rounded-sm';
                } else {
                  // Character not yet typed in active word
                  charClass = 'text-foreground/70';
                }
              } else if (word.status === 'correct') {
                charClass = 'text-green-400';
              } else if (word.status === 'incorrect') {
                // For already typed incorrect words, make all chars red
                charClass = 'text-red-500';
                if (charIdx < word.typed.length && word.typed[charIdx] !== char) {
                    // Could add underline for specific wrong chars in past words if desired
                }
              } else {
                // Pending words, characters not yet focused
                charClass = 'text-foreground/50';
              }
              
              return (
                <span key={`${word.id}-char-${charIdx}`} className={cn(charClass)}>
                  {char}
                </span>
              );
            })}
            {isActiveWord && (
              <span 
                className="inline-block border-l-2 border-accent h-[1.8rem] animate-ping opacity-100 relative -bottom-1 ml-px"
                style={{ animationDuration: '0.7s' }}
              ></span>
            )}
          </span>
        );
      })}
    </div>
  );
};

export default WordDisplay;

