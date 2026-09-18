# CLAUDE.md

Contexte permanent du projet. À lire avant toute intervention.

## Le produit

Un générateur de **mini charte graphique**, gratuit, 100 % navigateur.
L'utilisateur saisit jusqu'à **4 couleurs** et **2 polices** (titres + texte).
Il obtient en quelques secondes une charte exploitable, et une URL pour la partager.

### Les six livrables de l'outil

1. **Nuances** — pour chaque couleur, une échelle 50 → 950 calculée en OKLCH.
2. **Matrice de contrastes** — toutes les paires texte/fond, ratio WCAG + verdict
   AA / AAA, pour le texte courant et le grand texte. Chaque paire qui échoue reçoit
   une proposition : la nuance la plus proche qui passe AA.
3. **Échelle typographique** — rendue avec les polices choisies. Taille de base et
   ratio (1.2 / 1.25 / 1.333 / 1.5) réglables, interlignage conseillé par niveau.
4. **Brand board** — le visuel de synthèse (nom de marque, titres, boutons, carte,
   palette). C'est l'image que les gens partageront.
5. **Exports** — variables CSS, bloc `@theme` Tailwind v4, tokens JSON au format
   W3C Design Tokens (DTCG), PNG du brand board.
6. **URL partageable** — toute la configuration tient dans l'URL.

## Contraintes non négociables

- **Zéro serveur.** Pas de compte, pas de clé API, pas de cookie de suivi, pas de
  backend. Tout le calcul se fait dans le navigateur. L'outil est gratuit.
- **Polices.** Une liste d'environ 150 Google Fonts populaires est **embarquée dans
  le dépôt** (`src/data/google-fonts.json`). Chargement à la demande via l'URL
  `css2` de Google Fonts. **Ne jamais utiliser l'API Google Fonts** (elle exige une clé).
- **Stack.** Vite + React + TypeScript + Tailwind CSS v4. Couleurs : `culori`.
  Export PNG : `html-to-image`. **Aucune autre dépendance sans demander à Ewan.**
- **Accessibilité exemplaire.** C'est un outil qui parle d'accessibilité : il doit
  être irréprochable. Tout au clavier, focus visible, un label par champ, résultats
  annoncés en `aria-live`, `prefers-reduced-motion` respecté.
- **Interface en français.**

## Exemple de démonstration « NØRVA »

Un bouton « Exemple » charge une configuration de démonstration.

- Couleurs : `[À REMPLIR : HEX 1]` `[À REMPLIR : HEX 2]` `[À REMPLIR : HEX 3]` `[À REMPLIR : HEX 4]`
- Police titres : **Manrope**, graisse `[À REMPLIR]`
- Police texte : **Cormorant Garamond**, graisse `[À REMPLIR]`

> Ces valeurs sont à confirmer par Ewan avant d'écrire l'écran de démonstration.

## Pied de page

« Conçu et développé par Ewan Pineau, designer en recherche d'alternance »
+ lien vers `pineauewan.com` + lien vers le dépôt GitHub.

## Méthode de travail

- On avance **étape par étape**. Ewan envoie un prompt par étape.
  **Attendre son feu vert entre chaque étape.** Ne pas prendre d'avance.
- Tenir `JOURNAL.md` à jour : pour chaque étape, ce qui a été fait, le temps passé,
  les problèmes rencontrés, et ce qu'Ewan a corrigé. Ce fichier servira à écrire
  le post LinkedIn de lancement.

## Qui est Ewan

Ewan Pineau, designer graphique et web, 5 ans de freelance.
Bachelor Chef de Projet Digital à YNOV Rennes, en recherche d'alternance.
L'outil sera lancé sur LinkedIn : il doit être utile dès la première minute,
irréprochable visuellement, et prouver une capacité à concevoir un produit —
pas seulement un écran.

## Règles d'architecture

- `src/core/` est du **TypeScript pur** : aucune importation de React, aucun accès
  au DOM (sauf `core/export/png.ts`). C'est là que vit toute la logique métier.
  L'interface n'est qu'une couche de rendu au-dessus.
- La **configuration (`BrandConfig`) est l'unique source de vérité**. L'URL en est
  une sérialisation, jamais un second état.
- Le **décodage d'URL ne lève jamais d'exception** : toute valeur invalide retombe
  sur la valeur par défaut. Une URL tronquée doit produire une charte valide.
- Une famille de police n'est chargée que si son nom figure dans
  `google-fonts.json`. On ne construit jamais une URL `css2` à partir d'une chaîne
  arbitraire venue de l'URL partagée.

## Commandes

- `npm run dev` — serveur de développement
- `npm run build` — vérification TypeScript + build de production
- `npm run lint` — oxlint
