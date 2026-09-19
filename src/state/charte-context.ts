import { createContext, useContext } from 'react'
import type { Charte } from '../lib'
import type { BrandConfig } from '../lib/types'
import type { Action } from './charte-reducer'

export type ValeurCharte = {
  config: BrandConfig
  charte: Charte
  /** Vrai tant qu'aucune couleur n'a été saisie : c'est l'état vide. */
  vide: boolean
  envoyer: (action: Action) => void
  chargerExemple: () => void
  reinitialiser: () => void
  /** Vrai s'il y a quelque chose à annuler, respectivement à rétablir. */
  peutAnnuler: boolean
  peutRetablir: boolean
  annuler: () => void
  retablir: () => void
  /** Couleurs verrouillées, par position. */
  verrous: boolean[]
}

export const ContexteCharte = createContext<ValeurCharte | null>(null)

export function useCharte(): ValeurCharte {
  const v = useContext(ContexteCharte)
  if (!v) throw new Error('useCharte doit être appelé dans un FournisseurCharte.')
  return v
}
