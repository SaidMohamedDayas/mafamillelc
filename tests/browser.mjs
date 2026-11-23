// Optional browser verification, using an existing Playwright installation.
// PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs npm run test:browser
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true,
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }) });
const base = process.env.TEST_URL || 'http://127.0.0.1:5173';
const artifacts = process.env.ARTIFACT_DIR || '/tmp/mafamillelc-verification';
await mkdir(artifacts, { recursive: true });
const errors = [];
let checks = 0;
const check = (description) => { checks++; console.log(`OK ${checks}: ${description}`); };
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
context.on('page', (page) => page.on('pageerror', (error) => errors.push(error.message)));
await context.addInitScript(() => {
  window.gameWrites = 0;
  const setItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    if (key === 'famille-or-state-v3') window.gameWrites++;
    return setItem.call(this, key, value);
  };
});
const save = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('famille-or-state-v3')));
const waitState = (page, expression) => page.waitForFunction((source) => {
  const state = JSON.parse(localStorage.getItem('famille-or-state-v3'))?.state;
  return state && new Function('state', `return (${source})`)(state);
}, expression);
try {
  const control = await context.newPage();
  const screen = await context.newPage();
  await control.goto(`${base}/control`);
  await screen.goto(base);
  await screen.getByRole('heading', { name: 'Ma Famille LC' }).waitFor();
  assert.equal(await screen.getByRole('button').count(), 0);
  assert.equal(await screen.evaluate(() => localStorage.getItem('famille-or-state-v3')), null);
  check('startup waiting screen has no commands and does not overwrite storage');

  await control.getByRole('button', { name: 'Afficher la manche 1', exact: true }).click();
  await waitState(screen, "state.screenMode === 'game'");
  const state = (await save(control)).state;
  await screen.getByText(state.rounds[0].question, { exact: true }).waitFor();
  assert.equal(await screen.getByRole('button').count(), 0);
  assert.equal(await screen.getByText(state.rounds[0].answers[0].text, { exact: true }).count(), 0);
  check('projection shows question, conceals answers and contains no game buttons');

  await control.getByRole('button', { name: 'Main à Equipe A', exact: true }).click();
  await control.getByRole('button').filter({ hasText: `1. ${state.rounds[0].answers[0].text}` }).click();
  await waitState(control, 'state.rounds[0].answers[0].revealed');
  await screen.getByText(state.rounds[0].answers[0].text, { exact: true }).waitFor();
  await control.getByRole('button', { name: /^Annuler révélation$/ }).click();
  await waitState(control, '!state.rounds[0].answers[0].revealed');
  assert.equal((await save(control)).state.timerEndsAt, null);
  check('reveal synchronizes; undo hides the answer and pauses timer');

  await control.getByRole('button').filter({ hasText: `1. ${state.rounds[0].answers[0].text}` }).click();
  await control.getByRole('button', { name: /^Attribuer .* à Equipe A$/ }).click();
  await waitState(control, 'Boolean(state.rounds[0].award)');
  const points = state.rounds[0].answers[0].points;
  assert.equal((await save(screen)).state.scores.teamA, points);
  await control.reload();
  await control.getByText(`Manche clôturée : ${points} points`, { exact: false }).waitFor();
  assert.equal(await control.getByRole('button', { name: 'Main à Equipe A', exact: true }).isDisabled(), true);
  await control.getByRole('button', { name: /^Annuler attribution des points$/ }).click();
  await waitState(control, 'state.scores.teamA === 0 && !state.rounds[0].award');
  check('award survives reload, blocks double credit, and can be undone after reload');

  await control.getByRole('spinbutton', { name: 'Score Equipe B', exact: true }).fill('123');
  await control.getByRole('button', { name: 'Corriger', exact: true }).last().click();
  await waitState(screen, 'state.scores.teamB === 123');
  await control.getByRole('button', { name: /^Annuler correction du score$/ }).click();
  await waitState(control, 'state.scores.teamB === 0');
  check('manual score correction synchronizes and is undoable');

  await control.getByRole('button', { name: /Mode edition/ }).click();
  await control.getByRole('textbox', { name: 'Question', exact: true }).fill(`${state.rounds[0].question} [corrigée]`);
  await control.getByRole('button', { name: 'Fermer', exact: true }).click();
  await control.reload();
  await control.getByRole('button', { name: /Mode edition/ }).click();
  assert.equal(await control.getByRole('textbox', { name: 'Question', exact: true }).inputValue(), `${state.rounds[0].question} [corrigée]`);
  await control.getByRole('button', { name: 'Fermer', exact: true }).click();
  check('edited question survives reload; editor stays local');

  await control.getByRole('button', { name: 'Suivante', exact: true }).click();
  await screen.getByRole('heading', { name: 'Ma Famille LC' }).waitFor();
  const nextQuestion = (await save(control)).state.rounds[1].question;
  assert.equal(await screen.getByText(nextQuestion, { exact: true }).count(), 0);
  await control.getByRole('button', { name: 'Afficher la manche 2', exact: true }).click();
  await screen.getByText(nextQuestion, { exact: true }).waitFor();
  check('next round is prepared behind waiting screen until explicitly shown');

  const duration = control.getByRole('spinbutton', { name: 'Durée du chrono (secondes)' });
  await duration.fill('2');
  await control.getByRole('button', { name: 'Appliquer la durée', exact: true }).click();
  await control.getByRole('button', { name: 'Main à Equipe A', exact: true }).click();
  await control.getByRole('button', { name: /^2s$/ }).click();
  await waitState(control, 'state.errors.A === 1');
  await control.getByRole('button', { name: 'Pause', exact: true }).click();
  assert.equal((await save(control)).state.errors.A, 1);
  check('real timer expires exactly once with control and public tabs open');

  const secondControl = await context.newPage();
  await secondControl.goto(`${base}/control`);
  await control.getByRole('button', { name: 'Reset', exact: true }).click();
  await duration.fill('1');
  await control.getByRole('button', { name: 'Appliquer la durée', exact: true }).click();
  await control.getByRole('button', { name: /^1s$/ }).click();
  await waitState(control, 'state.errors.A === 2');
  await control.getByRole('button', { name: 'Pause', exact: true }).click();
  assert.equal((await save(control)).state.errors.A, 2);
  assert.equal(await screen.evaluate(() => window.gameWrites), 0);
  check('two real control tabs serialize expiration; projection never writes');

  await control.getByRole('checkbox', { name: 'Erreur automatique à l’expiration' }).click();
  await waitState(control, '!state.autoError');
  await control.getByRole('button', { name: 'Reset', exact: true }).click();
  await control.getByRole('button', { name: /^1s$/ }).click();
  await waitState(control, 'state.timerSeconds === 0 && state.timerEndsAt === null');
  assert.equal((await save(control)).state.errors.A, 2);
  check('timer without automatic sanction stops at zero and preserves errors');

  await control.getByRole('button', { name: 'Proposer le plein écran', exact: true }).click();
  await screen.bringToFront();
  await screen.getByRole('button', { name: 'Passer la projection en plein écran' }).click();
  await screen.waitForFunction(() => Boolean(document.fullscreenElement));
  await screen.evaluate(() => document.exitFullscreen());
  await screen.getByRole('button', { name: 'Masquer l’invitation' }).click();
  assert.equal(await screen.getByRole('button').count(), 0);
  check('regie fullscreen prompt uses local projection gesture and disappears');

  const beforeReset = await save(control);
  control.once('dialog', (dialog) => dialog.dismiss());
  await control.getByRole('button', { name: /reset complet/ }).click();
  assert.equal((await save(control)).revision, beforeReset.revision);
  control.once('dialog', (dialog) => dialog.accept());
  await control.getByRole('button', { name: /reset complet/ }).click();
  await waitState(control, 'state.currentRoundIndex === 0 && state.scores.teamA === 0 && state.scores.teamB === 0');
  await screen.getByRole('heading', { name: 'Ma Famille LC' }).waitFor();
  assert.equal((await save(control)).state.rounds[0].question, `${state.rounds[0].question} [corrigée]`);
  check('complete reset requires confirmation and keeps edited questions');

  await control.setViewportSize({ width: 390, height: 844 });
  assert.equal(await control.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await control.screenshot({ path: `${artifacts}/control-mobile.png`, fullPage: true });
  await control.setViewportSize({ width: 1440, height: 1000 });
  await control.screenshot({ path: `${artifacts}/control.png`, fullPage: true });
  await screen.screenshot({ path: `${artifacts}/projection-waiting.png` });
  await control.getByRole('button', { name: 'Afficher la manche 1', exact: true }).click();
  await screen.getByText(`${state.rounds[0].question} [corrigée]`, { exact: true }).waitFor();
  await screen.waitForTimeout(350);
  await screen.screenshot({ path: `${artifacts}/projection-game.png` });
  assert.equal(await screen.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await screen.setViewportSize({ width: 1280, height: 720 });
  await screen.waitForTimeout(300);
  const bounds = await screen.locator('.projection-frame').boundingBox();
  assert.ok(bounds && bounds.y >= 0 && bounds.y + bounds.height <= 720, `Projection clipped at 720p: ${JSON.stringify(bounds)}`);
  await screen.screenshot({ path: `${artifacts}/projection-720p.png` });
  for (let index = 0; index < state.rounds.length; index++) {
    await control.evaluate((index) => {
      const stored = JSON.parse(localStorage.getItem('famille-or-state-v3'));
      stored.revision++;
      stored.state.currentRoundIndex = index;
      stored.state.rounds[index].answers.forEach((answer) => { answer.revealed = true; });
      localStorage.setItem('famille-or-state-v3', JSON.stringify(stored));
    }, index);
    await screen.getByText((await save(control)).state.rounds[index].question, { exact: true }).waitFor();
    await screen.waitForTimeout(300);
    const board = await screen.locator('.projection-frame').boundingBox();
    assert.ok(board && board.y >= 0 && board.y + board.height <= 720, `Round ${index + 1} clipped: ${JSON.stringify(board)}`);
  }
  check('all existing rounds with revealed answers fit the 720p projection');
  assert.deepEqual(errors, []);
  check('mobile regie and desktop projection have no horizontal overflow or React runtime error');
  console.log(`${checks} browser scenarios passed. Artifacts: ${artifacts}`);
} catch (error) {
  console.error('Browser diagnostic:', await Promise.all(context.pages().map(async (page) => ({ url: page.url(), text: (await page.locator('body').innerText()).slice(-1600) }))));
  throw error;
} finally { await browser.close(); }
