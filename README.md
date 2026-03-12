# Famille en Or Premium

Application frontend React pour animer un jeu type **Family Feud / Famille en Or** sur ordinateur, TV ou videoprojecteur.

Deux vues sont disponibles:
- ` / ` : affichage Home (plateau public)
- ` /control ` : panneau de controle (pilotage du jeu)

Les deux vues sont synchronisees en temps reel entre onglets.

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

## Preview locale du build

```bash
npm run preview
```

## Deploiement Netlify

Configuration deja prete via `netlify.toml`:

- Build command: `npm run build`
- Publish directory: `dist`
- SPA redirect: routes supportees (`/` et `/control`)
