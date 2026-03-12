import { motion } from 'framer-motion';
import { BellRing } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function BuzzerPanel({ buzzedTeam, onBuzz, onReset }) {
  return (
    <Card className={buzzedTeam ? 'border-amber-200/40 shadow-[0_0_24px_rgba(251,191,36,0.25)]' : ''}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="inline-flex items-center gap-2">
            <BellRing className="h-4 w-4 text-amber-300" /> Buzzer
          </span>
          <Badge className="capitalize">{buzzedTeam ? `Equipe ${buzzedTeam}` : 'Libre'}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={buzzedTeam === 'A' ? 'accent' : 'secondary'}
            onClick={() => onBuzz('A')}
            disabled={Boolean(buzzedTeam)}
          >
            Buzzer A
          </Button>
          <Button
            variant={buzzedTeam === 'B' ? 'accent' : 'secondary'}
            onClick={() => onBuzz('B')}
            disabled={Boolean(buzzedTeam)}
          >
            Buzzer B
          </Button>
        </div>
        <motion.div
          animate={
            buzzedTeam
              ? { opacity: [0.55, 1, 0.7, 1], scale: [1, 1.01, 1] }
              : { opacity: 0.75, scale: 1 }
          }
          transition={{ duration: 0.55 }}
          className={`rounded-xl border px-3 py-2 text-sm ${
            buzzedTeam
              ? 'border-amber-300/45 bg-[linear-gradient(130deg,rgba(251,191,36,0.22),rgba(245,158,11,0.08))] text-amber-100'
              : 'border-white/15 bg-white/5 text-muted'
          }`}
        >
          {buzzedTeam ? `Equipe ${buzzedTeam} a buzzé en premier.` : 'En attente du premier buzzer.'}
        </motion.div>
        <Button variant="ghost" size="sm" onClick={onReset}>
          Reset buzzer
        </Button>
      </CardContent>
    </Card>
  );
}
