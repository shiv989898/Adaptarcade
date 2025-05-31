
'use client';

import GameCard from '@/components/game/GameCard';
import type { GameMeta } from '@/types/game';
import { Zap, MousePointerClick, Hammer, Keyboard } from 'lucide-react';
import { motion } from 'framer-motion';

const games: GameMeta[] = [
  {
    id: 'target-tap',
    name: 'Precision Tap',
    description: 'Targets grow, points decay! Tap fast & accurately. Choose your challenge.',
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
  {
    id: 'speed-typer',
    name: 'Speed Typer',
    description: 'Test your typing speed and accuracy. Type the displayed words as quickly and accurately as possible!',
    route: '/games/speed-typer',
    icon: Keyboard,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12,
    },
  },
};

export default function GameHubPage() {
  return (
    <main className="flex-grow flex flex-col items-center p-4 sm:p-8 bg-gradient-to-br from-purple-700/50 via-indigo-600/40 to-pink-500/30">
      <motion.header
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mb-12 text-center"
      >
        <h1 className="text-5xl sm:text-6xl font-headline font-bold text-primary mb-4">
          Adaptarcade
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Welcome to the Arcade! Choose a game below and test your skills.
        </p>
      </motion.header>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 w-full max-w-6xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {games.map((game) => (
          <motion.div key={game.id} variants={itemVariants}>
            <GameCard game={game} />
          </motion.div>
        ))}
      </motion.div>
      
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 + games.length * 0.1 }}
        className="mt-16 text-center text-sm text-muted-foreground"
      >
        <p>&copy; 2025 Adaptarcade. All games are for demonstration purposes.</p>
      </motion.footer>
    </main>
  );
}
