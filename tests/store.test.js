import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameStore, STORAGE_KEY, LEGACY_KEY } from '../src/game/store.js';
import { createInitialState } from '../src/game/engine.js';

function environment() {
  const data = new Map();
  const listeners = new Set();
  let writes = 0;
  let queue = Promise.resolve();
  const locks = { request: (_name, task) => { const result = queue.then(task); queue = result.catch(() => {}); return result; } };
  const storage = { getItem: (key) => data.get(key) ?? null,
    setItem(key, value) { data.set(key, value); writes++; for (const listener of listeners) listener({ key, newValue: value }); } };
  const tab = (canWrite = true) => createGameStore({ storage, locks, canWrite,
    subscribeStorage(callback) { listeners.add(callback); return () => listeners.delete(callback); } });
  return { storage, data, tab, locks, writes: () => writes, emit: (event) => listeners.forEach((listener) => listener(event)) };
}
const send = (store, type, extra = {}) => store.dispatch({ type, ...extra });

test('refresh recovers edited questions, scores, revealed answers and active round', async () => {
  const env = environment();
  const control = env.tab();
  await send(control, 'setRoundIndex', { value: 2 });
  await send(control, 'updateQuestion', { value: 'Question corrigée' });
  await send(control, 'updateAnswerText', { index: 0, value: 'Réponse corrigée' });
  await send(control, 'setScore', { team: 'B', value: 150 });
  await send(control, 'toggleAnswer', { value: 0 });
  const reload = env.tab();
  assert.deepEqual(reload.getSnapshot().state, control.getSnapshot().state);
  assert.equal(reload.getSnapshot().state.currentRoundIndex, 2);
  assert.equal(reload.getSnapshot().state.rounds[2].answers[0].revealed, true);
  assert.equal(reload.getSnapshot().state.scores.teamB, 150);
  assert.equal(env.writes(), 5);
});
test('control updates projection without echo writes; stale event cannot roll back state', async () => {
  const env = environment();
  const control = env.tab();
  const screen = env.tab(false);
  assert.equal(env.writes(), 0);
  await send(control, 'setScore', { team: 'A', value: 10 });
  const stale = env.storage.getItem(STORAGE_KEY);
  await send(control, 'setScore', { team: 'A', value: 20 });
  env.emit({ key: STORAGE_KEY, newValue: stale });
  assert.equal(screen.getSnapshot().state.scores.teamA, 20);
  assert.equal(env.writes(), 2);
  assert.equal(await send(screen, 'setScore', { team: 'A', value: 999 }), false);
  assert.equal(env.writes(), 2);
});
test('concurrent controls cannot double-award a round', async () => {
  const env = environment();
  const a = env.tab(), b = env.tab();
  await send(a, 'buzz', { value: 'A' });
  await send(a, 'toggleAnswer', { value: 0 });
  const points = a.getSnapshot().state.rounds[0].answers[0].points;
  await Promise.all([send(a, 'awardRevealedToTeam', { value: 'A' }), send(b, 'awardRevealedToTeam', { value: 'A' })]);
  assert.equal(a.getSnapshot().state.scores.teamA, points);
  assert.equal(b.getSnapshot().state.scores.teamA, points);
  assert.equal(env.writes(), 3);
});
test('two controls and projection expire one deadline only once', async () => {
  const env = environment();
  const a = env.tab(), b = env.tab(), screen = env.tab(false);
  await send(a, 'buzz', { value: 'A' });
  const state = a.getSnapshot().state;
  state.timerEndsAt = Date.now() - 100;
  env.storage.setItem(STORAGE_KEY, JSON.stringify({ version: 3, revision: 2, state }));
  await Promise.all([a, b, screen].map((store) => send(store, 'expireTimer', { deadline: state.timerEndsAt })));
  assert.equal(a.getSnapshot().state.errors.A, 1);
  assert.equal(b.getSnapshot().state.errors.A, 1);
  assert.equal(screen.getSnapshot().state.errors.A, 1);
});
test('undo is saved and synchronized, including after a reload', async () => {
  const env = environment();
  const control = env.tab(), screen = env.tab(false);
  await send(control, 'setScore', { team: 'A', value: 80 });
  const reload = env.tab();
  await send(reload, 'undo');
  assert.equal(screen.getSnapshot().state.scores.teamA, 0);
  assert.equal(control.getSnapshot().state.undo, null);
});
test('missing storage starts safely without writing; v2 data migrates on first action', async () => {
  const env = environment();
  assert.equal(env.tab().getSnapshot().state.scores.teamA, 0);
  assert.equal(env.writes(), 0);
  const legacy = createInitialState();
  legacy.scores.teamB = 73;
  legacy.rounds[1].question = 'Modification conservée';
  delete legacy.timerDuration;
  env.data.set(LEGACY_KEY, JSON.stringify(legacy));
  const control = env.tab();
  assert.equal(control.getSnapshot().state.scores.teamB, 73);
  assert.equal(env.storage.getItem(STORAGE_KEY), null);
  await send(control, 'setScreenMode', { value: 'game' });
  assert.equal(JSON.parse(env.storage.getItem(STORAGE_KEY)).version, 3);
  assert.equal(env.storage.getItem(LEGACY_KEY), JSON.stringify(legacy));
});
test('invalid JSON, incompatible versions and invalid nested structures are preserved', async () => {
  for (const raw of ['{broken', JSON.stringify({ version: 99, state: {} }), JSON.stringify({ version: 3, revision: 1, state: { ...createInitialState(), rounds: [] } }), JSON.stringify({ version: 3, revision: 1, state: { ...createInitialState(), undo: { state: {} } } })]) {
    const env = environment();
    env.data.set(STORAGE_KEY, raw);
    const control = env.tab();
    assert.equal(control.getSnapshot().blocked, true);
    assert.equal(await send(control, 'buzz', { value: 'A' }), false);
    assert.equal(env.storage.getItem(STORAGE_KEY), raw);
    assert.equal(await send(control, 'resetGame', { confirmed: true }), true);
    assert.ok([...env.data.keys()].some((key) => key.startsWith(`${STORAGE_KEY}-recovery-`)));
  }
});
test('quota failure does not publish an unsaved score; no locks means read-only', async () => {
  const env = environment();
  const brokenStorage = { getItem: env.storage.getItem, setItem() { throw new Error('quota'); } };
  const store = createGameStore({ storage: brokenStorage, locks: env.locks, canWrite: true });
  assert.equal(await send(store, 'setScore', { team: 'A', value: 50 }), false);
  assert.equal(store.getSnapshot().state.scores.teamA, 0);
  assert.match(store.getSnapshot().issue, /Action non appliquée/);
  const unsupported = createGameStore({ storage: env.storage, canWrite: true });
  assert.equal(await send(unsupported, 'buzz', { value: 'A' }), false);
  assert.match(unsupported.getSnapshot().issue, /Web Locks/);
});
test('storage access denial is handled without throwing during load or commands', async () => {
  const store = createGameStore({ storage: { getItem() { throw new Error('denied'); } }, canWrite: true, locks: environment().locks });
  assert.equal(store.getSnapshot().blocked, true);
  assert.equal(await send(store, 'buzz', { value: 'A' }), false);
});

test('deleting or downgrading storage keeps the last valid state and blocks writes', async () => {
  const env = environment();
  const control = env.tab();
  await send(control, 'setScore', { team: 'A', value: 40 });
  env.data.delete(STORAGE_KEY);
  env.emit({ key: STORAGE_KEY, newValue: null });
  assert.equal(control.getSnapshot().state.scores.teamA, 40);
  assert.equal(control.getSnapshot().blocked, true);
  assert.equal(await send(control, 'buzz', { value: 'A' }), false);
  assert.equal(await send(control, 'resetGame', { confirmed: true }), true);
  assert.equal(control.getSnapshot().state.scores.teamA, 0);
});
test('stale round commands cannot reveal an answer on a different prepared round', async () => {
  const env = environment();
  const a = env.tab(), b = env.tab();
  const question = a.getSnapshot().state.rounds[0].question;
  await send(b, 'setRoundIndex', { value: 1 });
  assert.equal(await send(a, 'toggleAnswer', { value: 0, expectedRoundIndex: 0, expectedRoundQuestion: question }), false);
  assert.equal(a.getSnapshot().state.rounds[1].answers[0].revealed, false);
});

test('undo and confirmed reset reject a stale displayed revision', async () => {
  const env = environment();
  const a = env.tab(), b = env.tab();
  await send(a, 'setScore', { team: 'A', value: 10 });
  const oldRevision = a.getSnapshot().revision;
  await send(b, 'setScore', { team: 'B', value: 20 });
  assert.equal(await send(a, 'undo', { expectedRevision: oldRevision }), false);
  assert.equal(await send(a, 'resetGame', { confirmed: true, expectedRevision: oldRevision }), false);
  assert.deepEqual(a.getSnapshot().state.scores, { teamA: 10, teamB: 20 });
});
