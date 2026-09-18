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

## Étape 2 — Le moteur de calcul

**Date :** 18 septembre 2026
**Temps passé :** ~1 h 15

### Fait

Tout le moteur vit dans `src/lib/`, en TypeScript pur : aucun import React, aucun
accès au DOM. L'interface ne sera qu'une couche de rendu posée par dessus.

| Module | Rôle |
|---|---|
| `color/parse.ts` | `parseColor` — hex 3/6, `rgb()`, `hsl()`, `oklch()` |
| `color/scale.ts` | `generateScale` — l'échelle 50 → 950 en OKLCH |
| `color/contrast.ts` | `contrastRatio`, `evaluatePair` — WCAG 2.x |
| `color/suggest.ts` | `suggestAccessible` — la nuance la plus proche qui passe |
| `typography/scale.ts` | `typeScale` — tailles px/rem et interlignage conseillé |
| `share/state.ts` | `encodeState` / `decodeState` + la config NØRVA |
| `export/*.ts` | CSS, `@theme` Tailwind v4, tokens DTCG |
| `charte.ts` | `buildCharte` — assemble ce que les exporteurs consomment |

**135 tests, tous verts.** Lint et typecheck propres.
`npm run demo` rejoue la charte NØRVA de bout en bout.

### Décisions prises, et pourquoi

- **Ancrage de la couleur saisie.** On remplace la clarté de référence du palier le
  plus proche par celle de la couleur, et on normalise le chroma sur ce palier.
  Comme le palier retenu est *le plus proche*, la couleur tombe forcément entre
  ses deux voisins : la monotonie de l'échelle est acquise par construction, sans
  correction après coup.
- **L'OKLCH exporté est re-dérivé depuis l'hexadécimal produit.** La notation
  `oklch()` décrit donc la couleur réellement affichée, pas une intention
  théorique que le gamut a corrigée entre temps.
- **Le ratio de contraste est tronqué, pas arrondi.** Arrondir 4,4996 donnerait
  « 4,50 » sur une paire en échec : soit un affichage qui contredit son propre
  verdict, soit un faux succès. La troncature garantit que `ratio ≥ seuil` et
  l'affichage racontent toujours la même chose. Un test balaie les 256 gris pour
  le vérifier.
- **La luminance WCAG n'est pas la clarté OKLCH.** Les deux sont calculées
  séparément ; les confondre donnerait de faux verdicts sur un outil qui ne parle
  que de ça.
- **Les rem sont relatifs à la racine (16 px), pas à la taille de base.** C'est la
  condition pour que le réglage de taille de texte du navigateur continue d'agir.
- **`decodeState` valide champ par champ** et ne lève jamais d'exception. Les clés
  inconnues sont ignorées, ce qui laisse la porte ouverte à de futurs champs sans
  casser les liens déjà partagés.
- **Barrière sur les polices** : une famille venue de l'URL doit passer un filtre
  de caractères, et un filtre par catalogue quand il sera disponible. On ne
  construit jamais une requête Google Fonts à partir d'une chaîne arbitraire.
- **Exports différenciés** : hexadécimal côté CSS natif (passe-partout), `oklch()`
  côté Tailwind v4 (comme sa palette native). Le DTCG emploie les formes chaîne
  (`"#1b2a41"`, `"1rem"`) plutôt que les formes objet de la dernière rédaction du
  brouillon : ce sont celles que lisent aujourd'hui Style Dictionary et Tokens
  Studio. Un export que personne ne peut importer ne sert à rien.

### Problèmes rencontrés

1. **`toGamut` mal appelé.** J'avais écrit `toGamut('oklch', 'oklch')`. Le premier
   argument est le *gamut visé*, pas l'espace de travail : il fallait
   `toGamut('rgb', 'oklch')`, soit « ramène dans sRGB en réduisant le chroma dans
   OKLCH ». Repéré à la relecture, avant les tests.

2. **Fausses alertes « couleur corrigée ».** Deux tests ont échoué au premier
   passage. Le diagnostic a montré que toutes les couleurs concernées touchaient
   exactement une face du cube sRGB — `#ff0000` a deux canaux à 0, `#dbebff` un
   canal à 1. L'arrondi des composantes OKLCH suffisait à les faire basculer d'un
   cheveu hors du cube. Un utilisateur qui tape `#ff0000` se serait vu dire que sa
   couleur avait été corrigée. Corrigé par un test de gamut avec une tolérance de
   1e-4 : très au dessus du bruit d'arrondi (~1e-6), très en dessous d'un pas de
   quantification 8 bits (~3,9e-3).

3. **Mon test de teinte était faux — et il a révélé un phénomène réel.** La formule
   de distance circulaire était erronée. Mais le diagnostic a surtout montré que
   la teinte dérive de 25° au palier le plus clair d'un bleu, contre 0,1° au
   milieu. Ce n'est pas un bug : près de l'axe achromatique, la teinte est mal
   conditionnée, et un pas de quantification 8 bits la fait tourner. Le test ne
   porte donc plus que sur les paliers dont le chroma rend la teinte
   significative (≥ 0,1), plus une vérification exacte au palier d'ancrage.

4. **Friction d'outillage.** Deux heredocs ont échoué au parsing sans que la cause
   soit identifiable, et surtout : la couche JSON des outils d'édition décode les
   séquences `\uXXXX`. Deux expressions régulières se sont retrouvées avec de
   vrais caractères de contrôle à la place de leur texte littéral. Repéré parce
   que `grep` annonçait « Binary file matches ». Contourné en évitant toute
   séquence d'échappement dans les paramètres d'outil.

5. **Vitest 4 a supprimé le reporter `basic`.** Et un `include` restreint à
   `src/**` empêchait de lancer le script de démonstration. Résolu par une
   deuxième configuration, `vitest.demo.config.ts` : `npm test` ne couvre que le
   moteur, `npm run demo` ne fait que montrer. Une démonstration n'est pas un test.

### À trancher avec Ewan

- **Le chroma des échelles issues d'une couleur foncée.** `#1b2a41` s'ancre au
  palier 950 ; la normalisation du chroma amplifie alors le milieu de l'échelle
  d'un facteur 2,3, et le palier 500 sort à `#5e88c7` — un bleu bleuet nettement
  plus vif que l'encre de départ. C'est défendable (il faut des tons moyens
  utilisables) mais la famille dérive. Un plafond d'amplification réglerait la
  question ; à juger à l'œil à l'étape suivante, quand les échelles seront visibles.
- La palette NØRVA proposée, et l'attribution Cormorant aux titres / Manrope au texte.

### Corrections d'Ewan

_(à compléter)_

---
