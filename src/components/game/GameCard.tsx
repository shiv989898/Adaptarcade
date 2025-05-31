
'use client';

import type { GameMeta } from '@/types/game';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlayCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface GameCardProps {
  game: GameMeta;
}

const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const IconComponent = game.icon;

  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: "0px 10px 20px hsla(var(--primary-DEFAULT), 0.2)" }}
      transition={{ type: "spring", stiffness: 300 }}
      className="w-full max-w-sm"
    >
      <Card className="h-full shadow-lg flex flex-col bg-card/80 backdrop-blur-sm border-border hover:border-primary/50 transition-colors duration-200">
        {/* CardHeader and Image removed */}
        <CardContent className="p-5 sm:p-6 flex-grow">
          <CardTitle className="text-2xl font-headline text-primary mb-2 flex items-center">
            {IconComponent && <IconComponent className="mr-2.5 h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2} />}
            {game.name}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground min-h-[3.5rem] line-clamp-3">
            {game.description}
          </CardDescription>
        </CardContent>
        <CardFooter className="p-5 sm:p-6 pt-0">
          <Button asChild size="lg" className="w-full shadow-md hover:shadow-lg transition-shadow !bg-primary hover:!bg-primary/90">
            <Link href={game.route}>
              <PlayCircle className="mr-2 h-5 w-5" />
              Play Game
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default GameCard;
