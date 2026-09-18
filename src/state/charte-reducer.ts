import { graisseDisponible, trouverFont } from '../data/fonts'
import type { BrandConfig, FontChoice } from '../lib/types'

export const MAX_COULEURS = 4

/**
 * La configuration de départ d'une première visite : vide.
 *
 * Servir une palette par défaut donnerait l'illusion d'un résultat que personne
 * n'a demandé. Mieux vaut un état vide assumé, avec deux portes d'entrée :
 * ajouter sa première couleur, ou charger l'exemple.
 */
export const CONFIG_VIDE: BrandConfig = {
  name: '',
  colors: [],
  heading: { family: 'Instrument Serif', weight: 400, category: 'serif' },
  body: { family: 'Inter', weight: 400, category: 'sans-serif' },
  baseSize: 16,
  ratio: 1.25,
}

export type Action =
  | { type: 'ajouterCouleur'; hex: string }
  | { type: 'modifierCouleur'; index: number; hex: string }
  | { type: 'supprimerCouleur'; index: number }
  | { type: 'deplacerCouleur'; index: number; vers: number }
  | { type: 'definirNom'; nom: string }
  | { type: 'definirPolice'; role: 'heading' | 'body'; famille: string }
  | { type: 'definirGraisse'; role: 'heading' | 'body'; graisse: number }
  | { type: 'definirBase'; taille: number }
  | { type: 'definirRatio'; ratio: number }
  | { type: 'remplacerConfig'; config: BrandConfig }

/** Complète une police du catalogue avec sa catégorie et une graisse servie. */
export function normaliserPolice(famille: string, graisse: number): FontChoice {
  const entree = trouverFont(famille)
  return {
    family: entree ? famille : 'Inter',
    weight: graisseDisponible(entree ? famille : 'Inter', graisse),
    category: entree?.category ?? 'sans-serif',
  }
}

/** Remet une configuration décodée en phase avec le catalogue de polices. */
export function avecPolicesDuCatalogue(config: BrandConfig): BrandConfig {
  return {
    ...config,
    heading: normaliserPolice(config.heading.family, config.heading.weight),
    body: normaliserPolice(config.body.family, config.body.weight),
  }
}

export function reducteur(etat: BrandConfig, action: Action): BrandConfig {
  switch (action.type) {
    case 'ajouterCouleur':
      if (etat.colors.length >= MAX_COULEURS) return etat
      return { ...etat, colors: [...etat.colors, action.hex] }

    case 'modifierCouleur': {
      if (etat.colors[action.index] === undefined) return etat
      const colors = [...etat.colors]
      colors[action.index] = action.hex
      return { ...etat, colors }
    }

    case 'supprimerCouleur':
      // On ne descend jamais sous une couleur une fois la charte commencée :
      // l'état vide est un point de départ, pas un état où l'on retombe.
      if (etat.colors.length <= 1) return etat
      return { ...etat, colors: etat.colors.filter((_, i) => i !== action.index) }

    case 'deplacerCouleur': {
      const { index, vers } = action
      if (index === vers) return etat
      if (vers < 0 || vers >= etat.colors.length) return etat
      if (etat.colors[index] === undefined) return etat
      const colors = [...etat.colors]
      const [deplacee] = colors.splice(index, 1)
      colors.splice(vers, 0, deplacee!)
      return { ...etat, colors }
    }

    case 'definirNom':
      return { ...etat, name: action.nom.slice(0, 32) }

    case 'definirPolice':
      return { ...etat, [action.role]: normaliserPolice(action.famille, etat[action.role].weight) }

    case 'definirGraisse':
      return { ...etat, [action.role]: normaliserPolice(etat[action.role].family, action.graisse) }

    case 'definirBase':
      return { ...etat, baseSize: action.taille }

    case 'definirRatio':
      return { ...etat, ratio: action.ratio }

    case 'remplacerConfig':
      return action.config

    default:
      return etat
  }
}
