import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ScoreEntry } from '@/types/maze';
import { Trophy } from 'lucide-react';

interface LeaderboardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  scores: ScoreEntry[];
}

const LeaderboardDialog: React.FC<LeaderboardDialogProps> = ({ isOpen, onClose, scores }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-headline">
            <Trophy className="text-accent h-7 w-7" /> Leaderboard
          </DialogTitle>
          <DialogDescription>
            Top players who conquered the AdaptiMaze!
          </DialogDescription>
        </DialogHeader>
        {scores.length > 0 ? (
          <div className="max-h-[60vh] overflow-y-auto pr-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">Level</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scores.map((score, index) => (
                  <TableRow key={score.id} className={index === 0 ? 'bg-accent/10' : ''}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{score.playerName || 'Anonymous'}</TableCell>
                    <TableCell className="text-right">{score.level}</TableCell>
                    <TableCell className="text-right">{score.time}s</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-center py-8 text-muted-foreground">No scores yet. Be the first to set a record!</p>
        )}
        <DialogFooter>
          <Button onClick={onClose} variant="outline">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LeaderboardDialog;
