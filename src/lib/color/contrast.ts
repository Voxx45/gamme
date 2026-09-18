import { converter } from 'culori'
import type { LevelResult, PairEvaluation, Verdict } from '../types'

const toRgb = converter('rgb')

/** Seuils WCAG 2.x, en ratio de contraste. */
export const SEUILS = {
  normal: { aa: 4.5, aaa: 7 },
  grand: { aa: 3, aaa: 4.5 },
  /** WCAG 2.1, critère 1.4.11 — éléments non textuels. */
  interface: 3,
} as const

/**
 * Linéarise un canal sRGB.
 * Formule de WCAG 2.x, § « relative luminance ».
 */
function lineariser(canal: number): number {
  return canal <= 0.04045 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4
}

/**
 * Luminance relative d'une couleur, au sens de WCAG 2.x.
 *
 * Attention : ce n'est pas la clarté OKLCH. La luminance relative est une
 * moyenne pondérée des canaux sRGB linéarisés ; la clarté OKLCH est perceptuelle.
 * Les confondre donnerait de faux verdicts sur un outil qui ne parle que de ça.
 */
export function relativeLuminance(couleur: string): number {
  const rgb = toRgb(couleur)
  if (!rgb) throw new Error(`Couleur illisible : « ${couleur} ».`)
  const r = lineariser(Math.min(1, Math.max(0, rgb.r)))
  const g = lineariser(Math.min(1, Math.max(0, rgb.g)))
  const b = lineariser(Math.min(1, Math.max(0, rgb.b)))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Ratio de contraste WCAG 2.x entre deux couleurs, de 1 à 21.
 *
 * L'ordre des arguments n'a pas d'importance : le contraste est symétrique.
 * Les deux couleurs doivent être valides — à ce stade elles sortent de
 * `parseColor`, donc une couleur illisible est un bug, pas une saisie.
 */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const claire = Math.max(la, lb)
  const sombre = Math.min(la, lb)
  return (claire + 0.05) / (sombre + 0.05)
}

/**
 * Tronque à deux décimales.
 *
 * Tronqué et non arrondi : arrondir 4,4996 donnerait « 4,50 » pour une paire
 * qui échoue — soit un affichage qui contredit son propre verdict, soit un faux
 * succès. La troncature garantit que `ratio >= seuil` et l'affichage racontent
 * toujours la même chose.
 */
function tronquer(n: number): number {
  return Math.floor(n * 100) / 100
}

function evaluerNiveau(ratio: number, seuilAA: number, seuilAAA: number): LevelResult {
  const aaa = ratio >= seuilAAA
  const aa = ratio >= seuilAA
  const verdict: Verdict = aaa ? 'AAA' : aa ? 'AA' : 'échec'
  return { aa, aaa, verdict, seuilAA, seuilAAA }
}

/**
 * Évalue une paire texte/fond : ratio et verdicts AA / AAA,
 * pour le texte courant comme pour le grand texte.
 *
 * « Grand texte » au sens de WCAG : au moins 24 px, ou 18,66 px en gras.
 */
export function evaluatePair(texte: string, fond: string): PairEvaluation {
  const ratioBrut = contrastRatio(texte, fond)
  return {
    ratio: tronquer(ratioBrut),
    ratioBrut,
    normal: evaluerNiveau(ratioBrut, SEUILS.normal.aa, SEUILS.normal.aaa),
    grand: evaluerNiveau(ratioBrut, SEUILS.grand.aa, SEUILS.grand.aaa),
    interface: { pass: ratioBrut >= SEUILS.interface, seuil: SEUILS.interface },
  }
}
