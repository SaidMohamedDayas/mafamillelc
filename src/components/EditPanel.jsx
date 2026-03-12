import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function EditPanel({ round, onQuestionChange, onAnswerTextChange, onAnswerPointsChange, onAddAnswer, onAddRound }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mode edition</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-muted">Question</label>
          <input
            className="h-11 w-full rounded-xl border border-white/15 bg-black/20 px-3 text-sm text-white outline-none ring-0 focus:border-brand"
            value={round.question}
            onChange={(event) => onQuestionChange(event.target.value)}
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted">Reponses</p>
          {round.answers.map((answer, index) => (
            <div key={index} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_110px]">
              <input
                className="h-10 rounded-xl border border-white/15 bg-black/20 px-3 text-sm text-white outline-none focus:border-brand"
                value={answer.text}
                onChange={(event) => onAnswerTextChange(index, event.target.value)}
              />
              <input
                type="number"
                min="0"
                className="h-10 rounded-xl border border-white/15 bg-black/20 px-3 text-sm text-white outline-none focus:border-brand"
                value={answer.points}
                onChange={(event) => onAnswerPointsChange(index, Number(event.target.value) || 0)}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={onAddAnswer}>
            <Plus className="mr-1 h-4 w-4" /> Ajouter reponse
          </Button>
          <Button variant="accent" size="sm" onClick={onAddRound}>
            <Plus className="mr-1 h-4 w-4" /> Ajouter manche
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
