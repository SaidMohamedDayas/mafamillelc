import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function ErrorDots({ count }) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: 3 }, (_, idx) => (
        <div
          key={idx}
          className={`h-4 w-10 rounded-full border ${
            idx < count
              ? 'border-rose-300/80 bg-gradient-to-r from-rose-500 to-orange-400 shadow-[0_0_18px_rgba(244,63,94,0.5)]'
              : 'border-white/15 bg-white/5'
          }`}
        />
      ))}
    </div>
  );
}

export function ErrorTracker({ errors, onAddError, onResetErrors }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TriangleAlert className="h-4 w-4 text-rose-300" />
          Erreurs (3 max)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted">Equipe A</div>
          <ErrorDots count={errors.A} />
          <Button variant="secondary" size="sm" onClick={() => onAddError('A')} disabled={errors.A >= 3}>
            Ajouter erreur A
          </Button>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted">Equipe B</div>
          <ErrorDots count={errors.B} />
          <Button variant="secondary" size="sm" onClick={() => onAddError('B')} disabled={errors.B >= 3}>
            Ajouter erreur B
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={onResetErrors}>
          Reset erreurs
        </Button>
      </CardContent>
    </Card>
  );
}
