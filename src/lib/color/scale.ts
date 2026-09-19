import { SCALE_STEPS, type ColorScale, type OklchColor, type ParsedColor, type ScaleStep, type Swatch } from '../types'
import { formaterOklch, oklchVersHex, parseColor, versOklch } from './parse'

/**
 * Courbe de clarté de référence, en OKLCH, du palier 50 au palier 950.
 *
 * Elle n'est pas linéaire : l'œil distingue mieux les écarts dans les tons
 * clairs, donc les paliers hauts sont resserrés et les paliers bas espacés.
 * Ces valeurs sont calées sur les palettes de Tailwind v4, qui sont elles-mêmes
 * exprimées en OKLCH — un choix familier aux développeurs qui recevront l'export.
 */
const CLARTE: readonly number[] = [0.971, 0.936, 0.885, 0.809, 0.707, 0.623, 0.546, 0.488, 0.424, 0.379, 0.282]

/**
 * Courbe de chroma, en cloche, avec un maximum au palier 500.
 *
 * Les extrémités sont volontairement désaturées : un palier 50 très chromatique
 * vire au fluo, un palier 950 très chromatique devient boueux. Ces facteurs sont
 * relatifs — ils sont normalisés sur le palier d'ancrage, si bien qu'une couleur
 * sourde produit une échelle sourde et une couleur vive une échelle vive.
 */
const CHROMA: readonly number[] = [0.20, 0.35, 0.58, 0.80, 0.95, 1.0, 0.97, 0.88, 0.76, 0.66, 0.44]

/**
 * Plafond d'amplification du chroma, relatif à la couleur saisie.
 *
 * Sans lui, une couleur foncée ou très claire s'ancre à une extrémité de la
 * courbe, où le facteur est faible, et la normalisation amplifie le milieu de
 * l'échelle d'un facteur qui peut atteindre cinq. Un marine d'encre ressortait
 * ainsi en bleu bleuet au palier 500 : la rampe restait cohérente en teinte,
 * mais avait cessé d'être la même couleur.
 *
 * 1,6 laisse assez de latitude pour des tons moyens utilisables, et retient
 * l'échelle dans la famille de la couleur d'origine. Le plafond s'applique au
 * résultat, pas à la normalisation : il ne peut donc jamais creuser de bosse
 * sous la couleur saisie, seulement aplatir le sommet de la cloche.
 */
const PLAFOND_CHROMA = 1.6

/** Trouve l'index du palier dont la clarté de référence est la plus proche de `l`. */
function indexAncrage(l: number): number {
  let meilleur = 0
  let ecartMin = Infinity
  for (let i = 0; i < CLARTE.length; i++) {
    const ecart = Math.abs(CLARTE[i]! - l)
    if (ecart < ecartMin) {
      ecartMin = ecart
      meilleur = i
    }
  }
  return meilleur
}

/**
 * Construit l'échelle 50 → 950 d'une couleur.
 *
 * Deux garanties tiennent tout le reste de l'outil :
 *
 * 1. **La couleur saisie est restituée telle quelle** sur le palier dont la
 *    clarté est la plus proche. On remplace la clarté de référence de ce palier
 *    par celle de la couleur, et on normalise le chroma sur ce même palier.
 *    Comme le palier retenu est le plus proche, la couleur reste forcément
 *    comprise entre ses deux voisins : la monotonie de l'échelle est préservée
 *    sans avoir à la corriger après coup.
 *
 * 2. **Aucun palier ne s'éloigne de la couleur saisie.** Le chroma est modulé
 *    en cloche, mais plafonné à `PLAFOND_CHROMA` fois celui de la couleur
 *    d'origine : l'échelle reste dans sa famille.
 *
 * 3. **Aucun palier ne sort du gamut sRGB.** Chaque palier est ramené dans le
 *    gamut par l'algorithme de CSS Color 4, puis son OKLCH est re-dérivé depuis
 *    l'hexadécimal obtenu — la notation `oklch()` exportée décrit donc toujours
 *    la couleur réellement affichée, et non une intention théorique.
 */
export function generateScale(couleur: string | ParsedColor): ColorScale {
  const source: ParsedColor =
    typeof couleur === 'string'
      ? (() => {
          const r = parseColor(couleur)
          if (!r.ok) throw new Error(r.error)
          return r.value
        })()
      : couleur

  const { l, c, h } = source.oklch
  const ancre = indexAncrage(l)
  const facteurAncre = CHROMA[ancre]!

  const swatches: Swatch[] = SCALE_STEPS.map((step, i): Swatch => {
    const estAncre = i === ancre

    // Sur le palier d'ancrage, la couleur d'origine passe telle quelle.
    const vise: OklchColor = estAncre
      ? { l, c, h }
      : {
          l: CLARTE[i]!,
          c: Math.min((c * CHROMA[i]!) / facteurAncre, c * PLAFOND_CHROMA),
          h,
        }

    const hex = oklchVersHex(vise)
    const reel = versOklch(hex) ?? vise

    return {
      step: step as ScaleStep,
      hex,
      oklch: reel,
      css: formaterOklch(reel),
      isSource: estAncre,
    }
  })

  return { source, anchor: SCALE_STEPS[ancre]!, swatches }
}

/** Renvoie le palier demandé d'une échelle, ou `undefined` s'il n'existe pas. */
export function swatchAt(scale: ColorScale, step: number): Swatch | undefined {
  return scale.swatches.find((s) => s.step === step)
}
