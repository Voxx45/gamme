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
  colorNames: [],
  heading: { family: 'Instrument Serif', weight: 400, category: 'serif' },
  body: { family: 'Inter', weight: 400, category: 'sans-serif' },
  baseSize: 16,
  ratio: 1.25,
}

/**
 * L'état complet : la configuration courante, plus de quoi revenir en arrière.
 *
 * L'action principale de l'outil — cliquer une correction proposée — écrase une
 * couleur. Sans pile d'annulation, une exploration coûte la couleur qu'on
 * voulait comparer. Vingt pas suffisent : au delà, on recommence.
 */
export type EtatCharte = {
  config: BrandConfig
  passe: BrandConfig[]
  futur: BrandConfig[]
}

const PROFONDEUR_HISTORIQUE = 20

/** Les actions qui ne modifient pas la charte n'entrent pas dans l'historique. */
const SANS_HISTORIQUE = new Set(['annuler', 'retablir'])

export type Action =
  | { type: 'ajouterCouleur'; hex: string }
  | { type: 'modifierCouleur'; index: number; hex: string }
  | { type: 'supprimerCouleur'; index: number }
  | { type: 'deplacerCouleur'; index: number; vers: number }
  | { type: 'definirNom'; nom: string }
  | { type: 'nommerCouleur'; index: number; nom: string }
  | { type: 'definirPolice'; role: 'heading' | 'body'; famille: string }
  | { type: 'definirGraisse'; role: 'heading' | 'body'; graisse: number }
  | { type: 'definirBase'; taille: number }
  | { type: 'definirRatio'; ratio: number }
  | { type: 'remplacerConfig'; config: BrandConfig }
  | { type: 'annuler' }
  | { type: 'retablir' }

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

/** Le réducteur de la configuration seule, sans historique. */
function appliquer(etat: BrandConfig, action: Action): BrandConfig {
  switch (action.type) {
    case 'ajouterCouleur':
      if (etat.colors.length >= MAX_COULEURS) return etat
      return { ...etat, colors: [...etat.colors, action.hex], colorNames: [...etat.colorNames, ''] }

    case 'nommerCouleur': {
      if (etat.colors[action.index] === undefined) return etat
      const colorNames = [...etat.colorNames]
      colorNames[action.index] = action.nom.slice(0, 20)
      return { ...etat, colorNames }
    }

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
      return {
        ...etat,
        colors: etat.colors.filter((_, i) => i !== action.index),
        colorNames: etat.colorNames.filter((_, i) => i !== action.index),
      }

    case 'deplacerCouleur': {
      const { index, vers } = action
      if (index === vers) return etat
      if (vers < 0 || vers >= etat.colors.length) return etat
      if (etat.colors[index] === undefined) return etat
      const colors = [...etat.colors]
      const [deplacee] = colors.splice(index, 1)
      colors.splice(vers, 0, deplacee!)
      // Le nom suit sa couleur : sans cela, réordonner échangerait les
      // étiquettes sans échanger les teintes.
      const colorNames = [...etat.colorNames]
      const [nomDeplace] = colorNames.splice(index, 1)
      colorNames.splice(vers, 0, nomDeplace ?? '')
      return { ...etat, colors, colorNames }
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

/** Compare deux configurations sur ce qui compte : leur contenu. */
function identiques(a: BrandConfig, b: BrandConfig): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export const ETAT_INITIAL: EtatCharte = { config: CONFIG_VIDE, passe: [], futur: [] }

/**
 * Le réducteur complet, historique compris.
 *
 * Une action qui ne change rien — retaper la même couleur, relâcher un curseur
 * à sa position — n'empile pas d'entrée : sinon dix annulations seraient
 * nécessaires pour défaire un seul geste.
 */
export function reducteur(etat: EtatCharte, action: Action): EtatCharte {
  if (action.type === 'annuler') {
    const precedent = etat.passe.at(-1)
    if (!precedent) return etat
    return {
      config: precedent,
      passe: etat.passe.slice(0, -1),
      futur: [etat.config, ...etat.futur].slice(0, PROFONDEUR_HISTORIQUE),
    }
  }

  if (action.type === 'retablir') {
    const suivant = etat.futur[0]
    if (!suivant) return etat
    return {
      config: suivant,
      passe: [...etat.passe, etat.config].slice(-PROFONDEUR_HISTORIQUE),
      futur: etat.futur.slice(1),
    }
  }

  const config = appliquer(etat.config, action)
  if (identiques(config, etat.config)) return etat

  return {
    config,
    passe: [...etat.passe, etat.config].slice(-PROFONDEUR_HISTORIQUE),
    // Toute action neuve coupe la branche de rétablissement : c'est le
    // comportement attendu partout ailleurs, on ne va pas le réinventer.
    futur: SANS_HISTORIQUE.has(action.type) ? etat.futur : [],
  }
}
