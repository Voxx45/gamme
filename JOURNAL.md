# Journal de bord

Carnet de fabrication du générateur de mini charte graphique.
Une entrée par étape : ce qui a été fait, le temps passé, les problèmes rencontrés,
et ce qu'Ewan a corrigé. Matière première du post de lancement.

---

## Étape 0 — Initialisation et architecture

**Date :** 18 septembre 2026
**Temps passé :** ~15 min

### Fait

- Projet Vite créé avec le template `react-ts`.
- Dépendances installées, et rien de plus que le brief :
  `culori` (couleurs), `html-to-image` (export PNG), `tailwindcss` + `@tailwindcss/vite`.
- Tailwind v4 branché via le plugin Vite (pas de `tailwind.config.js` : en v4 la
  configuration vit dans le CSS, via `@theme`).
- Alias `@/` vers `src/`, mode TypeScript `strict` activé, plus
  `noUncheckedIndexedAccess` — utile pour un code qui manipule beaucoup de tableaux
  de nuances.
- Boilerplate supprimé (logos Vite/React, `App.css`).
- Arborescence posée : `core/` (logique pure), `data/`, `state/`, `hooks/`,
  `components/`.
- `CLAUDE.md` rédigé : le brief sous une forme qui survit aux redémarrages de session.
- Dépôt git initialisé.
- Premier `npm run build` vert.

### Versions retenues

| Paquet | Version |
|---|---|
| Vite | 8.3 |
| React | 19.2 |
| TypeScript | 6.0 |
| Tailwind CSS | 4.3 |
| culori | 4.0 |
| html-to-image | 1.11 |

### Problèmes rencontrés

- **`baseUrl` déprécié en TypeScript 6.** Le build échouait avec `TS5101` :
  l'option disparaîtra en TypeScript 7. Corrigé en supprimant `baseUrl` et en
  laissant `paths` seul — depuis TypeScript 5.4, les chemins se résolvent
  relativement au `tsconfig.json`, `baseUrl` n'est plus nécessaire.

### Décisions ouvertes (à trancher avec Ewan)

- Le **nom de l'outil** — 5 propositions soumises.
- Les **couleurs et graisses de l'exemple NØRVA** — laissées en `[À REMPLIR]`
  dans `CLAUDE.md`.
- Le **format de l'URL partageable** — proposition soumise.
- L'ajout éventuel de **Vitest** pour tester `core/` (dépendance supplémentaire,
  donc soumise à validation).

### Corrections d'Ewan

_(à compléter)_

---
