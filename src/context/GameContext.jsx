import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createInitialRounds } from '@/data/defaultRounds';

const STORAGE_KEY = 'famille-or-state-v2';
const INITIAL_TIMER = 20;

function createInitialState() {
  return {
    rounds: createInitialRounds(),
    scores: { teamA: 0, teamB: 0 },
    teamNames: { A: 'Equipe A', B: 'Equipe B' },
    currentRoundIndex: 0,
    errors: { A: 0, B: 0 },
    buzzedTeam: null,
    ownerTeam: null,
    activeTeam: null,
    stealMode: false,
    phase: 'normal',
    timerSeconds: INITIAL_TIMER,
    timerEndsAt: null,
    isEditMode: false,
    events: { buzz: null, error: null, roundWin: null, gameWin: null },
  };
}

function loadState() {
  if (typeof window === 'undefined') return createInitialState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    return {
      ...createInitialState(),
      ...parsed,
      teamNames: { ...createInitialState().teamNames, ...(parsed.teamNames || {}) },
      events: { buzz: null, error: null, roundWin: null, gameWin: null, ...(parsed.events || {}) },
    };
  } catch {
    return createInitialState();
  }
}

function getOtherTeam(team) {
  return team === 'A' ? 'B' : 'A';
}

function getTimerSeconds(state, now = Date.now()) {
  if (!state.timerEndsAt) return state.timerSeconds;
  const remaining = Math.ceil((state.timerEndsAt - now) / 1000);
  return Math.max(0, remaining);
}

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, setState] = useState(loadState);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    function onStorage(event) {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        setState(JSON.parse(event.newValue));
      } catch {
        // ignore malformed storage value
      }
    }

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!state.timerEndsAt) return undefined;

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 200);

    return () => clearInterval(interval);
  }, [state.timerEndsAt]);

  useEffect(() => {
    if (!state.timerEndsAt) return;
    if (getTimerSeconds(state, now) > 0) return;
    setState((previous) => {
      if (!previous.timerEndsAt) return previous;
      if (getTimerSeconds(previous, Date.now()) > 0) return previous;
      return applyErrorState(previous, { at: Date.now(), restartTimer: true });
    });
  }, [state, now]);

  const currentRound = state.rounds[state.currentRoundIndex];

  const revealedTotal = useMemo(
    () => currentRound.answers.filter((answer) => answer.revealed).reduce((sum, answer) => sum + answer.points, 0),
    [currentRound.answers]
  );

  function updateCurrentRound(transformRound) {
    setState((previous) => ({
      ...previous,
      rounds: previous.rounds.map((round, index) =>
        index === previous.currentRoundIndex ? transformRound(round) : round
      ),
    }));
  }

  function clearTurn(previous) {
    return {
      ...previous,
      errors: { A: 0, B: 0 },
      buzzedTeam: null,
      ownerTeam: null,
      activeTeam: null,
      stealMode: false,
    };
  }

  function endTurn(previous) {
    return {
      ...clearTurn(previous),
      timerSeconds: INITIAL_TIMER,
      timerEndsAt: null,
    };
  }

  function awardToTeam(previous, team, points) {
    return {
      ...previous,
      scores: {
        ...previous.scores,
        [team === 'A' ? 'teamA' : 'teamB']: previous.scores[team === 'A' ? 'teamA' : 'teamB'] + points,
      },
    };
  }

  function awardAndEndTurn(previous, team, points, at = Date.now()) {
    const withPoints = awardToTeam(previous, team, points);
    const isLastRound = previous.currentRoundIndex === previous.rounds.length - 1;
    const winnerTeam =
      withPoints.scores.teamA === withPoints.scores.teamB
        ? null
        : withPoints.scores.teamA > withPoints.scores.teamB
          ? 'A'
          : 'B';
    const withEvent = {
      ...withPoints,
      events: {
        ...withPoints.events,
        roundWin: { id: at, team, at },
        gameWin: isLastRound
          ? {
              id: at,
              team: winnerTeam,
              at,
            }
          : withPoints.events.gameWin,
      },
    };
    return endTurn(withEvent);
  }

  function applyErrorState(previous, { at = Date.now(), restartTimer = false } = {}) {
    if (!previous.activeTeam) {
      return {
        ...previous,
        timerSeconds: INITIAL_TIMER,
        timerEndsAt: null,
      };
    }

    const team = previous.activeTeam;
    const nextErrors = {
      ...previous.errors,
      [team]: Math.min(3, previous.errors[team] + 1),
    };

    let next = {
      ...previous,
      errors: nextErrors,
      events: {
        ...previous.events,
        error: { id: at, team, at },
      },
    };

    if (!previous.stealMode && nextErrors[team] >= 3) {
      const stealTeam = getOtherTeam(team);
      next = {
        ...next,
        buzzedTeam: stealTeam,
        activeTeam: stealTeam,
        stealMode: true,
        errors: { ...next.errors, [stealTeam]: 0 },
      };
    } else if (previous.stealMode && team !== previous.ownerTeam) {
      const round = previous.rounds[previous.currentRoundIndex];
      const total = round.answers
        .filter((answer) => answer.revealed)
        .reduce((sum, answer) => sum + answer.points, 0);
      return awardAndEndTurn(next, previous.ownerTeam, total, at);
    }

    if (restartTimer && next.activeTeam) {
      return {
        ...next,
        timerSeconds: INITIAL_TIMER,
        timerEndsAt: Date.now() + INITIAL_TIMER * 1000,
      };
    }

    return next;
  }

  function withRestartedTimer(previous) {
    if (!previous.activeTeam) return previous;
    return {
      ...previous,
      timerSeconds: INITIAL_TIMER,
      timerEndsAt: Date.now() + INITIAL_TIMER * 1000,
    };
  }

  const actions = {
    setRoundIndex(nextIndex) {
      setState((previous) => ({
        ...clearTurn(previous),
        currentRoundIndex: nextIndex,
        phase: 'normal',
        timerSeconds: INITIAL_TIMER,
        timerEndsAt: null,
      }));
    },

    toggleAnswer(answerIndex) {
      setState((previous) => {
        const round = previous.rounds[previous.currentRoundIndex];
        const answer = round.answers[answerIndex];
        if (answer.revealed) return previous;
        const nextRevealed = true;

        const rounds = previous.rounds.map((item, index) => {
          if (index !== previous.currentRoundIndex) return item;
          return {
            ...item,
            answers: item.answers.map((itemAnswer, itemIndex) =>
              itemIndex === answerIndex ? { ...itemAnswer, revealed: nextRevealed } : itemAnswer
            ),
          };
        });

        let next = { ...previous, rounds };
        const updatedRound = rounds[previous.currentRoundIndex];
        const total = updatedRound.answers
          .filter((itemAnswer) => itemAnswer.revealed)
          .reduce((sum, itemAnswer) => sum + itemAnswer.points, 0);
        const allAnswersRevealed = updatedRound.answers.length > 0 && updatedRound.answers.every((item) => item.revealed);

        if (previous.stealMode && previous.activeTeam && nextRevealed) {
          next = awardAndEndTurn(next, previous.activeTeam, total);
          return next;
        }

        if (nextRevealed && allAnswersRevealed && previous.activeTeam) {
          next = awardAndEndTurn(next, previous.activeTeam, total);
          return next;
        }

        if (nextRevealed) {
          next = withRestartedTimer(next);
        }

        return next;
      });
    },

    awardRevealedToTeam(team) {
      setState((previous) => {
        if (!previous.activeTeam || previous.activeTeam !== team) return previous;
        const round = previous.rounds[previous.currentRoundIndex];
        const total = round.answers
          .filter((answer) => answer.revealed)
          .reduce((sum, answer) => sum + answer.points, 0);
        return awardAndEndTurn(previous, team, total);
      });
    },

    addError() {
      setState((previous) => applyErrorState(previous, { at: Date.now(), restartTimer: true }));
    },

    resetErrors() {
      setState((previous) => ({ ...previous, errors: { A: 0, B: 0 } }));
    },

    buzz(team) {
      setState((previous) => {
        if (previous.buzzedTeam) return previous;
        return {
          ...previous,
          buzzedTeam: team,
          ownerTeam: team,
          activeTeam: team,
          stealMode: false,
          events: {
            ...previous.events,
            buzz: { id: Date.now(), team, at: Date.now() },
          },
        };
      });
    },

    resetBuzzer() {
      setState((previous) => clearTurn(previous));
    },

    setPhase(phase) {
      setState((previous) => ({ ...previous, phase }));
    },

    startTimer() {
      setState((previous) => {
        const current = getTimerSeconds(previous);
        if (current <= 0 || previous.timerEndsAt) return previous;
        return {
          ...previous,
          timerSeconds: current,
          timerEndsAt: Date.now() + current * 1000,
        };
      });
    },

    stopTimer() {
      setState((previous) => {
        if (!previous.timerEndsAt) return previous;
        return {
          ...previous,
          timerSeconds: getTimerSeconds(previous),
          timerEndsAt: null,
        };
      });
    },

    resetTimer() {
      setState((previous) => ({ ...previous, timerSeconds: INITIAL_TIMER, timerEndsAt: null }));
    },

    resetCurrentRound() {
      setState((previous) => ({
        ...clearTurn(previous),
        rounds: previous.rounds.map((round, index) =>
          index === previous.currentRoundIndex
            ? { ...round, answers: round.answers.map((answer) => ({ ...answer, revealed: false })) }
            : round
        ),
        phase: 'normal',
        timerSeconds: INITIAL_TIMER,
        timerEndsAt: null,
      }));
    },

    resetGame() {
      setState(createInitialState());
    },

    setIsEditMode(value) {
      setState((previous) => ({ ...previous, isEditMode: value }));
    },

    setTeamName(team, value) {
      setState((previous) => ({
        ...previous,
        teamNames: {
          ...previous.teamNames,
          [team]: value || `Equipe ${team}`,
        },
      }));
    },

    updateQuestion(value) {
      updateCurrentRound((round) => ({ ...round, question: value }));
    },

    updateAnswerText(answerIndex, value) {
      updateCurrentRound((round) => ({
        ...round,
        answers: round.answers.map((answer, index) =>
          index === answerIndex ? { ...answer, text: value } : answer
        ),
      }));
    },

    updateAnswerPoints(answerIndex, value) {
      updateCurrentRound((round) => ({
        ...round,
        answers: round.answers.map((answer, index) =>
          index === answerIndex ? { ...answer, points: value } : answer
        ),
      }));
    },

    addAnswer() {
      updateCurrentRound((round) => ({
        ...round,
        answers: [...round.answers, { text: 'Nouvelle reponse', points: 5, revealed: false }],
      }));
    },

    addRound() {
      setState((previous) => {
        const rounds = [
          ...previous.rounds,
          {
            question: 'Nouvelle manche - modifiez la question',
            answers: [
              { text: 'Reponse 1', points: 20, revealed: false },
              { text: 'Reponse 2', points: 15, revealed: false },
            ],
          },
        ];

        return {
          ...clearTurn(previous),
          rounds,
          currentRoundIndex: rounds.length - 1,
          phase: 'normal',
          timerSeconds: INITIAL_TIMER,
          timerEndsAt: null,
        };
      });
    },

    deleteCurrentRound() {
      setState((previous) => {
        if (previous.rounds.length <= 1) return previous;

        const rounds = previous.rounds.filter((_, index) => index !== previous.currentRoundIndex);
        const nextIndex = Math.min(previous.currentRoundIndex, rounds.length - 1);

        return {
          ...clearTurn(previous),
          rounds,
          currentRoundIndex: nextIndex,
          phase: 'normal',
          timerSeconds: INITIAL_TIMER,
          timerEndsAt: null,
        };
      });
    },
  };

  const value = {
    state,
    actions,
    currentRound,
    revealedTotal,
    timerSeconds: getTimerSeconds(state, now),
    timerRunning: Boolean(state.timerEndsAt),
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used inside GameProvider');
  }
  return context;
}
