
'use client';

import GameCard from '@/components/game/GameCard';
import type { GameMeta } from '@/types/game';
import { Zap, MousePointerClick, Hammer } from 'lucide-react';

const games: GameMeta[] = [
  {
    id: 'target-tap',
    name: 'Target Tap',
    description: 'Test your reflexes! Tap varied targets as fast as you can. Smaller targets = more points!',
    route: '/games/target-tap',
    icon: Zap,
  },
  {
    id: 'quick-click',
    name: 'Quick Click Challenge',
    description: 'How many times can you click the button in 5 seconds? A simple test of clicking speed with a visual timer!',
    route: '/games/quick-click',
    icon: MousePointerClick,
  },
  {
    id: 'mole-mash',
    name: 'Mole Mash',
    description: 'Whack those pesky moles! Click them as they pop up from their holes before they disappear. Fast reactions win!',
    route: '/games/mole-mash',
    icon: Hammer,
  },
  // Add more games here as GameMeta objects
];

export default function GameHubPage() {
  return (
    <main className="flex-grow flex flex-col items-center p-4 sm:p-8 bg-gradient-to-br from-background to-primary/10">
      <header className="mb-12 text-center">
        <h1 className="text-5xl sm:text-6xl font-headline font-bold text-primary mb-4">
          Game Arcade
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Welcome to the Firebase Studio Game Arcade! Choose a game below and test your skills.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 w-full max-w-6xl">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
      
      <footer className="mt-16 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Firebase Studio. All games are for demonstration purposes.</p>
      </footer>
    </main>
  );
}
