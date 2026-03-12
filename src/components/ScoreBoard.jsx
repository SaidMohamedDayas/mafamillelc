import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function TeamScoreCard({ label, score, onAward, revealedTotal, canAward }) {
  return (
    <Card className="relative overflow-hidden rounded-xl border-2 border-yellow-400/90 bg-black/95">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-center gap-2 text-xl text-slate-200 md:text-3xl">
          {label}
          <Trophy className="h-5 w-5 text-yellow-300" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3 pb-6">
        <motion.span
          key={score}
          initial={{ scale: 0.9, opacity: 0.2 }}
          animate={{ scale: [1.04, 1], opacity: 1 }}
          transition={{ duration: 0.28 }}
          className="font-display text-6xl font-bold text-yellow-400 md:text-7xl"
        >
          {score}
        </motion.span>
        <Button
          variant="secondary"
          size="sm"
          onClick={onAward}
          disabled={!canAward}
          className="min-w-28 bg-[#0b1c4a] text-white hover:bg-[#132a68]"
        >
          + {revealedTotal} pts
        </Button>
      </CardContent>
    </Card>
  );
}

export function ScoreBoard({ scores, onAwardTeam, revealedTotal, buzzedTeam }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TeamScoreCard
        label={scores.teamNameA ?? 'Equipe A'}
        score={scores.teamA}
        onAward={() => onAwardTeam('A')}
        revealedTotal={revealedTotal}
        canAward={buzzedTeam === 'A'}
      />
      <TeamScoreCard
        label={scores.teamNameB ?? 'Equipe B'}
        score={scores.teamB}
        onAward={() => onAwardTeam('B')}
        revealedTotal={revealedTotal}
        canAward={buzzedTeam === 'B'}
      />
    </div>
  );
}
