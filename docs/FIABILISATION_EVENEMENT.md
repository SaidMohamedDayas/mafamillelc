# Audit et plan — 21 novembre 2026

Périmètre : répertoire courant `/Users/said/Dev/mafamillelc`. Son dossier `src`
est identique à celui de `mafamillelc-codex` au début de l'audit. Aucun changement
n'est effectué dans ce dernier ni dans le projet de référence.

## Constats avant modification

- React 19, Vite 6, Tailwind 3 ; pas de backend, de tests ni de script lint.
- `loadState()` retourne toujours les valeurs par défaut : un rafraîchissement
  écrase la partie sauvegardée. JSON reçu sans validation de structure.
- L'effet de sauvegarde réémet aussi les états reçus par `storage` : risque
  d'écrasements croisés. Les deux vues appliquent l'expiration du chrono.
- Aucun registre d'attribution par manche : reprendre la main après attribution
  permet de créditer à nouveau les réponses révélées.
- La remise à zéro d'une manche conserve ses points déjà attribués ; la remise
  à zéro générale supprime les modifications éditoriales sans confirmation.
- Le plateau propose des boutons de révélation et d'attribution des points.
- Pas d'annulation, d'attente pilotée ni de préparation masquée de la suite.
- Les commandes de main sont déjà logicielles, malgré leur nom « buzzer ».

## Référence Les Défis du Savoir

Étudiés : `src/utils/storage.js`, `src/context/GameContext.jsx`,
`src/components/FullscreenButton.jsx`, `src/pages/ScreenPage.jsx` et
`src/pages/ControlPage.jsx`. Approches reprises et adaptées : chargement protégé,
normalisation, absence de réémission des états reçus, échéance absolue du chrono,
modes de projection, invitation au plein écran déclenchée par geste local.
Le contexte et les règles des autres épreuves ne sont pas copiés.

## Plan priorisé

1. P0 : extraire les transitions de jeu testables ; sauvegarde versionnée et
   validée, migration de l'ancienne clé, écritures sérialisées entre régies.
2. P0 : registre des points par manche, annulation cohérente, corrections
   manuelles et réinitialisations confirmées préservant les questions.
3. P0 : projection en lecture seule, expiration exécutée par la régie et
   protégée contre les doublons et échéances obsolètes.
4. P1 : attente pilotée, navigation préparatoire masquée, plein écran, main A/B,
   durée configurable et sanction automatique indépendante.
5. Tests de transitions, persistance et concurrence, puis build et vérification
   des parcours dans deux onglets si un navigateur est disponible.

## Architecture livrée

- `src/game/engine.js` contient les transitions pures. Une manche conserve son
  attribution `{team, points}` et refuse toute nouvelle attribution. Le vol
  reste automatique après trois erreurs ; une bonne réponse au vol attribue
  la banque au voleur, une erreur l'attribue à l'équipe initiale.
- `src/game/store.js` charge et valide une enveloppe v3. Il ne sauvegarde ni au
  montage ni à réception d'un événement `storage`. Chaque commande relit le
  dernier état sous un verrou navigateur partagé, applique une transition et
  sauvegarde avant de publier le résultat. Les régies concurrentes sont ainsi
  sérialisées. Une commande portant sur une ancienne manche, une ancienne
  annulation ou une confirmation devenue obsolète est refusée explicitement.
- `GameContext.jsx` adapte ce stockage à React. La projection n'a aucun droit
  d'écriture. Seules les régies résolvent les expirations, sous le même verrou.
  L'échéance attendue empêche de sanctionner deux fois un même chrono. Les ticks
  d'affichage ne sont pas persistés. Le mode édition reste local à chaque régie.
- L'annulation conserve un seul état précédent, sauvegardé avec la partie.
  Scores, révélations, attribution, erreurs et main sont restaurés ensemble.
  Le chrono revient en pause ; après annulation d'une expiration à zéro, il faut
  le remettre à zéro pour repartir. Les commandes de présentation ne remplacent
  pas la dernière action annulable.
- La remise à zéro d'une manche retire le montant enregistré de son score
  d'équipe, sans passer sous zéro après une correction manuelle. Elle conserve
  question et réponses éditées. La remise à zéro générale conserve également
  les noms, les questions et la configuration du chrono. Ces deux opérations
  sont confirmées et annulables.
- Attente, navigation préparatoire masquée et invitation au plein écran sont
  pilotées en régie. Le passage effectif au plein écran exige un geste dans
  l'onglet de projection actif. Les seuls boutons publics sont ceux de cette
  invitation temporaire ; aucune commande de jeu n'est exposée.
- `ProjectionFrame.jsx` ajuste proportionnellement le plateau à la hauteur
  disponible sur vidéoprojecteur ; le mobile garde le défilement naturel.

## Sauvegardes et récupération

La clé `famille-or-state-v2` reste intacte. Si aucune v3 n'existe, elle est
migrée en mémoire, puis sauvegardée en v3 à la première commande valide. Les
scores, textes, révélations et manche active sont conservés. Le chrono hérité
est mis en pause et la projection passe en attente pour permettre la vérification. L'ancien format
ne mémorise pas les points déjà attribués : les manches comportant des réponses
révélées sont donc marquées « attribution inconnue ». Vérifier les scores avant
de les rejouer. Leur réinitialisation ne soustrait aucun montant supposé.

Une sauvegarde incompatible ou corrompue n'est jamais remplacée au démarrage.
Les commandes sont bloquées et une alerte est affichée en régie. L'export
contient l'état courant et les données brutes v2/v3. Une réinitialisation complète
explicitement confirmée copie les données brutes dans des clés de récupération
avant remplacement. Si cette copie ou l'écriture échoue (quota, refus d'accès),
l'action n'est pas appliquée. Une suppression externe en cours de partie garde
le dernier état valide à l'écran et bloque les nouvelles écritures jusqu'à
récupération ou réinitialisation confirmée.

## Exploitation le 25 novembre

1. Ouvrir les deux vues dans le même profil de navigateur et sur exactement
   la même origine (protocole, nom d'hôte et port). Préférer Chrome récent sur
   `localhost` ou HTTPS. Web Locks est nécessaire pour les commandes ; un
   navigateur incompatible affiche une alerte et reste en lecture seule.
2. Garder une régie `/control` ouverte. Ouvrir `/` sur l'écran public via
   « Ouvrir la projection ». L'attente masque question, réponses et animations.
3. Choisir la manche, vérifier les textes, les noms et la durée. Choisir
   séparément la sanction automatique. Afficher explicitement la manche.
4. Attribuer la main à A ou B. Pendant le vol, l'équipe est imposée par les
   règles. Une correction de main avant le vol remet erreurs et chrono à zéro.
5. Pour une erreur de manipulation récente, utiliser « Annuler ». Pour un score
   plus ancien, saisir le score absolu voulu et cliquer « Corriger ». Pour
   retirer une manche ancienne, utiliser sa réinitialisation confirmée : les
   points journalisés sont déduits du score courant, avec plancher à zéro.
6. L'attente met le chrono en pause ; l'affichage de la manche ne le redémarre
   pas automatiquement. Modifier la durée exige un chrono arrêté. Révélation
   et erreur relancent le chrono selon la règle existante.
7. Proposer le plein écran, cliquer dans la projection active, puis masquer
   l'invitation si nécessaire. Le raccourci du navigateur reste disponible.
8. Exporter la sauvegarde avant la séance et après les répétitions. Fermer tout
   ancien onglet utilisant une version antérieure de l'application.

## Fichiers modifiés ou ajoutés

- `src/game/engine.js`, `src/game/store.js` : règles et persistance.
- `src/context/GameContext.jsx` : adaptation React, synchronisation et chrono.
- `src/pages/ControlPage.jsx`, `src/components/EventControls.jsx` : régie.
- `src/pages/HomePage.jsx`, `src/components/AnswersBoard.jsx`,
  `src/components/ScoreBoard.jsx`, `src/components/FullscreenPrompt.jsx`,
  `src/components/ProjectionFrame.jsx` : projection et plein écran.
- `src/App.jsx` : suppression du tick global redondant, route `/control/` reconnue.
- `package.json`, `tests/engine.test.js`, `tests/store.test.js`,
  `tests/browser.mjs` : commandes et tests sans dépendance ajoutée à l'application.
- `README.md` et le présent rapport : utilisation, tests et limites.

## Vérifications

Résultats locaux du 21 novembre 2026 :

- `npm test` : **30 tests réussis, 0 échec**.
- `npm run test:browser` avec Playwright déjà installé et Chrome local :
  **14 scénarios réussis**, deux régies et une projection dans le même profil
  temporaire. Reprise, corrections, annulations, échéances concurrentes,
  plein écran après activation locale et confirmation de remise à zéro vérifiés.
- Les **12 manches existantes**, réponses révélées, tiennent dans un viewport
  de **1280 × 720**. Régie mobile vérifiée à **390 × 844**, projection également
  à **1440 × 1000**. Pas de débordement horizontal ni d'erreur JavaScript
  d'exécution relevée. Captures de régie et de projection inspectées.
- `npm run build` : **réussi**, Vite 6.4.1. Avertissement Browserslist sur
  l'ancienneté de sa base, sans échec de compilation ; dépendances inchangées.
- `git diff --check` : **réussi**. Aucun script lint n'existe dans ce projet.

`npm test` utilise le test runner Node intégré (Node 20+ recommandé). Les tests
couvrent reprise, synchronisation, concurrence, absence de boucle, double
comptage, vol réussi/raté, annulations, confirmation et remise à zéro,
chronomètre configurable, absence de sanction, expiration tardive, sauvegardes
incompatibles, quota, refus d'accès et commandes devenues obsolètes.

Le test navigateur optionnel nécessite une installation existante de Playwright
et Chrome. Aucun paquet supplémentaire n'a été ajouté au projet. Lancer Vite,
puis `PLAYWRIGHT_MODULE=/chemin/vers/playwright/index.mjs npm run test:browser`.
Variables optionnelles : `TEST_URL`, `CHROME_PATH`, `ARTIFACT_DIR`.
Il utilise uniquement un profil temporaire, sans toucher aux données du profil
habituel. Les captures sont enregistrées hors du dépôt, dans
`/tmp/mafamillelc-verification` par défaut.

## Limites

- Le stockage reste local : pas de synchronisation entre appareils, profils ou
  origines différentes. Changer de port, de domaine ou de navigateur ne migre
  pas les données. L'export n'est pas un mécanisme de restauration automatique.
- Pas de garantie de sauvegarde après suppression des données navigateur ou
  panne disque. Les navigateurs peuvent suspendre un onglet en arrière-plan :
  à sa reprise, une seule expiration est appliquée, sans accumulation rétroactive.
  Sans régie ouverte, la projection affiche zéro mais ne sanctionne pas ;
  l'expiration est traitée au retour de la régie.
- Une seule action est annulable ; les corrections éditoriales remplacent aussi
  cette action précédente. Les réglages de jeu constituent des actions annulables.
- L'attribution des anciennes manches ne peut pas être reconstituée de façon
  fiable. Aucune attribution n'est inventée pendant la migration.
- La séparation des routes protège des clics accidentels ; elle ne constitue
  pas une authentification. Un utilisateur local peut ouvrir `/control`.
- La lecture audio effective, le navigateur du jour J et le vidéoprojecteur
  physique nécessitent encore une répétition sur place. Pas de validation Safari,
  Firefox ou multi-appareil annoncée.
- Les textes très longs ou les manches comportant beaucoup de réponses sont
  ajustés pour tenir à l'écran ; leur lisibilité physique doit être vérifiée.
- Aucune fonctionnalité P0/P1 laissée en attente d'implémentation. Aucun backend,
  compte, abonnement, déploiement, nouvelle question fictive ou changement Git
  d'écriture n'a été introduit.
