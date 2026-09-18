/**
 * Types partagés par tout le moteur de calcul.
 *
 * Règle de ce dossier : `src/lib/` est du TypeScript pur.
 * Aucun import React, aucun accès au DOM. Tout y est testable sans navigateur.
 */

/** Une couleur en OKLCH. `h` vaut 0 pour les couleurs achromatiques. */
export type OklchColor = {
  /** Clarté perceptuelle, 0 → 1 */
  l: number
  /** Chroma, 0 → ~0.4 dans le gamut sRGB */
  c: number
  /** Teinte en degrés, 0 → 360 */
  h: number
}

/** Résultat d'un `parseColor` réussi. */
export type ParsedColor = {
  /** La chaîne saisie, telle quelle. */
  input: string
  /** La syntaxe reconnue. */
  format: 'hex' | 'rgb' | 'hsl' | 'oklch'
  /** La couleur, ramenée dans le gamut sRGB. */
  oklch: OklchColor
  /** Notation hexadécimale sur 6 chiffres, en minuscules, préfixée de `#`. */
  hex: string
  /**
   * Vrai si la couleur saisie sortait du gamut sRGB et a dû y être ramenée.
   * Arrive avec des `oklch()` copiés depuis un outil de design grand gamut.
   */
  clamped: boolean
}

/**
 * Résultat d'une opération qui peut échouer sur une saisie utilisateur.
 * On renvoie l'erreur, on ne la lève pas : une saisie invalide est un cas
 * normal de la vie d'un formulaire, pas un bug.
 */
export type Result<T> = { ok: true; value: T } | { ok: false; error: string }

/** Les onze paliers d'une échelle, du plus clair au plus foncé. */
export const SCALE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
export type ScaleStep = (typeof SCALE_STEPS)[number]

/** Un palier d'une échelle de couleur. */
export type Swatch = {
  step: ScaleStep
  /** Notation hexadécimale sur 6 chiffres, en minuscules. */
  hex: string
  /** La couleur telle qu'elle sort réellement, re-dérivée depuis `hex`. */
  oklch: OklchColor
  /** Notation CSS `oklch(...)`, prête à coller. */
  css: string
  /** Vrai sur le palier où la couleur saisie a été ancrée. */
  isSource: boolean
}

/** Une échelle complète, dérivée d'une couleur. */
export type ColorScale = {
  /** La couleur saisie, telle qu'elle a été interprétée. */
  source: ParsedColor
  /** Le palier sur lequel la couleur saisie a été ancrée. */
  anchor: ScaleStep
  /** Onze paliers, du plus clair (50) au plus foncé (950). */
  swatches: Swatch[]
}

/** Verdict d'accessibilité pour une taille de texte donnée. */
export type Verdict = 'AAA' | 'AA' | 'échec'

export type LevelResult = {
  aa: boolean
  aaa: boolean
  verdict: Verdict
  /** Le ratio minimum exigé pour atteindre AA à cette taille. */
  seuilAA: number
  /** Le ratio minimum exigé pour atteindre AAA à cette taille. */
  seuilAAA: number
}

/** Évaluation complète d'une paire de couleurs. */
export type PairEvaluation = {
  /**
   * Ratio de contraste, tronqué à deux décimales.
   *
   * Tronqué et non arrondi : un ratio de 4,4996 affiché « 4,50 » puis déclaré
   * en échec ressemblerait à un bug, et arrondi vers le haut il produirait un
   * faux succès. La troncature garantit que l'affichage et le verdict
   * s'accordent toujours, sans jamais faire passer une paire qui échoue.
   */
  ratio: number
  /** Ratio brut, non tronqué. Sert aux comparaisons et aux tris. */
  ratioBrut: number
  /** Texte courant : seuils 4,5 (AA) et 7 (AAA). */
  normal: LevelResult
  /** Grand texte, ≥ 24 px ou ≥ 18,66 px en gras : seuils 3 (AA) et 4,5 (AAA). */
  grand: LevelResult
  /**
   * Éléments non textuels — bordures, icônes, états de focus.
   * WCAG 2.1 critère 1.4.11, seuil unique de 3:1.
   */
  interface: { pass: boolean; seuil: number }
}

/** Un niveau de l'échelle typographique. */
export type TypeLevel = {
  /** Identifiant court, utilisable comme nom de token. */
  name: string
  /** Position relative à la base : -2 pour `xs`, 0 pour `base`, +6 pour `5xl`. */
  step: number
  /** Taille en pixels, arrondie à deux décimales. */
  px: number
  /** Taille en rem, relative à la racine du document (16 px par défaut). */
  rem: number
  /** Interlignage conseillé, exprimé en multiple de la taille. */
  lineHeight: number
  /** Le même interlignage, en pixels. */
  lineHeightPx: number
}

export type TypeScale = {
  base: number
  ratio: number
  /** Taille de police racine servant de référence pour les rem. */
  root: number
  levels: TypeLevel[]
}

/** Catégories utilisées par Google Fonts. */
export type FontCategory = 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace'

/** Une police choisie par l'utilisateur. */
export type FontChoice = {
  /** Nom de la famille tel que Google Fonts l'écrit, ex. « Cormorant Garamond ». */
  family: string
  /** Graisse, de 100 à 900 par pas de 100. */
  weight: number
  /**
   * Catégorie de la famille, qui détermine la pile de repli dans les exports.
   *
   * Non sérialisée dans l'URL : elle se re-déduit du catalogue de polices au
   * chargement. Une URL n'a pas à transporter ce qui est déjà connu du dépôt.
   */
  category?: FontCategory
}

/**
 * L'état complet de l'outil.
 *
 * C'est l'unique source de vérité : l'URL en est une sérialisation,
 * jamais un second état.
 */
export type BrandConfig = {
  /** Nom de marque affiché sur le brand board. Peut être vide. */
  name: string
  /** De une à quatre couleurs, en hexadécimal sur 6 chiffres. */
  colors: string[]
  heading: FontChoice
  body: FontChoice
  /** Taille de base en pixels. */
  baseSize: number
  /** Ratio de l'échelle typographique. */
  ratio: number
}
