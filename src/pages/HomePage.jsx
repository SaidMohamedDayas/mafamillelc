import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ScoreBoard } from '@/components/ScoreBoard';
import { AnswersBoard } from '@/components/AnswersBoard';
import { Badge } from '@/components/ui/badge';
import { useGame } from '@/context/GameContext';

const ROUND_WIN_POPUP_MS = 2000;
const FINAL_POPUP_DELAY_AFTER_ROUND_MS = 3000;

export function HomePage() {
  const { state, currentRound, revealedTotal, timerSeconds, actions } = useGame();
  const currentYear = new Date().getFullYear();

  const now = Date.now();
  const showBuzzPopup = useMemo(() => {
    const buzz = state.events?.buzz;
    return Boolean(buzz && now - buzz.at < 2000);
  }, [state.events?.buzz?.id, now]);

  const showErrorPopup = useMemo(() => {
    const error = state.events?.error;
    return Boolean(error && now - error.at < 2000);
  }, [state.events?.error?.id, now]);

  const showRoundWinPopup = useMemo(() => {
    const roundWin = state.events?.roundWin;
    return Boolean(roundWin && now - roundWin.at < ROUND_WIN_POPUP_MS);
  }, [state.events?.roundWin?.id, now]);
  const showFinalWinnerPopup = useMemo(() => {
    const gameWin = state.events?.gameWin;
    if (!gameWin) return false;
    return now - gameWin.at >= ROUND_WIN_POPUP_MS + FINAL_POPUP_DELAY_AFTER_ROUND_MS;
  }, [state.events?.gameWin?.id, now]);

  const flashClass = useMemo(() => {
    const buzz = state.events?.buzz;
    const error = state.events?.error;
    if (error && now - error.at < 2000) return 'bg-red-500/25';
    if (buzz && now - buzz.at < 2000) return buzz.team === 'A' ? 'bg-red-400/20' : 'bg-blue-400/20';
    return null;
  }, [state.events?.buzz?.id, state.events?.error?.id, now]);

  const activeTeamName = state.activeTeam ? state.teamNames[state.activeTeam] : null;
  const ownerTeamName = state.ownerTeam ? state.teamNames[state.ownerTeam] : null;

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#1c3486_0%,#0a1f5b_38%,#02123f_65%,#010712_100%)]" />
        <div className="absolute left-1/2 top-6 h-44 w-[72rem] -translate-x-1/2 rounded-full bg-indigo-300/20 blur-3xl" />
      </div>

      <main className="mx-auto flex h-full w-full max-w-[1200px] flex-col justify-center p-3 md:p-4">
        <AnimatePresence>
          {flashClass && (
            <motion.div
              key={flashClass}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`pointer-events-none fixed inset-0 z-40 ${flashClass}`}
            />
          )}
          {showBuzzPopup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-5 z-50 flex items-center justify-center rounded-2xl border-2 border-yellow-300/90 bg-black/80 backdrop-blur-sm"
            >
              <div className="text-center">
                <p className="font-display text-6xl font-black uppercase tracking-wide text-yellow-300 md:text-8xl">
                  {state.teamNames[state.events.buzz.team]}
                </p>
                <p className="mt-2 font-display text-4xl font-bold text-yellow-200 md:text-6xl">a buzzé</p>
              </div>
            </motion.div>
          )}
          {showErrorPopup && (
            <motion.div
              key={state.events.error.id}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35"
            >
              <div className="rounded-3xl border-2 border-red-300 bg-red-600/90 px-10 py-6 shadow-[0_0_40px_rgba(239,68,68,0.65)]">
                <p className="font-display text-8xl font-black leading-none text-white md:text-[12rem]">✕</p>
              </div>
            </motion.div>
          )}
          {showRoundWinPopup && (
            <motion.div
              key={state.events.roundWin.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-[65] flex items-center justify-center bg-black/45"
            >
              <div className="rounded-3xl border-2 border-emerald-300 bg-emerald-600/90 px-10 py-7 text-center shadow-[0_0_42px_rgba(16,185,129,0.55)]">
                <p className="font-display text-3xl font-bold text-white md:text-5xl">Manche remportee</p>
                <p className="mt-2 font-display text-4xl font-black text-emerald-100 md:text-6xl">
                  {state.teamNames[state.events.roundWin.team]}
                </p>
              </div>
            </motion.div>
          )}
          {showFinalWinnerPopup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-[75] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            >
              <div className="rounded-3xl border-2 border-yellow-300 bg-[linear-gradient(145deg,#1b2450,#0b1028)] px-10 py-8 text-center shadow-[0_0_60px_rgba(250,204,21,0.35)]">
                <p className="font-display text-3xl font-bold text-yellow-200 md:text-5xl">Victoire finale</p>
                <p className="mt-4 font-display text-5xl font-black text-white md:text-7xl">
                  {state.events.gameWin.team ? state.teamNames[state.events.gameWin.team] : 'Egalite'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.header initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-3">
          <ScoreBoard
            scores={{
              ...state.scores,
              teamNameA: state.teamNames.A,
              teamNameB: state.teamNames.B,
            }}
            onAwardTeam={actions.awardRevealedToTeam}
            revealedTotal={revealedTotal}
            buzzedTeam={state.activeTeam}
          />
        </motion.header>

        <div className="flex flex-1 flex-col gap-3 overflow-hidden">
          <section className="flex flex-col items-center justify-center gap-2">
            <div className="flex items-center justify-center gap-3">
              {Array.from({ length: 3 }, (_, index) => {
                const active = state.activeTeam ? index < state.errors[state.activeTeam] : false;
                return (
                  <div
                    key={index}
                    className={`flex h-14 w-14 items-center justify-center rounded-full border-4 text-3xl font-black ${
                      active ? 'border-red-400 text-red-400' : 'border-red-900/70 text-red-900/70'
                    }`}
                  >
                    ×
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Badge className="bg-[#25345f] text-white shadow-none">
                Equipe active: {activeTeamName ?? 'Aucune'}
              </Badge>
              {ownerTeamName && (
                <Badge className="bg-[#1f2b4d] text-white shadow-none">
                  Equipe initiale: {ownerTeamName}
                </Badge>
              )}
              {state.stealMode && <Badge className="bg-red-600 text-white shadow-none">VOL EN COURS</Badge>}
            </div>
            <Badge className="bg-white text-black shadow-none">Chrono: {timerSeconds}s</Badge>
          </section>

          <AnimatePresence mode="wait">
            <motion.section
              key={state.currentRoundIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="min-h-0 flex-1"
            >
              <AnswersBoard
                question={currentRound.question}
                answers={currentRound.answers}
                revealedTotal={revealedTotal}
                onToggleAnswer={actions.toggleAnswer}
                compact
              />
            </motion.section>
          </AnimatePresence>
        </div>

        <footer className="mt-2 text-center text-xs text-slate-300/80 md:text-sm">
          © {currentYear} Tous droits réservés • Application créée par Said MOHAMED
        </footer>
      </main>
    </div>
  );
}
