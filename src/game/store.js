import { createInitialState, reduceGame, validateState } from './engine.js';

export const STORAGE_KEY = 'famille-or-state-v3';
export const LEGACY_KEY = 'famille-or-state-v2';
const VERSION = 3;
export const LOCK_NAME = 'famille-or-game-write';

export function decodeSave(raw) {
  const envelope = JSON.parse(raw);
  if (envelope?.version !== VERSION || !Number.isSafeInteger(envelope.revision) || envelope.revision < 0) throw new Error('Version incompatible');
  return { revision: envelope.revision, state: validateState(envelope.state) };
}
export function readSave(storage) {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw !== null) return decodeSave(raw);
  const legacy = storage.getItem(LEGACY_KEY);
  return { revision: 0, state: legacy === null ? createInitialState() : validateState(JSON.parse(legacy), true) };
}

// No effect writes on mount or on reception. Only a serialized command can save.
export function createGameStore({ storage, locks, canWrite, subscribeStorage, onChange }) {
  let current;
  let issue = '';
  let blocked = false;
  try { current = readSave(storage); }
  catch { current = { revision: 0, state: createInitialState() }; blocked = true;
    issue = 'Sauvegarde illisible, incompatible ou stockage inaccessible. Données conservées ; commandes bloquées. Exportez la sauvegarde avant une réinitialisation complète.'; }
  if (canWrite && !locks?.request) issue = 'Commandes indisponibles : utilisez un navigateur récent sur localhost ou HTTPS (Web Locks requis).';
  const publish = () => onChange?.({ ...current, issue, blocked });
  const refresh = () => {
    try {
      // Read the latest value: queued storage events may carry an obsolete value.
      const next = readSave(storage);
      if (next.revision < current.revision) throw new Error('Sauvegarde supprimée ou remplacée');
      current = next; blocked = false; issue = canWrite && !locks?.request
        ? 'Commandes indisponibles : utilisez un navigateur récent sur localhost ou HTTPS (Web Locks requis).' : ''; publish();
    } catch {
      blocked = true; issue = 'Synchronisation interrompue : sauvegarde invalide ou inaccessible. Dernier état valide conservé.'; publish();
    }
  };
  const unsubscribe = subscribeStorage?.((event) => {
    if (event.key === STORAGE_KEY || event.key === LEGACY_KEY || event.key === null) refresh();
  });
  return {
    getSnapshot: () => ({ ...current, issue, blocked }),
    refresh,
    dispose: () => unsubscribe?.(),
    async dispatch(action) {
      if (!canWrite || !locks?.request) return false;
      try {
        return await locks.request(LOCK_NAME, () => {
          let latest;
          try {
            latest = readSave(storage);
            if (latest.revision < current.revision) throw new Error('Sauvegarde supprimée ou remplacée');
          }
          catch (error) {
            if (action.type !== 'resetGame' || !action.confirmed) throw error;
            // Explicit recovery preserves the original bytes before replacing them.
            for (const key of [STORAGE_KEY, LEGACY_KEY]) {
              const raw = storage.getItem(key);
              if (raw !== null) storage.setItem(`${key}-recovery-${Date.now()}`, raw);
            }
            latest = current;
          }
          if (action.expectedRevision !== undefined && action.expectedRevision !== latest.revision) {
            current = latest; issue = 'Action ignorée : la partie a changé pendant votre intervention. Vérifiez l’état puis recommencez.'; publish(); return false;
          }
          const round = latest.state.rounds[latest.state.currentRoundIndex];
          if (action.expectedRoundIndex !== undefined && (action.expectedRoundIndex !== latest.state.currentRoundIndex || action.expectedRoundQuestion !== round.question)) {
            current = latest; issue = 'Action ignorée : la manche a changé dans une autre régie. Vérifiez la manche affichée.'; publish(); return false;
          }
          const next = reduceGame(latest.state, action);
          if (next === latest.state) {
            current = latest; publish(); return false;
          }
          const envelope = { version: VERSION, revision: latest.revision + 1, state: next };
          // Persist before publishing. A quota/access failure never looks successful.
          storage.setItem(STORAGE_KEY, JSON.stringify(envelope));
          current = envelope; issue = ''; blocked = false; publish(); return true;
        });
      } catch {
        issue = 'Action non appliquée : sauvegarde impossible ou invalide. Vérifiez le stockage et exportez la partie.';
        publish(); return false;
      }
    },
    exportSave() {
      return JSON.stringify({ exportedAt: new Date().toISOString(), current,
        raw: storage.getItem(STORAGE_KEY), legacy: storage.getItem(LEGACY_KEY) }, null, 2);
    },
  };
}
