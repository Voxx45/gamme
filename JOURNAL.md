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

## Étape 3 — L'interface

**Date :** 18 septembre 2026
**Temps passé :** ~2 h 30

### Direction visuelle retenue

Ewan avait laissé le champ libre. Direction choisie : **« instrument éditorial »**.
Papier chaud `#faf9f6`, encre `#14130f`, filets d'un cheveu, un seul accent
oxblood `#8c3a2b` réservé au focus, à l'onglet actif et à l'action principale.
**IBM Plex Sans** pour l'interface, **IBM Plex Mono** pour toutes les valeurs —
hexadécimaux, ratios, px et rem : des chiffres en colonne doivent s'aligner.
Angles à 2 px, aucune ombre portée, aucun dégradé.

Le raisonnement : l'outil affiche les couleurs des autres. Sa propre peau doit
donc être quasi achromatique, sans quoi elle entre en concurrence avec ce qu'elle
présente. Toutes les couleurs de texte de l'interface passent AAA sur le papier —
un outil qui juge le contraste des autres n'a pas le droit d'échouer au sien.

### Fait

- **Catalogue de 171 Google Fonts** embarqué dans le dépôt, avec catégorie et
  graisses réellement servies. Aucune requête à l'API Google Fonts.
- **Disposition** : panneau de saisie à gauche en colonne collante sur grand
  écran, résultats à droite en onglets ; saisie en haut et sections empilées sur
  mobile. Sur un écran étroit, faire défiler est plus rapide que viser un onglet.
- **Couleurs** : champ texte et sélecteur natif couplés, validation en direct,
  ajout, suppression et réordonnancement de 1 à 4 couleurs.
- **Sélecteur de police** avec recherche, chaque nom rendu dans sa propre fonte.
- **Matrice de contrastes** avec pastilles, filtre « seulement les paires
  valides », et une liste de corrections cliquables qui remplacent la couleur.
- **Brand board** 1200 × 630, export PNG à 2400 × 1260.
- **Exports** CSS, Tailwind v4 et DTCG, avec lien de partage.
- **État vide** soigné, bouton « Exemple » qui charge NØRVA.
- **Accessibilité** : navigation clavier complète (combobox ARIA avec
  `aria-activedescendant`, onglets avec flèches et Home/End, radiogroup pour les
  ratios), anneau de focus unique et contrasté, un label par champ, deux régions
  `aria-live` — une polie pour les résultats, une immédiate pour les
  confirmations — et `prefers-reduced-motion` respecté.

135 tests toujours verts, lint et typecheck propres.

### Décisions de conception

- **Réordonnancement par boutons flèches, pas par glisser-déposer.** Le
  glisser-déposer accessible demande beaucoup de code et reste fragile ; deux
  boutons fonctionnent au clavier, à la souris et au doigt, et s'annoncent.
- **Les corrections vivent sous la matrice, pas dans ses cellules.** Trente-six
  cellules contenant chacune un ratio, deux pastilles et une suggestion
  cliquable seraient illisibles. La matrice donne le coup d'œil, la liste donne
  l'action.
- **Le brand board applique à lui-même la règle qu'il enseigne.** Le titre
  d'accent prend la nuance la plus proche qui passe AA si la couleur saisie
  échoue sur le fond. Les couleurs exactes restent visibles dans la bande de
  palette, en bas.
- **L'annonce des résultats est différée de 900 ms.** Sans ce délai, un lecteur
  d'écran réciterait la matrice caractère après caractère pendant la frappe.
- **Deux régions `aria-live` et pas davantage.** Multiplier les régions vivantes
  rend leur ordre de lecture imprévisible.

### Problèmes rencontrés

1. **Perte du focus dans le champ couleur — trouvé par le lint.** La clé de
   chaque ligne contenait la couleur (`key={`${i}-${hex}`}`). Chaque frappe
   valide changeait donc la clé, React remontait le composant, et le champ
   perdait le focus au milieu de la saisie. Un avertissement `set-state-in-effect`
   d'oxlint a conduit à relire ce code et à voir le vrai problème à côté. Clé par
   position, et synchronisation du champ par un critère sémantique : on ne
   réécrit le texte que s'il ne désigne pas déjà la couleur en place — sinon
   taper « 1b2a41 » verrait le champ se réécrire en « #1b2a41 » sous le curseur.

2. **Deux défauts d'affichage sur mobile, invisibles sur desktop.** Les onze
   hexadécimaux d'une rampe se chevauchaient en un magma illisible dans 390 px,
   et les pastilles de verdict se coupaient en deux lignes (« Aa » puis « AA »).
   Corrigé par un défilement horizontal de la rampe et un `whitespace-nowrap` sur
   la pastille. Les captures Playwright ont servi à ça : les deux problèmes
   n'existaient pas sur grand écran.

3. **`toGamut` déjà croisé à l'étape 2, et la couche JSON des outils d'édition
   qui décode les séquences `\uXXXX`.** Trois expressions régulières se sont
   retrouvées avec de vrais caractères de contrôle à la place de leur texte.
   Repéré parce que `grep` annonçait « Binary file matches ».

4. **Vitest 4 n'a plus de reporter `basic`**, et Playwright a fallu l'installer
   avec son Chromium. Les captures se rejouent par `npm run captures`.

5. **Le chroma des rampes issues d'une couleur foncée**, signalé à l'étape 2, est
   maintenant visible : la rampe « encre » de NØRVA part de `#1b2a41` ancré au
   palier 950 et passe par `#5e88c7` au palier 500 — un bleu bleuet nettement
   plus vif que l'encre. Conséquence rattrapée sur le brand board, où le bouton
   d'action porte désormais la couleur de marque elle-même et non son palier 600.
   Le réglage de fond reste à trancher.

### Corrections d'Ewan

_(à compléter)_

---

## Étape 4 — Le partage et les exports

**Date :** 18 septembre 2026
**Temps passé :** ~1 h 30

### Fait

- **Bouton « Copier le lien de ma charte »** dans l'en-tête, donc accessible
  depuis n'importe quel onglet. Le lien est reconstruit depuis la configuration
  et non lu dans `location.hash`, qui peut avoir 200 ms de retard sur l'état à
  cause du délai d'écriture.
- **Brand board en deux formats** : 1200 × 630 pour les aperçus de lien et
  1080 × 1350 pour un post LinkedIn ou Instagram. Un sélecteur change le format
  prévisualisé ; le format non affiché est rendu hors écran, car `html-to-image`
  a besoin d'un nœud réellement mis en page — `display: none` donnerait une image
  vide. Les deux sortent à deux fois le format nominal, soit 2400 × 1260 et
  2160 × 2700.
- **Polices réellement embarquées dans le PNG** (voir ci-dessous).
- **Téléchargement en fichier** des trois exports texte, en plus de la copie :
  `norva-variables.css`, `norva-theme.css`, `norva-tokens.json`.
- **Suite de bout en bout Playwright** : `npm run e2e`, 41 vérifications.

### Le vrai sujet : les polices dans le PNG

C'est le piège annoncé, et il méritait d'être traité en amont plutôt que
d'espérer que la bibliothèque s'en sorte.

`html-to-image` parcourt `document.styleSheets` pour retrouver les `@font-face`.
Une feuille servie par un autre domaine — c'est le cas de Google Fonts — lève une
`SecurityError` à la lecture de ses règles. La bibliothèque retombe alors sur un
re-téléchargement qui échoue parfois silencieusement, et l'image sort avec la
police de repli. Le défaut ne se voit qu'en ouvrant le fichier.

La parade est dans `src/lib/export/fonts-embed.ts` : on télécharge nous-mêmes la
feuille `css2`, on remplace chaque `url(...)` par un data-URI, et on passe le
résultat à `html-to-image` via son option `fontEmbedCSS`, qui court-circuite
entièrement sa propre détection. Deux détails qui comptent :

- **On ne garde que les sous-ensembles latins.** Google sert une dizaine de
  sous-ensembles par famille — cyrillique, grec, vietnamien… Tout inliner ferait
  plusieurs mégaoctets de base64 pour une image qui n'affiche que du latin. Le
  latin de base contient déjà le Ø de NØRVA et les accents français.
- **Un fichier qui n'a pas pu être inliné voit son bloc retiré**, plutôt que de
  laisser une URL distante que le canevas refuserait de peindre.

Vérifié de deux façons : la suite de bout en bout contrôle qu'aucune URL
`fonts.gstatic` ne subsiste dans la feuille embarquée, et j'ai ouvert les PNG
produits — Cormorant Garamond et Manrope y sont, pas leur repli.

### Problèmes rencontrés

1. **Chaque panneau était monté deux fois.** Le test de bout en bout a échoué sur
   une « strict mode violation » : deux boutons portaient le même sélecteur.
   La cause était plus grave que le test : la disposition en onglets et la
   disposition empilée coexistaient dans le DOM, l'une masquée en CSS. Chaque
   panneau était donc calculé deux fois, et surtout **les `id` étaient en
   double** — un `aria-controls` pointait vers deux volets, ce qui fait dire
   n'importe quoi à un lecteur d'écran. Corrigé par un `useSyncExternalStore` sur
   `matchMedia` : une seule disposition est montée. Les identifiants du panneau
   Export sont passés à `useId`.

2. **`NØRVA` donnait `n-rva` comme nom de fichier.** La décomposition Unicode NFD
   sépare un caractère accentué en lettre plus diacritique, mais Ø n'est pas un O
   accentué : c'est une lettre à part entière, que NFD laisse intacte, et que le
   filtre suivant remplaçait par un tiret. Même problème pour Æ, ß, Ð, Ł. Corrigé
   par une table de translittération, extraite dans `nom-fichier.ts` — sans
   dépendance au DOM, donc couverte par six tests unitaires.

3. **Le portrait 1080 × 1350 respirait trop.** Trois blocs répartis par
   `space-between` sur 1350 px laissaient deux vides au milieu. Rééquilibré en
   donnant aux bandes de palette la hauteur qu'elles méritent dans un 4:5.

4. **La bande « Neutre » semblait amputée** : son palier 50 est `#f4f1ea`, soit
   exactement le fond du board. Un filet inséré à 8 % délimite la bande sans
   ajouter de bordure visible.

### Ce que vérifie `npm run e2e`

| Section | Vérifications |
|---|---|
| Partage | fragment absent à la première visite, lien copié, charte restaurée à l'identique dans un onglet neuf, 44 nuances identiques |
| Historique | 20 modifications d'affilée n'ajoutent aucune entrée |
| URL corrompues | 8 fragments abîmés, dont une injection et un fragment de 3 600 caractères ; aucune exception, l'outil reste utilisable et accepte encore une saisie |
| PNG | feuille `@font-face` inlinée, aucune URL distante, deux formats aux bonnes dimensions |
| Exports | trois fichiers téléchargés, nommés d'après la marque, contenu complet, JSON reparsable |

**41 vérifications, 0 échec.** Plus 141 tests unitaires.

### Corrections d'Ewan

_(à compléter)_

---
