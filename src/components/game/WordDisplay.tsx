
'use client';

import type { Word } from '@/types/game';
import { cn } from '@/lib/utils';

interface WordDisplayProps {
  words: Word[];
  currentWordIndex: number;
}

const WordDisplay: React.FC<WordDisplayProps> = ({ words, currentWordIndex }) => {
  if (!words || words.length === 0) {
    return <p className="text-muted-foreground">Loading words...</p>;
  }

  return (
    <div className="text-2xl md:text-3xl font-mono p-4 md:p-6 bg-muted/30 rounded-lg shadow-inner leading-relaxed tracking-wider h-48 overflow-y-auto select-none relative" style={{ lineHeight: '2.2rem' }}>
      {words.map((word, wordIdx) => (
        <span
          key={word.id}
          className={cn(
            'mr-3 transition-colors duration-100 ease-in-out',
            word.status === 'active' && 'bg-primary/20 rounded px-1',
            word.status === 'correct' && 'text-green-400',
            word.status === 'incorrect' && 'text-red-400 underline decoration-red-600 decoration-wavy'
          )}
        >
          {word.text.split('').map((char, charIdx) => {
            let charColor = 'text-foreground/70'; // Default for pending part of active or future words
            if (word.status === 'active') {
              if (charIdx < word.typed.length) {
                charColor = word.typed[charIdx] === char ? 'text-primary-foreground' : 'text-destructive';
              } else if (charIdx === word.typed.length) {
                // This is where the cursor would be, but handled by a separate element for blinking
                charColor = 'text-foreground'; 
              }
            } else if (word.status === 'correct') {
              charColor = 'text-green-400';
            } else if (word.status === 'incorrect') {
              charColor = 'text-red-400';
            }
            
            return (
              <span key={`${word.id}-char-${charIdx}`} className={cn(charColor, word.status === 'active' && charIdx >= word.typed.length ? 'opacity-60' : '')}>
                {char}
              </span>
            );
          })}
          {word.status === 'active' && (
             <span className="inline-block border-r-2 border-accent animate-ping h-7 opacity-80 relative -top-0.5 ml-px"></span>
          )}
        </span>
      ))}
    </div>
  );
};

export default WordDisplay;
