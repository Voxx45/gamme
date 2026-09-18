import type { TypeLevel, TypeScale } from '../types'

/**
 * Les niveaux de l'échelle, exprimés en pas relatifs à la taille de base.
 * `base` est le texte courant ; en dessous les mentions et légendes,
 * au dessus les titres jusqu'au niveau d'affichage.
 */
export const NIVEAUX: readonly { name: string; step: number }[] = [
  { name: 'xs', step: -2 },
  { name: 'sm', step: -1 },
  { name: 'base', step: 0 },
  { name: 'lg', step: 1 },
  { name: 'xl', step: 2 },
  { name: '2xl', step: 3 },
  { name: '3xl', step: 4 },
  { name: '4xl', step: 5 },
  { name: '5xl', step: 6 },
]

/** Les quatre ratios proposés par l'interface. */
export const RATIOS = [1.2, 1.25, 1.333, 1.5] as const

/** Bornes acceptées, au delà desquelles l'échelle n'a plus de sens pratique. */
export const BORNES = {
  base: { min: 12, max: 24 },
  ratio: { min: 1.05, max: 2 },
  root: { min: 8, max: 32 },
} as const

const INTERLIGNE = { min: 1.05, max: 1.6 } as const

function arrondir(n: number, decimales: number): number {
  const f = 10 ** decimales
  return Math.round(n * f) / f
}

/**
 * Interlignage conseillé pour une taille donnée, en multiple de cette taille.
 *
 * L'interlignage doit diminuer quand la taille augmente : un titre de 48 px avec
 * l'interlignage d'un paragraphe se désagrège en lignes flottantes, et
 * inversement un texte courant trop serré devient pénible à lire — ce qui est un
 * vrai enjeu d'accessibilité, pas seulement de goût.
 *
 * La décroissance est logarithmique, calée pour donner 1,55 à 16 px, environ 1,3
 * à 32 px et 1,1 vers 64 px, puis bornée à [1,05 ; 1,60].
 */
export function interligneConseille(px: number): number {
  const brut = 1.55 - 0.32 * Math.log(px / 16)
  return arrondir(Math.min(INTERLIGNE.max, Math.max(INTERLIGNE.min, brut)), 2)
}

function borner(valeur: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, valeur))
}

/**
 * Calcule l'échelle typographique pour une taille de base et un ratio.
 *
 * Les rem sont relatifs à la taille de police racine du document, 16 px par
 * défaut — et non à la taille de base. C'est ce qui permet à l'échelle de suivre
 * le réglage de taille de texte du navigateur, que certaines personnes
 * augmentent : exprimer les tailles en rem par rapport à la racine, c'est la
 * condition pour que le zoom texte fonctionne.
 *
 * Les valeurs hors bornes sont ramenées dans les bornes plutôt que refusées :
 * cette fonction est appelée en continu pendant qu'on manipule un curseur.
 */
export function typeScale(base: number, ratio: number, root = 16): TypeScale {
  if (!Number.isFinite(base) || !Number.isFinite(ratio) || !Number.isFinite(root)) {
    throw new Error('typeScale attend des nombres finis pour la base, le ratio et la racine.')
  }

  const b = borner(base, BORNES.base.min, BORNES.base.max)
  const r = borner(ratio, BORNES.ratio.min, BORNES.ratio.max)
  const racine = borner(root, BORNES.root.min, BORNES.root.max)

  const levels: TypeLevel[] = NIVEAUX.map(({ name, step }): TypeLevel => {
    const px = arrondir(b * r ** step, 2)
    const lineHeight = interligneConseille(px)
    return {
      name,
      step,
      px,
      rem: arrondir(px / racine, 4),
      lineHeight,
      lineHeightPx: arrondir(px * lineHeight, 2),
    }
  })

  return { base: b, ratio: r, root: racine, levels }
}
