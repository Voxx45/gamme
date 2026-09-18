import catalogue from './google-fonts.json'
import type { FontCategory } from '../lib/types'

export type FontEntry = {
  family: string
  category: FontCategory
  /** Graisses statiques réellement servies par Google Fonts pour cette famille. */
  weights: number[]
}

/** Le catalogue embarqué dans le dépôt. Aucune requête à l'API Google Fonts. */
export const FONTS: readonly FontEntry[] = catalogue as FontEntry[]

const PAR_FAMILLE = new Map(FONTS.map((f) => [f.family, f]))

/** Les noms du catalogue, dans l'ordre alphabétique. */
export const FAMILLES: readonly string[] = FONTS.map((f) => f.family)

export function trouverFont(family: string): FontEntry | undefined {
  return PAR_FAMILLE.get(family)
}

/**
 * Cale une graisse sur ce que la famille sert réellement.
 *
 * Demander une graisse qui n'existe pas fait échouer la requête `css2` et la
 * police ne se charge pas du tout : mieux vaut servir la graisse voisine.
 */
export function graisseDisponible(family: string, souhaitee: number): number {
  const entree = PAR_FAMILLE.get(family)
  if (!entree || entree.weights.length === 0) return 400
  let meilleure = entree.weights[0]!
  for (const w of entree.weights) {
    if (Math.abs(w - souhaitee) < Math.abs(meilleure - souhaitee)) meilleure = w
  }
  return meilleure
}

export const ETIQUETTES_CATEGORIE: Record<FontCategory, string> = {
  'sans-serif': 'Linéale',
  serif: 'Serif',
  display: 'Titrage',
  handwriting: 'Manuscrite',
  monospace: 'Chasse fixe',
}
