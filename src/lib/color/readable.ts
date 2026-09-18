import { contrastRatio } from './contrast'

/**
 * Le noir ou le blanc, selon celui qui contraste le plus avec ce fond.
 *
 * Sert à poser un libellé sur une pastille de couleur arbitraire. Le choix du
 * meilleur des deux garantit AA par construction : le pire cas est la clarté où
 * noir et blanc se valent, et ils y donnent encore 4,58:1.
 *
 * Le noir et le blanc **purs**, et non l'encre et le papier de l'interface.
 * Avec `#14130f` et `#faf9f6`, qui sont légèrement chauds, ce même pire cas
 * tombe à 4,24:1 — sous le seuil. La nuance a l'air anodine et ne l'est pas.
 */
export function encreLisible(fond: string): '#000000' | '#ffffff' {
  return contrastRatio('#000000', fond) >= contrastRatio('#ffffff', fond) ? '#000000' : '#ffffff'
}
