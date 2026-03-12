import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const phases = ['normal', 'duel', 'finale'];

export function PhaseControls({ phase, onPhaseChange }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          Phase de jeu
          <Badge className="capitalize">{phase}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-2">
        {phases.map((item) => (
          <Button
            key={item}
            variant={item === phase ? 'accent' : 'secondary'}
            size="sm"
            className="capitalize"
            onClick={() => onPhaseChange(item)}
          >
            {item}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
