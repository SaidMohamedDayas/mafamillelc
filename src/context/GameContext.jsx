import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getTimerSeconds, revealedTotal } from '../game/engine.js';
import { createGameStore } from '../game/store.js';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [snapshot, setSnapshot] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [now, setNow] = useState(Date.now);
  const [store, setStore] = useState(null);

  useEffect(() => {
    const instance = createGameStore({
      // Access can throw in private or restricted browsing; the store catches it.
      storage: { getItem: (key) => window.localStorage.getItem(key),
        setItem: (key, value) => window.localStorage.setItem(key, value) },
      locks: navigator.locks,
      canWrite: window.location.pathname.replace(/\/$/, '') === '/control',
      subscribeStorage(callback) {
        window.addEventListener('storage', callback);
        return () => window.removeEventListener('storage', callback);
      },
      onChange: setSnapshot,
    });
    setStore(instance);
    setSnapshot(instance.getSnapshot());
    return () => instance.dispose();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const at = Date.now();
      setNow(at);
      const latest = store?.getSnapshot().state;
      if (window.location.pathname.replace(/\/$/, '') === '/control' && latest?.timerEndsAt != null && latest.timerEndsAt <= at) {
        void store.dispatch({ type: 'expireTimer', deadline: latest.timerEndsAt });
      }
    }, 200);
    return () => clearInterval(interval);
  }, [store]);

  useEffect(() => {
    const refresh = () => { store?.refresh(); setNow(Date.now()); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [store]);

  const actions = useMemo(() => {
    const roundActions = new Set(['setRoundIndex', 'toggleAnswer', 'awardRevealedToTeam', 'buzz', 'addError', 'resetErrors', 'resetBuzzer', 'resetCurrentRound', 'deleteCurrentRound', 'updateQuestion', 'updateAnswerText', 'updateAnswerPoints', 'addAnswer']);
    const dispatch = (type, extra = {}) => store?.dispatch({ type, ...extra,
      ...(['undo', 'resetGame', 'resetCurrentRound', 'deleteCurrentRound'].includes(type) ? { expectedRevision: snapshot?.revision } : {}),
      ...(roundActions.has(type) ? { expectedRoundIndex: snapshot?.state.currentRoundIndex,
        expectedRoundQuestion: snapshot?.state.rounds[snapshot.state.currentRoundIndex].question } : {}) });
    const result = {};
    for (const type of ['setRoundIndex', 'toggleAnswer', 'awardRevealedToTeam', 'buzz', 'setTimerDuration', 'setAutoError', 'setScreenMode', 'setShowFullscreenPrompt', 'updateQuestion']) result[type] = (value) => dispatch(type, { value });
    for (const type of ['addError', 'resetErrors', 'resetBuzzer', 'startTimer', 'stopTimer', 'resetTimer', 'addAnswer', 'addRound', 'undo']) result[type] = () => dispatch(type);
    for (const type of ['resetGame', 'resetCurrentRound', 'deleteCurrentRound']) result[type] = (confirmed = false) => dispatch(type, { confirmed: confirmed === true });
    for (const type of ['setTeamName', 'setScore']) result[type] = (team, value) => dispatch(type, { team, value });
    for (const type of ['updateAnswerText', 'updateAnswerPoints']) result[type] = (index, value) => dispatch(type, { index, value });
    result.setIsEditMode = setIsEditMode;
    result.exportSave = () => {
      try {
        const url = URL.createObjectURL(new Blob([store.exportSave()], { type: 'application/json' }));
        const link = document.createElement('a');
        link.href = url; link.download = 'ma-famille-lc-sauvegarde.json'; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch { window.alert('Export impossible : le navigateur bloque l’accès au stockage.'); }
    };
    return result;
  }, [store, snapshot]);

  if (!snapshot) return null;
  const state = { ...snapshot.state, isEditMode };
  const currentRound = state.rounds[state.currentRoundIndex];
  return <GameContext.Provider value={{ state, actions, currentRound,
    revealedTotal: revealedTotal(currentRound), timerSeconds: getTimerSeconds(state, now),
    timerRunning: state.timerEndsAt !== null, storageIssue: snapshot.issue, storageBlocked: snapshot.blocked }}>
    {children}
  </GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used inside GameProvider');
  return context;
}
