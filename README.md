# Gamme

[![CI](https://github.com/Voxx45/gamme/actions/workflows/ci.yml/badge.svg)](https://github.com/Voxx45/gamme/actions/workflows/ci.yml)
[![Licence MIT](https://img.shields.io/badge/licence-MIT-1b2a41)](LICENSE)

**Générateur de mini charte graphique.** Quatre couleurs, deux polices, et la
charte complète en quelques secondes.

Gratuit, sans compte, sans serveur : tout se calcule dans votre navigateur, et
rien de ce que vous saisissez ne le quitte.

**[→ Ouvrir l'outil](https://gamme-murex.vercel.app)** · [À propos](https://gamme-murex.vercel.app/a-propos)

![Le brand board de l'exemple NØRVA : le nom en Cormorant Garamond, un titre de section, un bouton, une carte et les quatre échelles de couleurs.](public/og.png)

---

## L'outil

| | |
|---|---|
| ![Le panneau Palette : quatre échelles de onze nuances, avec la couleur saisie encadrée sur son palier d'ancrage.](docs/palette.png) | **Palette** — onze nuances par couleur, la couleur saisie restituée telle quelle. |
| ![Le panneau Contrastes : une matrice six par six avec les ratios et les pastilles AA/AAA, suivie de la liste des corrections proposées.](docs/contrastes.png) | **Contrastes** — la matrice complète, puis une correction cliquable par paire en échec. |
| ![Le panneau Typographie : neuf niveaux, chacun avec sa taille en pixels et en rem, son interlignage conseillé, et un spécimen rendu dans la police choisie.](docs/typographie.png) | **Typographie** — l'échelle rendue dans vos polices, interlignage compris. |
| ![La grille nuance par nuance : onze paliers contre onze, les cases pleines marquant les paires qui atteignent le seuil.](docs/grille.png) | **Nuance par nuance** — 121 paires, le seuil au choix. |
| ![L'outil en thème sombre, avec la palette rendue telle que la perçoit une deutéranopie.](docs/sombre-daltonisme.png) | **Thème sombre et simulation** — ici en deutéranopie. |

---

## Ce que ça fait

Vous entrez jusqu'à quatre couleurs et deux polices. L'outil en déduit :

**Les nuances.** Onze paliers par couleur, de 50 à 950, calculés en OKLCH. La
couleur que vous avez saisie est restituée telle quelle sur le palier dont la
clarté est la plus proche — vous devez retrouver *votre* couleur dans la rampe.
Aucun palier ne sort du gamut sRGB.

**La matrice de contrastes.** Toutes les paires texte/fond, plus le blanc et le
noir. Ratio WCAG 2.1 et verdict AA / AAA, pour le texte courant comme pour le
grand texte. Et pour chaque paire qui échoue, la nuance la plus proche — même
teinte — qui atteint AA : un clic remplace la couleur dans votre charte.

**L'échelle typographique.** Rendue avec vos polices. Taille de base et ratio
réglables, avec l'interlignage conseillé à chaque niveau — il se resserre quand
la taille augmente, parce qu'un titre de 48 px avec l'interlignage d'un
paragraphe se désagrège en lignes flottantes.

**Le brand board.** Le visuel de synthèse, en 1200 × 630 pour les aperçus de
lien et en 1080 × 1350 pour un post. Exporté en PNG à deux fois la définition,
polices comprises.

**La grille nuance par nuance.** Les onze paliers d'une échelle contre les onze
de l'autre, avec le seuil de votre choix. C'est la grille qu'on consulte au
moment d'intégrer : elle répond à « est-ce que le palier 600 passe sur le
palier 50 ».

**La simulation du daltonisme.** La palette et le brand board rendus tels que
les perçoivent une deutéranopie, une protanopie ou une tritanopie. Un vert de
validation et un rouge d'erreur qui ne se distinguent que par la teinte
deviennent le même objet : mieux vaut le voir avant de livrer.

**Les exports.** Variables CSS, bloc `@theme` pour Tailwind v4, tokens JSON au
format W3C Design Tokens. À copier ou à télécharger. Nommez vos couleurs et les
tokens s'appellent `--color-encre-500` plutôt que `--color-primary-500`.

**Une URL partageable.** Toute la configuration tient dans le fragment de
l'URL — la partie après le `#`, qui n'est jamais transmise au serveur. Même
l'hébergeur ne voit pas votre charte.

## Quelques partis pris

- **Le ratio affiché est tronqué, pas arrondi.** Arrondir 4,4996 donnerait
  « 4,50 » sur une paire en échec : soit un affichage qui contredit son propre
  verdict, soit un faux succès. La troncature garantit qu'ils racontent toujours
  la même chose.
- **La luminance WCAG n'est pas la clarté OKLCH.** Les deux sont calculées
  séparément ; les confondre donnerait de faux verdicts.
- **Le brand board applique à lui-même la règle qu'il enseigne.** Si une couleur
  de marque est illisible sur le fond du visuel, c'est la nuance la plus proche
  qui passe AA qui est employée. Les couleurs exactes restent dans la bande de
  palette, en bas.
- **L'interface ne vole pas la vedette aux palettes.** Papier, encre, filets
  d'un cheveu, un seul accent. Toutes ses couleurs de texte atteignent AAA, dans
  les deux thèmes : un outil qui juge le contraste des autres n'a pas le droit
  d'échouer au sien.
- **Jamais d'`opacity` sur du texte.** Elle réduit le contraste dans les mêmes
  proportions, sans qu'on le voie venir. Les libellés secondaires sont mélangés
  vers le fond en s'arrêtant au dernier point qui tient AA.
- **APCA en second avis, jamais à la place.** Le calcul du brouillon WCAG 3 n'est
  affiché que là où il contredit WCAG 2.1 — donner deux chiffres pour chaque
  paire n'aiderait personne.

## Accessibilité

C'est un outil qui parle d'accessibilité ; il est tenu d'être exemplaire.

| Contrôle | Résultat |
|---|---|
| Lighthouse mobile | 100 · 100 · 100 · 100 |
| axe-core, quatre états dont 320 px | 0 violation |
| Tests unitaires | 183 |
| Vérifications de bout en bout | 83 |

Navigation clavier complète — combobox ARIA, onglets aux flèches, anneau de
focus visible partout. Un label par champ, les résultats annoncés en
`aria-live` avec un délai pour ne pas réciter la matrice à chaque frappe, et
`prefers-reduced-motion` respecté.

Les calculs de contraste sont vérifiés contre
[WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) :
correspondance exacte sur cinq paires, ratios et verdicts.

## La stack

| | |
|---|---|
| [Vite](https://vite.dev) | build |
| [Preact](https://preactjs.com) + [TypeScript](https://www.typescriptlang.org) | interface |
| [Tailwind CSS v4](https://tailwindcss.com) | styles |
| [culori](https://culorijs.org) | conversions, gamut mapping, simulation |
| [html-to-image](https://github.com/bubkoo/html-to-image) | export PNG |

Le code est écrit en React ; `preact/compat` le sert pour un dixième du poids.
**47 ko gzip au premier chargement**, `html-to-image` n'étant téléchargé qu'au
premier export.

Pas de serveur, pas de base de données, pas de clé d'API — le catalogue de
171 Google Fonts est embarqué dans le dépôt et les familles se chargent à la
demande via l'URL `css2`.

### Architecture

```
src/
├─ lib/          le moteur de calcul : TypeScript pur, ni React ni DOM
│  ├─ color/     parsing, échelles OKLCH, contrastes WCAG, suggestions
│  ├─ typography/ échelle modulaire et interlignage
│  ├─ share/     encodage et décodage de l'URL
│  └─ export/    CSS, Tailwind, DTCG, PNG
├─ data/         le catalogue de polices
├─ state/        la configuration, source unique de vérité
└─ components/   la couche de rendu
```

`src/lib/` ne dépend de rien d'autre que `culori` : tout s'y teste sans
navigateur. L'interface n'est qu'une couche posée au-dessus.

## Lancer en local

```bash
git clone https://github.com/Voxx45/gamme.git
cd gamme
npm install
npm run dev
```

| Commande | Ce qu'elle fait |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` | vérification TypeScript puis build de production |
| `npm run preview` | sert le build de production |
| `npm test` | les 151 tests unitaires |
| `npm run lint` | oxlint |
| `npm run e2e` | partage, exports et PNG, avec Playwright |
| `npm run qa` | axe-core, parcours clavier, cas limites |
| `npm run lighthouse` | Lighthouse en profil mobile |
| `npm run captures` | les captures d'écran du dépôt |
| `npm run assets` | l'image Open Graph et les icônes |
| `npm run demo` | rejoue la charte NØRVA dans le terminal |

Les scripts de vérification ont besoin d'un serveur : lancez
`npm run build && npm run preview` d'abord, puis passez l'URL par la variable
`BASE` si vous n'utilisez pas le port par défaut.

## Licence

[MIT](LICENSE) — faites-en ce que vous voulez.

Les polices proposées viennent de [Google Fonts](https://fonts.google.com) et
restent sous leurs licences respectives, principalement l'OFL. L'outil ne les
redistribue pas : il les charge depuis Google au moment où vous les choisissez.
Cela implique une requête vers les serveurs de Google, donc le partage de votre
adresse IP avec eux. Aucun cookie n'est posé, et l'outil ne mesure rien.

## Crédits

Conçu et développé par **[Ewan Pineau](https://pineauewan.com)**, designer
graphique et web, en recherche d'alternance.

Le dépôt contient un [journal de fabrication](JOURNAL.md) qui retrace chaque
étape : les décisions prises, les problèmes rencontrés, et les erreurs
corrigées en chemin. Il est plus instructif que ce README.
