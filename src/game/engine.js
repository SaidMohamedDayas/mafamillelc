import { createInitialRounds } from '../data/defaultRounds.js';

const isTeam = (team) => team === 'A' || team === 'B';
const scoreKey = (team) => `team${team}`;
const otherTeam = (team) => team === 'A' ? 'B' : 'A';
const validNumber = (value, max = 1000000000000) => Number.isSafeInteger(value) && value >= 0 && value <= max;
export const emptyEvents = () => ({ buzz: null, error: null, roundWin: null, gameWin: null });
export const revealedTotal = (round) => round.answers.reduce((sum, answer) => sum + (answer.revealed ? answer.points : 0), 0);
export const getTimerSeconds = (state, now = Date.now()) => state.timerEndsAt === null
  ? state.timerSeconds : Math.max(0, Math.ceil((state.timerEndsAt - now) / 1000));

export function createInitialState() {
  return {
    rounds: createInitialRounds().map((round) => ({ ...round, award: null, legacyReview: false })),
    scores: { teamA: 0, teamB: 0 }, teamNames: { A: 'Equipe A', B: 'Equipe B' },
    currentRoundIndex: 0, errors: { A: 0, B: 0 }, buzzedTeam: null,
    ownerTeam: null, activeTeam: null, stealMode: false, phase: 'normal',
    timerDuration: 20, timerSeconds: 20, timerEndsAt: null, autoError: true,
    screenMode: 'waiting', showFullscreenPrompt: false, isEditMode: false,
    events: emptyEvents(), undo: null,
  };
}

// Reject damaged payloads rather than partially replacing the question bank.
export function validateState(input, legacy = false, nested = false) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('État invalide');
  if (!Array.isArray(input.rounds) || !input.scores || !input.teamNames || !input.errors) throw new Error('Sauvegarde incomplète');
  const state = { ...createInitialState(), ...input };
  if (!Array.isArray(state.rounds) || !state.rounds.length || state.rounds.length > 500) throw new Error('Manches invalides');
  state.rounds = state.rounds.map((round) => {
    if (!round || typeof round.question !== 'string' || !Array.isArray(round.answers) || !round.answers.length || round.answers.length > 100) throw new Error('Question invalide');
    const answers = round.answers.map((answer) => {
      if (!answer || typeof answer.text !== 'string' || !validNumber(answer.points, 1000000) || typeof answer.revealed !== 'boolean') throw new Error('Réponse invalide');
      return { text: answer.text, points: answer.points, revealed: answer.revealed };
    });
    const award = round.award ?? null;
    if (award !== null && (typeof award !== 'object' || !isTeam(award.team) || !validNumber(award.points, 100000000))) throw new Error('Attribution invalide');
    return { question: round.question, answers, award,
      legacyReview: legacy ? answers.some((answer) => answer.revealed) : Boolean(round.legacyReview) };
  });
  if (!validNumber(state.currentRoundIndex, state.rounds.length - 1) ||
      !validNumber(state.scores?.teamA) || !validNumber(state.scores?.teamB) ||
      typeof state.teamNames?.A !== 'string' || typeof state.teamNames?.B !== 'string' ||
      !validNumber(state.errors?.A, 3) || !validNumber(state.errors?.B, 3) ||
      ![state.activeTeam, state.ownerTeam, state.buzzedTeam].every((team) => team === null || isTeam(team)) ||
      typeof state.stealMode !== 'boolean' || (state.stealMode && (!state.ownerTeam || state.activeTeam !== otherTeam(state.ownerTeam))) ||
      !validNumber(state.timerDuration, 3600) || state.timerDuration < 1 || !validNumber(state.timerSeconds, 3600) ||
      !(state.timerEndsAt === null || (Number.isSafeInteger(state.timerEndsAt) && state.timerEndsAt > 0)) ||
      typeof state.autoError !== 'boolean' || !['waiting', 'game'].includes(state.screenMode)) throw new Error('Partie invalide');
  // Editing is a local operator activity, never reopened automatically on reload.
  state.isEditMode = false;
  state.events = Object.fromEntries(Object.keys(emptyEvents()).map((key) => {
    const event = input.events?.[key];
    return [key, event && Number.isFinite(event.at) && (isTeam(event.team) || (key === 'gameWin' && event.team === null)) ? event : null];
  }));
  state.undo = !legacy && !nested && input.undo ? {
    label: String(input.undo.label), state: validateState(input.undo.state, false, true),
  } : null;
  if (legacy) {
    state.timerSeconds = getTimerSeconds(state);
    state.timerEndsAt = null;
    state.screenMode = 'waiting';
    state.events = emptyEvents();
  }
  return state;
}

function clearTurn(state) {
  return { ...state, errors: { A: 0, B: 0 }, buzzedTeam: null, ownerTeam: null,
    activeTeam: null, stealMode: false, timerSeconds: state.timerDuration, timerEndsAt: null };
}
function restartTimer(state, at) {
  return state.activeTeam ? { ...state, timerSeconds: state.timerDuration, timerEndsAt: at + state.timerDuration * 1000 } : state;
}
function awardRound(state, team, at) {
  const round = state.rounds[state.currentRoundIndex];
  if (!isTeam(team) || round.award || round.legacyReview) return state;
  const points = revealedTotal(round);
  const scores = { ...state.scores, [scoreKey(team)]: state.scores[scoreKey(team)] + points };
  if (!validNumber(scores[scoreKey(team)])) return state;
  const rounds = state.rounds.map((item, index) => index === state.currentRoundIndex ? { ...item, award: { team, points } } : item);
  return { ...clearTurn(state), scores, rounds, events: { ...state.events,
    roundWin: { id: at, team, at },
    gameWin: rounds.every((item) => item.award) ? { id: at, at,
      team: scores.teamA === scores.teamB ? null : scores.teamA > scores.teamB ? 'A' : 'B' } : null,
  } };
}
function applyError(state, at) {
  const round = state.rounds[state.currentRoundIndex];
  if (!state.activeTeam || round.award || round.legacyReview) return { ...state, timerSeconds: 0, timerEndsAt: null };
  const team = state.activeTeam;
  const errors = { ...state.errors, [team]: Math.min(3, state.errors[team] + 1) };
  let next = { ...state, errors, events: { ...state.events, error: { id: at, at, team } } };
  if (state.stealMode) return awardRound(next, state.ownerTeam, at);
  if (errors[team] >= 3) {
    next = { ...next, activeTeam: otherTeam(team), buzzedTeam: otherTeam(team), stealMode: true,
      errors: { ...errors, [otherTeam(team)]: 0 } };
  }
  return restartTimer(next, at);
}
function replaceRound(state, round) {
  return { ...state, rounds: state.rounds.map((item, index) => index === state.currentRoundIndex ? round : item) };
}

function transition(state, action, at) {
  const round = state.rounds[state.currentRoundIndex];
  const closed = Boolean(round.award || round.legacyReview);
  switch (action.type) {
    case 'setRoundIndex':
      if (!validNumber(action.value, state.rounds.length - 1) || action.value === state.currentRoundIndex) return state;
      return { ...clearTurn(state), currentRoundIndex: action.value, screenMode: 'waiting', events: emptyEvents() };
    case 'toggleAnswer': {
      if (closed || !round.answers[action.value] || round.answers[action.value].revealed) return state;
      const updated = { ...round, answers: round.answers.map((answer, index) => index === action.value ? { ...answer, revealed: true } : answer) };
      const next = replaceRound(state, updated);
      if (state.activeTeam && (state.stealMode || updated.answers.every((answer) => answer.revealed))) return awardRound(next, state.activeTeam, at);
      return restartTimer(next, at);
    }
    case 'awardRevealedToTeam':
      return !closed && state.activeTeam === action.value ? awardRound(state, action.value, at) : state;
    case 'buzz':
      if (closed || !isTeam(action.value) || state.stealMode || state.activeTeam === action.value) return state;
      // Correcting the initial hand also stops its timer and clears its errors.
      return { ...clearTurn(state), activeTeam: action.value, ownerTeam: action.value, buzzedTeam: action.value,
        events: { ...state.events, buzz: { id: at, at, team: action.value } } };
    case 'addError': return !closed && state.activeTeam ? applyError(state, at) : state;
    case 'expireTimer':
      if (state.timerEndsAt === null || action.deadline !== state.timerEndsAt || getTimerSeconds(state, at) > 0) return state;
      return state.autoError ? applyError(state, at) : { ...state, timerSeconds: 0, timerEndsAt: null };
    case 'resetErrors': return closed ? state : { ...state, errors: { A: 0, B: 0 } };
    case 'resetBuzzer': return clearTurn(state);
    case 'startTimer':
      if (closed || state.timerEndsAt !== null || state.timerSeconds <= 0) return state;
      return { ...state, timerEndsAt: at + state.timerSeconds * 1000 };
    case 'stopTimer': return state.timerEndsAt === null ? state : { ...state, timerSeconds: getTimerSeconds(state, at), timerEndsAt: null };
    case 'resetTimer': return { ...state, timerSeconds: state.timerDuration, timerEndsAt: null };
    case 'setTimerDuration':
      return state.timerEndsAt !== null || !validNumber(action.value, 3600) || action.value < 1 ? state : { ...state, timerDuration: action.value, timerSeconds: action.value };
    case 'setAutoError': return { ...state, autoError: Boolean(action.value) };
    case 'setScreenMode':
      return ['waiting', 'game'].includes(action.value) ? { ...state, screenMode: action.value,
        ...(action.value === 'waiting' ? { timerSeconds: getTimerSeconds(state, at), timerEndsAt: null } : {}) } : state;
    case 'setShowFullscreenPrompt': return { ...state, showFullscreenPrompt: Boolean(action.value) };
    case 'setScore': {
      if (!isTeam(action.team) || !validNumber(action.value, 1000000000)) return state;
      const scores = { ...state.scores, [scoreKey(action.team)]: action.value };
      return { ...state, scores, events: { ...state.events, gameWin: state.rounds.every((item) => item.award)
        ? { id: at, at, team: scores.teamA === scores.teamB ? null : scores.teamA > scores.teamB ? 'A' : 'B' } : null } };
    }
    case 'resetCurrentRound': {
      if (!action.confirmed) return state;
      const scores = { ...state.scores };
      if (round.award) scores[scoreKey(round.award.team)] = Math.max(0, scores[scoreKey(round.award.team)] - round.award.points);
      return { ...clearTurn(replaceRound(state, { ...round, award: null, legacyReview: false,
        answers: round.answers.map((answer) => ({ ...answer, revealed: false })) })), scores, screenMode: 'waiting', events: emptyEvents() };
    }
    case 'resetGame':
      return !action.confirmed ? state : { ...createInitialState(), teamNames: state.teamNames,
        timerDuration: state.timerDuration, timerSeconds: state.timerDuration, autoError: state.autoError,
        rounds: state.rounds.map((item) => ({ ...item, award: null, legacyReview: false,
          answers: item.answers.map((answer) => ({ ...answer, revealed: false })) })) };
    case 'setIsEditMode': return { ...state, isEditMode: Boolean(action.value) };
    case 'setTeamName': return isTeam(action.team) && typeof action.value === 'string' ? { ...state, teamNames: { ...state.teamNames, [action.team]: action.value || `Equipe ${action.team}` } } : state;
    case 'updateQuestion': return typeof action.value === 'string' ? replaceRound(state, { ...round, question: action.value }) : state;
    case 'updateAnswerText': case 'updateAnswerPoints': {
      if (closed || !round.answers[action.index]) return state;
      if (action.type === 'updateAnswerPoints' && !validNumber(action.value, 1000000)) return state;
      if (action.type === 'updateAnswerText' && typeof action.value !== 'string') return state;
      return replaceRound(state, { ...round, answers: round.answers.map((answer, index) => index === action.index ? { ...answer, [action.type === 'updateAnswerText' ? 'text' : 'points']: action.value } : answer) });
    }
    case 'addAnswer': return closed || round.answers.length >= 100 ? state : replaceRound(state, { ...round, answers: [...round.answers, { text: '', points: 0, revealed: false }] });
    case 'addRound':
      return state.rounds.length >= 500 ? state : { ...clearTurn(state), rounds: [...state.rounds, { question: '', answers: [{ text: '', points: 0, revealed: false }], award: null, legacyReview: false }], currentRoundIndex: state.rounds.length, screenMode: 'waiting', events: emptyEvents() };
    case 'deleteCurrentRound':
      if (!action.confirmed || closed || state.rounds.length <= 1) return state;
      return { ...clearTurn(state), rounds: state.rounds.filter((_, index) => index !== state.currentRoundIndex), currentRoundIndex: Math.min(state.currentRoundIndex, state.rounds.length - 2), screenMode: 'waiting', events: emptyEvents() };
    default: return state;
  }
}

const labels = { toggleAnswer: 'révélation', awardRevealedToTeam: 'attribution des points', addError: 'erreur', expireTimer: 'expiration du chrono', resetCurrentRound: 'réinitialisation de manche', resetGame: 'réinitialisation du jeu', setScore: 'correction du score', buzz: 'attribution de la main' };
const presentationActions = new Set(['setScreenMode', 'setShowFullscreenPrompt', 'setIsEditMode']);
export function reduceGame(state, action, at = Date.now()) {
  if (action.type === 'undo') {
    if (!state.undo) return state;
    return { ...state.undo.state, screenMode: state.screenMode, showFullscreenPrompt: state.showFullscreenPrompt,
      isEditMode: false, timerEndsAt: null, events: emptyEvents(), undo: null };
  }
  const next = transition(state, action, at);
  if (next === state) return state;
  if (presentationActions.has(action.type)) return next;
  const { undo: _undo, ...snapshot } = state;
  return { ...next, undo: { label: labels[action.type] || 'modification',
    state: { ...snapshot, undo: null, timerSeconds: getTimerSeconds(state, at), timerEndsAt: null } } };
}
