import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '@/context/GameContext';

function ScoreCorrection({ team, name, score, onSave }) {
  const [value, setValue] = useState(String(score));
  useEffect(() => setValue(String(score)), [score]);
  return <form className="flex flex-wrap items-center gap-2" onSubmit={(event) => { event.preventDefault(); onSave(team, Number(value)); }}>
    <label className="text-sm">Score {name} <input className="ml-1 w-24 rounded bg-black/40 p-2" aria-label={`Score ${name}`} type="number" required min="0" max="1000000000" step="1" value={value} onChange={(event) => setValue(event.target.value)} /></label>
    <Button size="sm" variant="secondary" type="submit" disabled={Number(value) === score}>Corriger</Button>
  </form>;
}
export function EventControls() {
  const { state, actions, currentRound, revealedTotal, storageIssue } = useGame();
  const [duration, setDuration] = useState(String(state.timerDuration));
  useEffect(() => setDuration(String(state.timerDuration)), [state.timerDuration]);
  const closed = Boolean(currentRound.award || currentRound.legacyReview);
  return <section className="space-y-3 rounded-xl border border-white/10 bg-[#0f1638]/85 p-3">
    <div className="flex flex-wrap gap-2">
      <a className="rounded bg-white/15 px-3 py-2 text-sm" href="/" target="_blank" rel="noreferrer">Ouvrir la projection</a>
      <Button size="sm" variant="secondary" onClick={() => actions.setScreenMode('waiting')} disabled={state.screenMode === 'waiting'}>Écran d’attente</Button>
      <Button size="sm" onClick={() => actions.setScreenMode('game')} disabled={state.screenMode === 'game'}>Afficher la manche {state.currentRoundIndex + 1}</Button>
      <Button size="sm" variant="secondary" onClick={() => actions.setShowFullscreenPrompt(!state.showFullscreenPrompt)}>{state.showFullscreenPrompt ? 'Retirer' : 'Proposer'} le plein écran</Button>
      <Button size="sm" variant="secondary" disabled={!state.undo} onClick={actions.undo}>Annuler {state.undo?.label || 'la dernière action'}</Button>
      <Button size="sm" variant="secondary" onClick={actions.exportSave}>Exporter la sauvegarde</Button>
    </div>
    <p className="text-sm text-slate-300">Projection : {state.screenMode === 'waiting' ? 'attente — préparation masquée' : 'manche visible'}. Changer de manche masque automatiquement la projection. L’attente met le chrono en pause.</p>
    {storageIssue && <p role="alert" className="rounded border border-red-300 bg-red-950 p-2 text-sm">{storageIssue}</p>}
    {currentRound.legacyReview && <p role="alert" className="text-amber-200">Ancienne sauvegarde : attribution inconnue pour cette manche. Vérifiez les scores, puis réinitialisez la manche pour la rejouer ; aucun ancien point ne sera retiré automatiquement.</p>}
    {currentRound.award && <p className="text-emerald-200">Manche clôturée : {currentRound.award.points} points attribués à {state.teamNames[currentRound.award.team]}. Annulez la dernière action pour corriger une attribution récente.</p>}
    <div className="flex flex-wrap gap-3">
      {['A', 'B'].map((team) => <div key={team} className="space-y-2 rounded border border-white/10 p-2">
        <ScoreCorrection team={team} name={state.teamNames[team]} score={state.scores[`team${team}`]} onSave={actions.setScore} />
        <Button size="sm" variant="secondary" disabled={closed || state.activeTeam !== team} onClick={() => actions.awardRevealedToTeam(team)}>Attribuer {revealedTotal} pts à {state.teamNames[team]}</Button>
      </div>)}
    </div>
    <form className="flex flex-wrap items-center gap-2" onSubmit={(event) => { event.preventDefault(); actions.setTimerDuration(Number(duration)); }}>
      <label className="text-sm">Durée du chrono (secondes) <input className="ml-1 w-20 rounded bg-black/40 p-2" type="number" required min="1" max="3600" step="1" value={duration} disabled={state.timerEndsAt !== null} onChange={(event) => setDuration(event.target.value)} /></label>
      <Button size="sm" variant="secondary" type="submit" disabled={state.timerEndsAt !== null || Number(duration) === state.timerDuration}>Appliquer la durée</Button>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={state.autoError} onChange={(event) => actions.setAutoError(event.target.checked)} />Erreur automatique à l’expiration</label>
    </form>
    <p className="text-xs text-slate-300">Avec sanction : une expiration ajoute une erreur et relance le chrono, trois erreurs passent la main au vol ; un vol raté attribue les points à l’équipe initiale. Sans sanction : arrêt à zéro. Une annulation laisse le chrono en pause.</p>
  </section>;
}
