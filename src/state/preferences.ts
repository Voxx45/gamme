import { createContext, useContext } from 'react'
import type { Deficience } from '../lib'

export type Theme = 'clair' | 'sombre' | 'systeme'

export type Preferences = {
  /** Thème choisi. « systeme » suit le réglage du système d'exploitation. */
  theme: Theme
  /** Thème effectivement appliqué, une fois « systeme » résolu. */
  themeEffectif: 'clair' | 'sombre'
  definirTheme: (t: Theme) => void
  /** Déficience de la vision des couleurs simulée à l'affichage. */
  deficience: Deficience
  definirDeficience: (d: Deficience) => void
}

export const ContextePreferences = createContext<Preferences | null>(null)

export function usePreferences(): Preferences {
  const p = useContext(ContextePreferences)
  if (!p) throw new Error('usePreferences doit être appelé dans un FournisseurPreferences.')
  return p
}

/**
 * Ces deux réglages ne font pas partie de la charte.
 *
 * Ils décrivent la façon de regarder, pas ce qui est regardé : ils n'ont donc
 * rien à faire dans l'URL partagée. Quelqu'un qui reçoit votre lien doit voir
 * votre charte, pas votre thème ni la déficience que vous étiez en train de
 * simuler. Ils vivent en revanche dans le stockage local, parce qu'ils sont
 * durables pour la personne qui les a choisis.
 */
export const CLE_STOCKAGE = 'gamme.preferences'
