/**
 * Le moteur de calcul.
 *
 * Tout ce dossier est du TypeScript pur : aucun import React, aucun accès au
 * DOM. L'interface n'est qu'une couche de rendu posée par dessus.
 */

export * from './types'
export * from './charte'

export { formaterOklch, oklchVersHex, parseColor, versOklch } from './color/parse'
export { generateScale, swatchAt } from './color/scale'
export { contrastRatio, evaluatePair, relativeLuminance, SEUILS } from './color/contrast'
export { attenuer } from './color/muted'
export { encreLisible } from './color/readable'
export { suggestAccessible } from './color/suggest'
export type { Suggestion, SuggestionOptions, NiveauVise, TailleTexte } from './color/suggest'

export { BORNES, interligneConseille, NIVEAUX, RATIOS, typeScale } from './typography/scale'

export {
  CONFIG_DEFAUT,
  CONFIG_NORVA,
  decodeState,
  encodeState,
  shareUrl,
  VERSION_URL,
} from './share/state'
export type { DecodeOptions, DecodeResult } from './share/state'

export { toCss } from './export/css'
export type { ExportOptions } from './export/css'
export { toTailwind } from './export/tailwind'
export { toDtcg, toDtcgObject } from './export/dtcg'
export { baseNomFichier } from './export/nom-fichier'
export type { DtcgGroupe, DtcgToken } from './export/dtcg'
