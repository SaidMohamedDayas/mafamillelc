# Famille en Or Premium

Application frontend React pour animer un jeu type **Family Feud / Famille en Or** sur ordinateur, TV ou videoprojecteur.

Deux vues sont disponibles:
- ` / ` : affichage Home (plateau public)
- ` /control ` : panneau de controle (pilotage du jeu)

Les deux vues sont synchronisees en temps reel entre onglets.

La projection démarre sur un écran d'attente. Toutes les commandes de jeu sont
réservées à `/control` : main A/B, scores, annulation, attente, plein écran et
chronomètre configurable. Aucun buzzer physique n'est nécessaire.

Utiliser le même navigateur, le même profil et la même origine pour les deux
vues. Les commandes nécessitent Web Locks (Chrome récent sur localhost ou HTTPS).
Garder la régie ouverte pour traiter les expirations du chronomètre.

La partie est restaurée depuis localStorage. La remise à zéro complète demande
confirmation et préserve les questions modifiées. Une ancienne sauvegarde dont
l'attribution des points est inconnue demande une vérification en régie.
Le bouton d'export permet de conserver une copie des données.

L'audit, les règles de récupération et le mode opératoire sont détaillés dans
[le rapport de fiabilisation](docs/FIABILISATION_EVENEMENT.md).

## Stack

- React + Vite (JavaScript)
- Tailwind CSS
- shadcn/ui (composants style shadcn)
- Radix UI
- Framer Motion
- lucide-react

## Installation

```bash
npm install
```

## Lancer en developpement

```bash
npm run dev
```

Puis ouvrir:
- `http://localhost:5173/` (Home)
- `http://localhost:5173/control` (Controle)

## Build production

```bash
npm run build
```

## Tests

Tests de logique, sauvegarde et concurrence, sans dépendance ajoutée (Node 20+) :

```bash
npm test
```

Test optionnel multi-onglets avec Chrome et une installation existante de
Playwright, après lancement du serveur local :

```bash
PLAYWRIGHT_MODULE=/chemin/vers/playwright/index.mjs npm run test:browser
```

Les captures sont écrites dans `/tmp/mafamillelc-verification`. Le test utilise
un profil temporaire et ne modifie pas les sauvegardes du navigateur habituel.

## Preview locale du build

```bash
npm run preview
```

## Deploiement Netlify

Configuration deja prete via `netlify.toml`:

- Build command: `npm run build`
- Publish directory: `dist`
- SPA redirect: routes supportees (`/` et `/control`)
