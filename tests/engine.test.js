import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, reduceGame, getTimerSeconds, validateState } from '../src/game/engine.js';

const at = 100000;
const act = (state, type, extra = {}, time = at) => reduceGame(state, { type, ...extra }, time);
const ready = () => act(act(createInitialState(), 'setScreenMode', { value: 'game' }), 'buzz', { value: 'A' });
const reveal = (state, index) => act(state, 'toggleAnswer', { value: index });

test('manual and repeated attribution: one ledger entry and one score increment', () => {
  let state = reveal(ready(), 0);
  const points = state.rounds[0].answers[0].points;
  state = act(state, 'awardRevealedToTeam', { value: 'A' });
  assert.equal(state.scores.teamA, points);
  assert.deepEqual(state.rounds[0].award, { team: 'A', points });
  for (const action of [{ type: 'awardRevealedToTeam', value: 'A' }, { type: 'buzz', value: 'B' }, { type: 'toggleAnswer', value: 1 }, { type: 'addError' }]) {
    assert.equal(reduceGame(state, action, at + 1), state);
  }
});
test('revealing all answers automatically awards exactly once', () => {
  let state = ready();
  state.rounds[0].answers.forEach((_, index) => { state = reveal(state, index); });
  assert.equal(state.scores.teamA, state.rounds[0].answers.reduce((n, a) => n + a.points, 0));
  assert.equal(state.activeTeam, null);
});
test('undo reveal restores hidden answer and a paused timer', () => {
  const before = ready();
  const state = act(reveal(before, 0), 'undo');
  assert.equal(state.rounds[0].answers[0].revealed, false);
  assert.deepEqual(state.scores, before.scores);
  assert.equal(state.activeTeam, 'A');
  assert.equal(state.timerEndsAt, null);
  assert.equal(state.undo, null);
});
test('undo automatic award restores score, ledger and final revealed answer together', () => {
  let state = ready();
  for (let i = 0; i < state.rounds[0].answers.length - 1; i++) state = reveal(state, i);
  const before = state;
  state = reveal(state, state.rounds[0].answers.length - 1);
  const undone = act(state, 'undo');
  assert.deepEqual(undone.scores, before.scores);
  assert.equal(undone.rounds[0].award, null);
  assert.equal(undone.rounds[0].answers.at(-1).revealed, false);
});
test('undo manual award and score correction restores the complete previous state', () => {
  const before = reveal(ready(), 0);
  const undone = act(act(before, 'awardRevealedToTeam', { value: 'A' }), 'undo');
  assert.deepEqual(undone.scores, before.scores);
  assert.equal(undone.rounds[0].award, null);
  const corrected = act(before, 'setScore', { team: 'B', value: 123 });
  assert.equal(corrected.scores.teamB, 123);
  assert.deepEqual(act(corrected, 'undo').scores, before.scores);
});
test('third error changes hand; failed steal gives the revealed bank to the owner', () => {
  let state = reveal(ready(), 0);
  for (let i = 0; i < 3; i++) state = act(state, 'addError', {}, at + i);
  assert.equal(state.activeTeam, 'B');
  assert.equal(state.ownerTeam, 'A');
  assert.equal(state.stealMode, true);
  assert.equal(act(state, 'buzz', { value: 'A' }), state);
  const result = act(state, 'addError', {}, at + 4);
  assert.equal(result.scores.teamA, state.rounds[0].answers[0].points);
  assert.equal(result.activeTeam, null);
});
test('successful steal awards all revealed points to the stealing team; undo restores steal', () => {
  let state = reveal(ready(), 0);
  for (let i = 0; i < 3; i++) state = act(state, 'addError');
  const result = reveal(state, 1);
  assert.equal(result.scores.teamB, state.rounds[0].answers[0].points + state.rounds[0].answers[1].points);
  const undo = act(result, 'undo');
  assert.equal(undo.scores.teamB, 0);
  assert.equal(undo.stealMode, true);
  assert.equal(undo.activeTeam, 'B');
});
test('configurable absolute timer, pause/resume and no sanction before deadline', () => {
  let state = act(ready(), 'setTimerDuration', { value: 7 });
  state = act(state, 'startTimer');
  assert.equal(state.timerEndsAt, at + 7000);
  assert.equal(getTimerSeconds(state, at + 2100), 5);
  assert.equal(act(state, 'expireTimer', { deadline: state.timerEndsAt }, at + 6000), state);
  const paused = act(state, 'stopTimer', {}, at + 2100);
  assert.equal(paused.timerSeconds, 5);
  assert.equal(paused.timerEndsAt, null);
  assert.equal(act(paused, 'startTimer', {}, at + 3000).timerEndsAt, at + 8000);
});
test('expiration has one sanction, old deadlines cannot sanction a restarted timer', () => {
  const state = act(ready(), 'startTimer');
  const deadline = state.timerEndsAt;
  const next = act(state, 'expireTimer', { deadline }, deadline);
  assert.equal(next.errors.A, 1);
  assert.equal(next.timerEndsAt, deadline + state.timerDuration * 1000);
  assert.equal(act(next, 'expireTimer', { deadline }, deadline + 1), next);
  const undo = act(next, 'undo', {}, deadline + 1);
  assert.equal(undo.errors.A, 0);
  assert.equal(undo.timerSeconds, 0);
  assert.equal(undo.timerEndsAt, null);
});
test('late resume sanctions once, no catch-up cascade', () => {
  const state = act(ready(), 'startTimer');
  const next = act(state, 'expireTimer', { deadline: state.timerEndsAt }, at + 3600000);
  assert.equal(next.errors.A, 1);
  assert.equal(getTimerSeconds(next, at + 3600000), state.timerDuration);
});
test('timer without sanction and timer without active team stop at zero', () => {
  let state = act(ready(), 'setAutoError', { value: false });
  state = act(state, 'startTimer');
  const next = act(state, 'expireTimer', { deadline: state.timerEndsAt }, state.timerEndsAt);
  assert.equal(next.timerSeconds, 0);
  assert.equal(next.timerEndsAt, null);
  assert.equal(next.errors.A, 0);
  state = act(createInitialState(), 'startTimer');
  assert.equal(act(state, 'expireTimer', { deadline: state.timerEndsAt }, state.timerEndsAt).timerEndsAt, null);
});
test('confirmed round reset removes its awarded points and keeps edited content', () => {
  let state = act(ready(), 'updateQuestion', { value: 'Texte modifié' });
  state = act(reveal(state, 0), 'awardRevealedToTeam', { value: 'A' });
  assert.equal(act(state, 'resetCurrentRound'), state);
  const reset = act(state, 'resetCurrentRound', { confirmed: true });
  assert.equal(reset.scores.teamA, 0);
  assert.equal(reset.rounds[0].question, 'Texte modifié');
  assert.equal(reset.rounds[0].award, null);
  assert.ok(reset.rounds[0].answers.every((a) => !a.revealed));
  assert.deepEqual(act(reset, 'undo').scores, state.scores);
});
test('full reset requires confirmation, preserves bank and names, and is undoable', () => {
  let state = reveal(ready(), 0);
  state = act(state, 'setTeamName', { team: 'A', value: 'Famille' });
  state = act(state, 'setScore', { team: 'B', value: 42 });
  assert.equal(act(state, 'resetGame'), state);
  const reset = act(state, 'resetGame', { confirmed: true });
  assert.deepEqual(reset.scores, { teamA: 0, teamB: 0 });
  assert.equal(reset.teamNames.A, 'Famille');
  assert.equal(reset.rounds.length, state.rounds.length);
  assert.equal(reset.screenMode, 'waiting');
  assert.deepEqual(act(reset, 'undo').scores, state.scores);
});
test('round navigation and waiting never expose the next question; waiting pauses timer', () => {
  const state = act(ready(), 'startTimer');
  const waiting = act(state, 'setScreenMode', { value: 'waiting' }, at + 3000);
  assert.equal(waiting.timerSeconds, 17);
  assert.equal(waiting.timerEndsAt, null);
  const next = act(state, 'setRoundIndex', { value: 1 });
  assert.equal(next.screenMode, 'waiting');
  assert.equal(next.currentRoundIndex, 1);
  assert.equal(next.activeTeam, null);
});
test('invalid indices, teams, durations and scores do not change state', () => {
  const state = ready();
  for (const action of [{ type: 'setRoundIndex', value: -1 }, { type: 'toggleAnswer', value: 999 }, { type: 'buzz', value: 'C' }, { type: 'setTimerDuration', value: 0 }, { type: 'setTimerDuration', value: 1.5 }, { type: 'setScore', team: 'A', value: -1 }, { type: 'updateAnswerPoints', index: 0, value: NaN }]) assert.equal(reduceGame(state, action), state);
});
test('legacy migration preserves data and locks ambiguous attribution instead of guessing', () => {
  const original = reveal(ready(), 0);
  original.scores.teamB = 99;
  const migrated = validateState(original, true);
  assert.equal(migrated.scores.teamB, 99);
  assert.equal(migrated.rounds[0].legacyReview, true);
  assert.equal(act(migrated, 'awardRevealedToTeam', { value: 'A' }), migrated);
  assert.equal(act(migrated, 'resetCurrentRound', { confirmed: true }).scores.teamB, 99);
});

test('legacy running timer resumes paused for operator review, without hidden penalties', () => {
  const state = ready();
  state.timerEndsAt = Date.now() + 10000;
  const migrated = validateState(state, true);
  assert.equal(migrated.timerEndsAt, null);
  assert.ok(migrated.timerSeconds <= 10 && migrated.timerSeconds > 0);
  assert.equal(migrated.screenMode, 'waiting');
  assert.equal(migrated.activeTeam, 'A');
  assert.equal(migrated.undo, null);
});
test('final winner is recalculated after manual score correction', () => {
  let state = ready();
  state.rounds = [state.rounds[0]];
  state = act(reveal(state, 0), 'awardRevealedToTeam', { value: 'A' });
  assert.equal(state.events.gameWin.team, 'A');
  state = act(state, 'setScore', { team: 'B', value: 999 });
  assert.equal(state.events.gameWin.team, 'B');
});
