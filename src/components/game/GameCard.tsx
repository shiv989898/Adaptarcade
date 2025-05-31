
'use client';

import type { GameMeta } from '@/types/game';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { PlayCircle } from 'lucide-react';

interface GameCardProps {
  game: GameMeta;
}

const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const IconComponent = game.icon;

  return (
    <Card className="w-full max-w-sm overflow-hidden shadow-lg hover:shadow-primary/30 transition-shadow duration-300 flex flex-col bg-card/80 backdrop-blur-sm">
      <CardHeader className="p-0">
        <div className="relative w-full h-48 bg-muted/50">
          <Image
            src={game.thumbnailUrl || `https://placehold.co/600x400.png?text=${encodeURIComponent(game.name)}`}
            alt={`${game.name} thumbnail`}
            layout="fill"
            objectFit="cover"
            data-ai-hint={game.dataAiHint || 'abstract game'}
          />
        </div>
      </CardHeader>
      <CardContent className="p-6 flex-grow">
        <CardTitle className="text-2xl font-headline text-primary mb-2 flex items-center">
          {IconComponent && <IconComponent className="mr-3 h-7 w-7" />}
          {game.name}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground min-h-[3.5rem] line-clamp-3">
          {game.description}
        </CardDescription>
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Button asChild size="lg" className="w-full shadow-md hover:shadow-lg transition-shadow">
          <Link href={game.route}>
            <PlayCircle className="mr-2 h-5 w-5" />
            Play Game
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GameCard;
