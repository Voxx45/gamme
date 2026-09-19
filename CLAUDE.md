# CLAUDE.md

Contexte permanent du projet. À lire avant toute intervention.

## Le produit

**Gamme** — un générateur de **mini charte graphique**, gratuit, 100 % navigateur.
L'utilisateur saisit jusqu'à **4 couleurs** et **2 polices** (titres + texte).
Il obtient en quelques secondes une charte exploitable, et une URL pour la partager.

- En ligne : <https://gamme-murex.vercel.app>
- Dépôt : <https://github.com/Voxx45/gamme>

### Les six livrables de l'outil

1. **Nuances** — pour chaque couleur, une échelle 50 → 950 calculée en OKLCH.
2. **Matrice de contrastes** — toutes les paires texte/fond, ratio WCAG + verdict
   AA / AAA, pour le texte courant et le grand texte. Chaque paire qui échoue reçoit
   une proposition : la nuance la plus proche qui passe AA.
3. **Échelle typographique** — rendue avec les polices choisies. Taille de base et
   ratio (1.2 / 1.25 / 1.333 / 1.5) réglables, interlignage conseillé par niveau.
4. **Brand board** — le visuel de synthèse, en 1200 × 630 et en 1080 × 1350.
5. **Exports** — variables CSS, bloc `@theme` Tailwind v4, tokens JSON au format
   W3C Design Tokens (DTCG), PNG du brand board. Copie ou téléchargement.
6. **URL partageable** — toute la configuration tient dans le fragment de l'URL.

## Contraintes non négociables

- **Zéro serveur.** Pas de compte, pas de clé API, pas de cookie de suivi, pas de
  backend. Tout le calcul se fait dans le navigateur. L'outil est gratuit.
- **Polices.** Un catalogue de **171 Google Fonts** est embarqué dans le dépôt
  (`src/data/google-fonts.json`). Chargement à la demande via l'URL `css2` de
  Google Fonts. **Ne jamais utiliser l'API Google Fonts** (elle exige une clé).
- **Stack.** Vite + TypeScript + Tailwind CSS v4. Le code est écrit en React et
  servi par `preact/compat` : 47 ko gzip au premier chargement au lieu de 107.
  Couleurs : `culori`, via `src/lib/color/culori.ts` qui n'enregistre que
  `rgb`, `oklab` et `oklch` — ajouter un espace se fait là, une fois.
  Export PNG : `html-to-image`, chargé à la demande.
  **Aucune autre dépendance de production sans demander à Ewan.** En
  développement : `vitest`, `playwright`, `axe-core`, `lighthouse`.
- **Accessibilité exemplaire.** C'est un outil qui parle d'accessibilité : il doit
  être irréprochable. Tout au clavier, focus visible, un label par champ, résultats
  annoncés en `aria-live`, `prefers-reduced-motion` respecté.
- **Interface en français.**

## Exemple de démonstration « NØRVA »

Le bouton « Exemple » charge cette configuration (`CONFIG_NORVA`, dans
`src/lib/share/state.ts`).

| | |
|---|---|
| Couleurs | `#1b2a41` encre · `#c9a227` laiton · `#7c9eb2` givre · `#f4f1ea` os |
| Titres | **Cormorant Garamond**, graisse 600 |
| Texte | **Manrope**, graisse 400 |
| Base et ratio | 16 px, 1.25 |

La palette est choisie pour que l'outil se montre lui-même : elle produit des
paires AAA, une paire AA mais pas AAA, et deux échecs francs sur fond blanc —
donc des suggestions de correction visibles dès l'ouverture.

Cormorant Garamond aux titres et Manrope au texte, et non l'inverse : Cormorant
est un caractère à fort contraste de graisse, taillé pour les grandes tailles.
L'employer en texte courant serait un contresens sur un outil qui parle de
lisibilité.

## Direction visuelle

« Instrument éditorial ». Papier chaud `#faf9f6`, encre `#14130f`, filets d'un
cheveu, **un seul** accent oxblood `#8c3a2b` réservé au focus, à l'onglet actif et
à l'action principale. **IBM Plex Sans** pour l'interface, **IBM Plex Mono** pour
toutes les valeurs. Angles à 2 px, aucune ombre portée, aucun dégradé.

L'outil affiche les couleurs des autres : sa propre peau doit rester quasi
achromatique. Toutes ses couleurs de texte passent AAA sur le papier.

## Pied de page

« Conçu et développé par Ewan Pineau, designer en recherche d'alternance »
+ lien vers `pineauewan.com`, vers `/a-propos` et vers le dépôt GitHub.

## Méthode de travail

- On avance **étape par étape**. Ewan envoie un prompt par étape.
  **Attendre son feu vert entre chaque étape.** Ne pas prendre d'avance.
- Tenir `JOURNAL.md` à jour : pour chaque étape, ce qui a été fait, le temps passé,
  les problèmes rencontrés, et ce qu'Ewan a corrigé. Ce fichier sert à écrire
  le post LinkedIn de lancement.

## Qui est Ewan

Ewan Pineau, designer graphique et web, 5 ans de freelance.
Bachelor Chef de Projet Digital à YNOV Rennes, en recherche d'alternance.
L'outil est lancé sur LinkedIn : il doit être utile dès la première minute,
irréprochable visuellement, et prouver une capacité à concevoir un produit —
pas seulement un écran.

## Règles d'architecture

- **`src/lib/` est du TypeScript pur** : aucune importation de React, aucun accès
  au DOM (sauf `lib/export/png.ts` et `lib/export/fonts-embed.ts`). Toute la
  logique métier y vit, et s'y teste sans navigateur. L'interface n'est qu'une
  couche de rendu au-dessus.
- La **configuration (`BrandConfig`) est l'unique source de vérité**. L'URL en est
  une sérialisation, jamais un second état.
- Le **décodage d'URL ne lève jamais d'exception** : toute valeur invalide retombe
  sur la valeur par défaut. Une URL tronquée doit produire une charte valide.
- Une famille de police n'est chargée que si son nom figure dans
  `google-fonts.json`. On ne construit jamais une URL `css2` à partir d'une chaîne
  arbitraire venue de l'URL partagée.
- **Jamais d'`opacity` sur du texte.** Elle réduit le contraste dans les mêmes
  proportions, sans qu'on le voie venir : c'est ainsi que des libellés sont tombés
  à 3,1:1. Employer `attenuer()` (`lib/color/muted.ts`), qui mélange vers le fond
  en s'arrêtant au dernier point qui tient AA.
- **Pour poser du texte sur une couleur arbitraire**, employer `encreLisible()`
  (`lib/color/readable.ts`), qui renvoie le noir ou le blanc **pur**. Avec l'encre
  et le papier de l'interface, légèrement chauds, la garantie tombe de 4,58:1 à
  4,24:1 — sous le seuil.

## Commandes

| Commande | Ce qu'elle fait |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` | vérification TypeScript puis build de production |
| `npm run preview` | sert le build de production |
| `npm test` | les tests unitaires (Vitest) |
| `npm run lint` | oxlint |
| `npm run e2e` | partage, exports et PNG (Playwright) |
| `npm run qa` | axe-core, parcours clavier, cas limites |
| `npm run lighthouse` | Lighthouse en profil mobile |
| `npm run captures` | les captures d'écran du dépôt |
| `npm run assets` | l'image Open Graph et les icônes |
| `npm run video` | la démo de 30 s en 1080 × 1350 |
| `npm run demo` | rejoue la charte NØRVA dans le terminal |

Les préférences d'affichage — thème et simulation du daltonisme — vivent dans
`src/state/preferences.ts` et **ne partent pas dans l'URL** : elles décrivent
une façon de regarder, pas la charte. Les verrous de couleur non plus.

Les scripts de vérification ont besoin d'un serveur : lancer
`npm run build && npm run preview` d'abord, puis passer l'URL par la variable
d'environnement `BASE`.

## Pièges rencontrés, à ne pas refaire

- `toGamut(dest, mode)` : le **premier** argument est le gamut visé. C'est
  `toGamut('rgb', 'oklch')`, pas l'inverse.
- Le test de gamut a besoin d'une **tolérance** (1e-4) : sans elle, les couleurs
  posées sur une face du cube sRGB — `#ff0000`, le blanc — sont déclarées à tort
  hors gamut à cause de l'arrondi.
- La décomposition Unicode **NFD ne décompose pas** Ø, Æ, ß, Ð ni Ł : ce sont des
  lettres à part entière. D'où la table de translittération dans `nom-fichier.ts`.
- `html-to-image` **ne sait pas lire** une feuille de style servie par un autre
  domaine (`SecurityError`). Les polices sont donc embarquées à la main par
  `lib/export/fonts-embed.ts` et passées via l'option `fontEmbedCSS`.
- Ne **jamais monter deux dispositions** en masquant l'une en CSS : cela duplique
  les `id` et casse les `aria-controls`. Employer `useMediaQuery`.
- **Ne jamais écrire `verifier(true, …)`** dans les scripts de vérification.
  Deux assertions de ce genre ont gonflé un compte pendant une étape entière.
- Le linter prend le `useMode` de culori pour un hook React : il est importé
  sous le nom `enregistrerMode`.
- L'**auto-hébergement des polices d'interface a été tenté puis annulé** :
  mesure à l'appui, les 165 ko se mettaient à concurrencer le paquet JavaScript
  sur la même connexion et le premier affichage passait de 1,8 s à 2,7 s.
- `documentElement.scrollWidth` **n'est pas** une mesure fiable du débordement :
  Chrome y compte le contenu des conteneurs à défilement imbriqués, même clipés.
  Mesurer `window.scrollX` après une tentative de défilement.
