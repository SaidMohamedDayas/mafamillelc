import { motion } from 'framer-motion';
import { Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function FinalTimer({ seconds, running, onStart, onStop, onReset, isFinale }) {
  const progress = Math.max(0, Math.min(100, (seconds / 20) * 100));
  const isDanger = seconds <= 5;

  return (
    <Card className={isFinale ? 'border-amber-300/35 shadow-gold' : ''}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Timer className="h-4 w-4 text-amber-300" /> Chrono finale (20s)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative overflow-hidden rounded-xl border border-white/15 bg-black/35 p-4">
          <motion.div
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.25 }}
            className={`absolute inset-y-0 left-0 ${
              isDanger
                ? 'bg-gradient-to-r from-rose-500/35 via-red-500/35 to-orange-300/35'
                : 'bg-gradient-to-r from-indigo-500/35 via-violet-500/35 to-amber-300/35'
            }`}
          />
          <motion.div
            animate={isDanger && running ? { scale: [1, 1.04, 1] } : { scale: 1 }}
            transition={{ duration: 0.45, repeat: isDanger && running ? Infinity : 0 }}
            className={`relative text-center font-display text-4xl font-bold tracking-wide ${
              isDanger ? 'text-rose-100 drop-shadow-[0_0_14px_rgba(244,63,94,0.7)]' : 'text-white'
            }`}
          >
            {seconds}s
          </motion.div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="accent" size="sm" onClick={onStart} disabled={running || seconds <= 0}>
            Lancer
          </Button>
          <Button variant="secondary" size="sm" onClick={onStop} disabled={!running}>
            Arreter
          </Button>
          <Button variant="ghost" size="sm" onClick={onReset}>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
