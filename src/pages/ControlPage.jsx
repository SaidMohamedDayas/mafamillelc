import { useEffect, useMemo, useRef } from 'react';
import { RotateCcw, Settings2, Timer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useGame } from '@/context/GameContext';

function useControlAudio() {
  const audioContextRef = useRef(null);

  function getAudioContext() {
    if (typeof window === 'undefined') return null;
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      audioContextRef.current = new AudioContextClass();
    }
    return audioContextRef.current;
  }

  function playTone({ frequency, type = 'sine', duration = 0.12, volume = 0.08, delay = 0 }) {
    const context = getAudioContext();
    if (!context) return;

    const startAt = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt);
    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(volume, startAt + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.02);
  }

  function playBuzzSound(team) {
    if (team === 'A') {
      playTone({ frequency: 260, type: 'square', duration: 0.11, volume: 0.07, delay: 0 });
      playTone({ frequency: 370, type: 'square', duration: 0.13, volume: 0.08, delay: 0.11 });
      return;
    }
    playTone({ frequency: 220, type: 'triangle', duration: 0.11, volume: 0.07, delay: 0 });
    playTone({ frequency: 320, type: 'triangle', duration: 0.13, volume: 0.08, delay: 0.11 });
  }

  function playErrorSound() {
    playTone({ frequency: 190, type: 'sawtooth', duration: 0.16, volume: 0.09, delay: 0 });
    playTone({ frequency: 130, type: 'sawtooth', duration: 0.2, volume: 0.09, delay: 0.12 });
  }

  function playRoundWinSound() {
    playTone({ frequency: 392, type: 'triangle', duration: 0.14, volume: 0.09, delay: 0 });
    playTone({ frequency: 523, type: 'triangle', duration: 0.16, volume: 0.1, delay: 0.14 });
    playTone({ frequency: 659, type: 'triangle', duration: 0.2, volume: 0.11, delay: 0.3 });
  }

  return { playBuzzSound, playErrorSound, playRoundWinSound };
}

function SectionTitle({ children }) {
  return <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">{children}</p>;
}

export function ControlPage() {
  const { state, currentRound, timerSeconds, actions } = useGame();
  const { playBuzzSound, playErrorSound, playRoundWinSound } = useControlAudio();
  const currentYear = new Date().getFullYear();

  const activeTeamName = state.activeTeam ? state.teamNames[state.activeTeam] : 'Aucune';
  const ownerTeamName = state.ownerTeam ? state.teamNames[state.ownerTeam] : null;

  const lastBuzzEventIdRef = useRef(state.events?.buzz?.id ?? null);
  const lastErrorEventIdRef = useRef(state.events?.error?.id ?? null);
  const lastRoundWinEventIdRef = useRef(state.events?.roundWin?.id ?? null);

  useEffect(() => {
    const buzzId = state.events?.buzz?.id;
    const team = state.events?.buzz?.team;
    if (!buzzId || buzzId === lastBuzzEventIdRef.current) return;
    lastBuzzEventIdRef.current = buzzId;
    if (team) playBuzzSound(team);
  }, [state.events?.buzz?.id, state.events?.buzz?.team, playBuzzSound]);

  useEffect(() => {
    const errorId = state.events?.error?.id;
    if (!errorId || errorId === lastErrorEventIdRef.current) return;
    lastErrorEventIdRef.current = errorId;
    playErrorSound();
  }, [state.events?.error?.id, playErrorSound]);

  useEffect(() => {
    const roundWinId = state.events?.roundWin?.id;
    if (!roundWinId || roundWinId === lastRoundWinEventIdRef.current) return;
    lastRoundWinEventIdRef.current = roundWinId;
    playRoundWinSound();
  }, [state.events?.roundWin?.id, playRoundWinSound]);

  function handleBuzz(team) {
    if (state.buzzedTeam) return;
    actions.buzz(team);
  }

  function handleError() {
    if (!state.activeTeam) return;
    actions.addError();
  }

  const canAddError = state.activeTeam && state.errors[state.activeTeam] < (state.stealMode ? 1 : 3);

  const teamStatus = useMemo(() => {
    if (!ownerTeamName) return activeTeamName;
    if (state.stealMode) return `${activeTeamName} (VOL)`;
    return activeTeamName;
  }, [activeTeamName, ownerTeamName, state.stealMode]);

  return (
    <div className="min-h-screen overflow-x-hidden overflow-y-auto bg-background text-foreground md:h-screen md:overflow-hidden">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#1c3486_0%,#0a1f5b_38%,#02123f_65%,#010712_100%)]" />
      </div>

      <main className="mx-auto flex min-h-screen w-full max-w-[1180px] min-w-0 flex-col justify-start p-2 md:h-full md:min-h-0 md:justify-center md:p-3">
        <div className="grid h-full min-h-0 grid-rows-[auto_auto_auto_auto_minmax(0,1fr)_auto_auto] gap-2">
          <section className="rounded-xl border border-white/10 bg-[#0f1638]/85 px-3 py-2">
            <SectionTitle>1. Equipe active</SectionTitle>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-[#25345f] text-white shadow-none">Equipe active: {teamStatus}</Badge>
                {ownerTeamName && <Badge className="bg-[#1f2b4d] text-white shadow-none">Equipe initiale: {ownerTeamName}</Badge>}
                {state.stealMode && <Badge className="bg-red-600 text-white shadow-none">VOL EN COURS</Badge>}
              </div>
              <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto sm:justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => actions.setRoundIndex(Math.max(0, state.currentRoundIndex - 1))}
                  disabled={state.currentRoundIndex === 0}
                  className="h-8 bg-white/80 text-black hover:bg-white"
                >
                  Precedente
                </Button>
                <Badge className="bg-black px-4 text-yellow-300 ring-1 ring-yellow-400/90">
                  MANCHE {state.currentRoundIndex + 1} / {state.rounds.length}
                </Badge>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => actions.setRoundIndex(Math.min(state.rounds.length - 1, state.currentRoundIndex + 1))}
                  disabled={state.currentRoundIndex === state.rounds.length - 1}
                  className="h-8 bg-white/80 text-black hover:bg-white"
                >
                  Suivante
                </Button>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#0f1638]/85 px-3 py-2">
            <SectionTitle>2. Buzzer</SectionTitle>
            <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                variant={state.buzzedTeam === 'A' ? 'danger' : 'secondary'}
                className={`h-10 text-sm font-bold md:text-base ${
                  state.buzzedTeam === 'A' ? 'bg-red-600 text-white' : 'bg-red-600 text-white hover:bg-red-700'
                }`}
                onClick={() => handleBuzz('A')}
                disabled={Boolean(state.buzzedTeam)}
              >
                BUZZER {state.teamNames.A}
              </Button>
              <Button
                variant={state.buzzedTeam === 'B' ? 'default' : 'secondary'}
                className={`h-10 text-sm font-bold md:text-base ${
                  state.buzzedTeam === 'B' ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                onClick={() => handleBuzz('B')}
                disabled={Boolean(state.buzzedTeam)}
              >
                BUZZER {state.teamNames.B}
              </Button>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#0f1638]/85 px-3 py-2">
            <SectionTitle>3. Chrono</SectionTitle>
            <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Button
                variant="secondary"
                className="h-10 bg-white text-black hover:bg-white/90"
                onClick={actions.startTimer}
                disabled={timerSeconds <= 0 || state.timerEndsAt}
              >
                <Timer className="mr-2 h-4 w-4" /> {timerSeconds}s
              </Button>
              <Button
                variant="secondary"
                className="h-10 bg-white/75 text-black hover:bg-white/90"
                onClick={actions.stopTimer}
                disabled={!state.timerEndsAt}
              >
                Stop
              </Button>
              <Button variant="secondary" className="h-10 bg-[#314472] text-white hover:bg-[#3b5186]" onClick={actions.resetTimer}>
                Reset
              </Button>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#0f1638]/85 px-3 py-2">
            <SectionTitle>4. Erreurs</SectionTitle>
            <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                variant="secondary"
                onClick={handleError}
                disabled={!canAddError}
                className="h-10 bg-[#2c3a6d] text-white hover:bg-[#39497d]"
              >
                Erreur equipe buzzee
              </Button>
              <Button variant="secondary" onClick={actions.resetErrors} className="h-10 bg-white text-black hover:bg-white/90">
                Reset erreurs
              </Button>
            </div>
          </section>

          <section className="min-h-0 rounded-xl border border-white/10 bg-[#0f1638]/85 px-3 py-2">
            <SectionTitle>5. Reponses (clic pour reveler)</SectionTitle>
            <div className="mt-1 rounded-md border border-white/10 bg-black/20 px-2 py-1 text-xs font-semibold text-slate-100">
              {currentRound.question}
            </div>
            <div className="mt-2 grid min-h-0 grid-cols-1 gap-1.5 md:grid-cols-2">
              {currentRound.answers.map((answer, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => actions.toggleAnswer(index)}
                  className={`h-10 rounded-lg border px-2 text-left text-xs font-semibold transition ${
                    answer.revealed
                      ? 'border-emerald-300/60 bg-emerald-500/20 text-emerald-100'
                      : 'border-white/15 bg-[#16214a] text-white hover:bg-[#213268]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">
                      {index + 1}. {answer.text}
                    </span>
                    <span className="shrink-0 rounded bg-black/30 px-2 py-0.5 text-[11px] font-bold">
                      {answer.points} pts
                    </span>
                  </div>
                  <div className="mt-0.5 text-[10px] uppercase tracking-wide opacity-80">
                    {answer.revealed ? 'Affichee sur Home' : 'Cliquez pour afficher sur Home'}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#0f1638]/85 px-3 py-2">
            <SectionTitle>6. Reset</SectionTitle>
            <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Button variant="secondary" className="h-10 bg-[#314472] text-white hover:bg-[#3b5186]" onClick={actions.resetBuzzer}>
                reset buzzer
              </Button>
              <Button variant="secondary" className="h-10 bg-[#314472] text-white hover:bg-[#3b5186]" onClick={actions.resetCurrentRound}>
                <RotateCcw className="mr-1 h-4 w-4" /> reset manche
              </Button>
              <Button variant="secondary" className="h-10 bg-[#314472] text-white hover:bg-[#3b5186]" onClick={actions.resetGame}>
                <RotateCcw className="mr-1 h-4 w-4" /> reset complet
              </Button>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#0f1638]/85 px-3 py-2">
            <SectionTitle>7. Mode edition</SectionTitle>
            <div className="mt-1 flex flex-col items-stretch gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" className="h-9 bg-[#33477f] px-4 text-white hover:bg-[#41568f]">
                  <Settings2 className="mr-2 h-4 w-4" /> Mode edition
                </Button>
                <Switch checked={state.isEditMode} onCheckedChange={actions.setIsEditMode} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" className="h-9 bg-[#24325e] text-white hover:bg-[#314170]" onClick={actions.addAnswer} disabled={!state.isEditMode}>
                  + reponse
                </Button>
                <Button variant="secondary" className="h-9 bg-[#24325e] text-white hover:bg-[#314170]" onClick={actions.addRound} disabled={!state.isEditMode}>
                  + manche
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="mt-2 text-center text-xs text-slate-300/80 md:pointer-events-none md:fixed md:bottom-1 md:left-0 md:right-0 md:z-[95] md:text-sm">
        © {currentYear} Tous droits réservés • Application créée par Said MOHAMED
      </footer>

      {state.isEditMode && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/65 p-2">
          <div className="w-full max-w-[1080px] rounded-xl border border-white/20 bg-[#101833] p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Edition rapide</p>
              <Button variant="secondary" size="sm" onClick={() => actions.setIsEditMode(false)}>
                Fermer
              </Button>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <input
                className="h-9 rounded-lg border border-white/20 bg-black/35 px-3 text-sm text-white outline-none focus:border-yellow-300"
                value={state.teamNames.A}
                onChange={(event) => actions.setTeamName('A', event.target.value)}
                placeholder="Nom equipe A"
              />
              <input
                className="h-9 rounded-lg border border-white/20 bg-black/35 px-3 text-sm text-white outline-none focus:border-yellow-300"
                value={state.teamNames.B}
                onChange={(event) => actions.setTeamName('B', event.target.value)}
                placeholder="Nom equipe B"
              />
              <input
                className="h-9 rounded-lg border border-white/20 bg-black/35 px-3 text-sm text-white outline-none focus:border-yellow-300 md:col-span-2"
                value={currentRound.question}
                onChange={(event) => actions.updateQuestion(event.target.value)}
              />
            </div>

            <div className="mt-2 grid gap-1.5">
              {currentRound.answers.map((answer, index) => (
                <div key={index} className="grid grid-cols-[1fr_90px] gap-2">
                  <input
                    className="h-8 rounded-lg border border-white/20 bg-black/35 px-3 text-sm text-white outline-none focus:border-yellow-300"
                    value={answer.text}
                    onChange={(event) => actions.updateAnswerText(index, event.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    className="h-8 rounded-lg border border-white/20 bg-black/35 px-3 text-sm text-white outline-none focus:border-yellow-300"
                    value={answer.points}
                    onChange={(event) => actions.updateAnswerPoints(index, Number(event.target.value) || 0)}
                  />
                </div>
              ))}
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => actions.setRoundIndex(Math.max(0, state.currentRoundIndex - 1))}
                disabled={state.currentRoundIndex === 0}
              >
                Manche precedente
              </Button>
              <Badge className="bg-black text-yellow-300 ring-1 ring-yellow-400/90">
                MANCHE {state.currentRoundIndex + 1} / {state.rounds.length}
              </Badge>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => actions.setRoundIndex(Math.min(state.rounds.length - 1, state.currentRoundIndex + 1))}
                disabled={state.currentRoundIndex === state.rounds.length - 1}
              >
                Manche suivante
              </Button>
              <Button variant="secondary" size="sm" onClick={actions.addRound}>
                + Ajouter question
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={actions.deleteCurrentRound}
                disabled={state.rounds.length <= 1}
              >
                Supprimer question
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
