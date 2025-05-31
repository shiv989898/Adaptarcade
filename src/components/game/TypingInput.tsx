
'use client';

import React, { useRef, useEffect } from 'react';

interface TypingInputProps {
  onKeyPress: (key: string) => void;
  isDisabled: boolean;
  currentWordText?: string; // For aria-label to help screen readers
}

const TypingInput: React.FC<TypingInputProps> = ({ onKeyPress, isDisabled, currentWordText }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isDisabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isDisabled]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (isDisabled) return;

    event.preventDefault(); // Prevent default for most keys to control input precisely

    if (event.key === 'Backspace') {
      onKeyPress('Backspace');
    } else if (event.key === ' ') {
      onKeyPress(' ');
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      // Allow single characters, ignore control keys, meta keys, alt keys
      onKeyPress(event.key);
    }
    // Other keys (like Shift, Ctrl, Alt, Tab, Enter, Arrows) are ignored by default due to preventDefault
    // and not being explicitly handled.
  };
  
  // The input is visually hidden but accessible for focus and capturing keystrokes.
  return (
    <input
      ref={inputRef}
      type="text"
      onKeyDown={handleKeyDown}
      disabled={isDisabled}
      className="opacity-0 w-0 h-0 absolute -z-10" // Visually hide, but keep focusable
      aria-label={currentWordText ? `Type the word: ${currentWordText}` : "Typing input area"}
      autoCapitalize="off"
      autoComplete="off"
      autoCorrect="off"
      spellCheck="false"
    />
  );
};

export default TypingInput;
