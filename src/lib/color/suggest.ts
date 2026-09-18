import type { ColorScale, Swatch } from '../types'
import { contrastRatio, SEUILS } from './contrast'

export type NiveauVise = 'AA' | 'AAA'
export type TailleTexte = 'normal' | 'grand'

export type SuggestionOptions = {
  /** Niveau visé. AA par défaut. */
  niveau?: NiveauVise
  /** Taille de texte visée. Texte courant par défaut. */
  taille?: TailleTexte
}

export type Suggestion = {
  /** Le palier proposé. */
  step: number
  hex: string
  /** Ratio obtenu avec ce palier, tronqué à deux décimales. */
  ratio: number
  /** Écart en nombre de paliers. Positif si la suggestion est plus foncée. */
  ecart: number
  /** Le palier d'origine, celui qui échouait. */
  depuis: number
}

function seuil(niveau: NiveauVise, taille: TailleTexte): number {
  return taille === 'grand'
    ? niveau === 'AAA'
      ? SEUILS.grand.aaa
      : SEUILS.grand.aa
    : niveau === 'AAA'
      ? SEUILS.normal.aaa
      : SEUILS.normal.aa
}

/**
 * Pour une paire qui échoue, cherche dans l'échelle de l'une des deux couleurs
 * la nuance la plus proche — même teinte, donc même identité visuelle — qui
 * atteint le niveau visé face à l'autre couleur, laissée inchangée.
 *
 * « La plus proche » se mesure en nombre de paliers : c'est l'unité dans
 * laquelle raisonne la personne qui utilise l'outil. À écart égal entre une
 * nuance plus claire et une plus foncée, on départage sur la clarté OKLCH
 * réelle, puis on privilégie la plus foncée — plus sûre sur les fonds clairs,
 * qui sont le cas courant.
 *
 * Renvoie `null` si aucune nuance de l'échelle n'y parvient : dans ce cas c'est
 * l'autre couleur qu'il faut bouger, et l'interface doit le dire plutôt que de
 * proposer un pis-aller.
 *
 * @param scale    L'échelle de la couleur que l'on s'autorise à déplacer.
 * @param depuis   Le palier actuellement utilisé (50 … 950).
 * @param contre   L'autre couleur de la paire, en hexadécimal. Elle ne bouge pas.
 */
export function suggestAccessible(
  scale: ColorScale,
  depuis: number,
  contre: string,
  options: SuggestionOptions = {},
): Suggestion | null {
  const { niveau = 'AA', taille = 'normal' } = options
  const cible = seuil(niveau, taille)

  const iDepuis = scale.swatches.findIndex((s) => s.step === depuis)
  if (iDepuis === -1) return null

  const origine = scale.swatches[iDepuis]!

  let meilleur: { swatch: Swatch; index: number; ratio: number } | null = null

  for (let i = 0; i < scale.swatches.length; i++) {
    if (i === iDepuis) continue
    const swatch = scale.swatches[i]!
    const ratio = contrastRatio(swatch.hex, contre)
    if (ratio < cible) continue

    if (meilleur === null) {
      meilleur = { swatch, index: i, ratio }
      continue
    }

    const distance = Math.abs(i - iDepuis)
    const distanceMeilleure = Math.abs(meilleur.index - iDepuis)

    if (distance < distanceMeilleure) {
      meilleur = { swatch, index: i, ratio }
    } else if (distance === distanceMeilleure) {
      const ecartClarte = Math.abs(swatch.oklch.l - origine.oklch.l)
      const ecartClarteMeilleure = Math.abs(meilleur.swatch.oklch.l - origine.oklch.l)
      if (ecartClarte < ecartClarteMeilleure) {
        meilleur = { swatch, index: i, ratio }
      } else if (ecartClarte === ecartClarteMeilleure && i > meilleur.index) {
        // À égalité parfaite, on prend la plus foncée.
        meilleur = { swatch, index: i, ratio }
      }
    }
  }

  if (!meilleur) return null

  return {
    step: meilleur.swatch.step,
    hex: meilleur.swatch.hex,
    ratio: Math.floor(meilleur.ratio * 100) / 100,
    ecart: meilleur.index - iDepuis,
    depuis,
  }
}
