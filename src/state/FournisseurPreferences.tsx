import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Deficience } from '../lib'
import { GRAND_ECRAN } from '../hooks/useMediaQuery'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { CLE_STOCKAGE, ContextePreferences, type Preferences, type Theme } from './preferences'

const THEMES: Theme[] = ['clair', 'sombre', 'systeme']
const DEFICIENCES_VALIDES: Deficience[] = ['normale', 'deuteranopie', 'protanopie', 'tritanopie']

type Stocke = { theme?: string; deficience?: string }

/**
 * Relit les préférences, sans jamais faire confiance à ce qu'on y trouve.
 *
 * Le stockage local est modifiable par n'importe quelle extension, et survit
 * aux changements de format. Une valeur inconnue retombe sur le défaut plutôt
 * que de se propager dans l'interface.
 */
function relire(): { theme: Theme; deficience: Deficience } {
  const defauts = { theme: 'systeme' as Theme, deficience: 'normale' as Deficience }
  if (typeof window === 'undefined') return defauts
  try {
    const brut = window.localStorage.getItem(CLE_STOCKAGE)
    if (!brut) return defauts
    const lu = JSON.parse(brut) as Stocke
    return {
      theme: THEMES.includes(lu.theme as Theme) ? (lu.theme as Theme) : defauts.theme,
      deficience: DEFICIENCES_VALIDES.includes(lu.deficience as Deficience)
        ? (lu.deficience as Deficience)
        : defauts.deficience,
    }
  } catch {
    // Mode privé, stockage bloqué, JSON corrompu : on continue avec les défauts.
    return defauts
  }
}

export function FournisseurPreferences({ children }: { children: ReactNode }) {
  const [{ theme, deficience }, setEtat] = useState(relire)
  const systemeSombre = useMediaQuery('(prefers-color-scheme: dark)')

  const themeEffectif: 'clair' | 'sombre' =
    theme === 'systeme' ? (systemeSombre ? 'sombre' : 'clair') : theme

  /** Le thème s'applique par un attribut sur `<html>`, que le CSS écoute. */
  useEffect(() => {
    const racine = document.documentElement
    racine.dataset.theme = themeEffectif
    // La barre d'adresse des navigateurs mobiles suit `theme-color`.
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', themeEffectif === 'sombre' ? '#14130f' : '#faf9f6')
  }, [themeEffectif])

  useEffect(() => {
    try {
      window.localStorage.setItem(CLE_STOCKAGE, JSON.stringify({ theme, deficience }))
    } catch {
      // Stockage indisponible : le réglage vaut pour la session, c'est tout.
    }
  }, [theme, deficience])

  const definirTheme = useCallback((t: Theme) => setEtat((e) => ({ ...e, theme: t })), [])
  const definirDeficience = useCallback((d: Deficience) => setEtat((e) => ({ ...e, deficience: d })), [])

  const valeur = useMemo<Preferences>(
    () => ({ theme, themeEffectif, definirTheme, deficience, definirDeficience }),
    [theme, themeEffectif, definirTheme, deficience, definirDeficience],
  )

  return <ContextePreferences.Provider value={valeur}>{children}</ContextePreferences.Provider>
}

export { GRAND_ECRAN }
