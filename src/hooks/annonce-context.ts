import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

export type Annonceur = (message: string, urgence?: 'polie' | 'immediate') => void

export const ContexteAnnonce = createContext<Annonceur>(() => {})

export function useAnnonce(): Annonceur {
  return useContext(ContexteAnnonce)
}

/**
 * Annonce un message, mais seulement quand il s'est stabilisé.
 *
 * Les résultats se recalculent à chaque frappe. Sans ce délai, un lecteur
 * d'écran réciterait la matrice de contrastes lettre après lettre.
 */
export function useAnnonceDifferee(message: string, delai = 900): void {
  const annoncer = useAnnonce()
  const premier = useRef(true)

  useEffect(() => {
    if (premier.current) {
      premier.current = false
      return
    }
    const t = setTimeout(() => annoncer(message), delai)
    return () => clearTimeout(t)
  }, [message, delai, annoncer])
}

/** Copie dans le presse-papiers, avec confirmation visuelle et annonce. */
export function useCopie(delaiConfirmation = 1800) {
  const annoncer = useAnnonce()
  const [copie, setCopie] = useState<string | null>(null)
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (minuteur.current) clearTimeout(minuteur.current)
    },
    [],
  )

  const copier = useCallback(
    async (texte: string, identifiant: string, libelle: string) => {
      try {
        await navigator.clipboard.writeText(texte)
        setCopie(identifiant)
        annoncer(`${libelle} copié.`, 'immediate')
        if (minuteur.current) clearTimeout(minuteur.current)
        minuteur.current = setTimeout(() => setCopie(null), delaiConfirmation)
      } catch {
        annoncer(`La copie de ${libelle} a échoué. Sélectionnez le texte à la main.`, 'immediate')
      }
    },
    [annoncer, delaiConfirmation],
  )

  return useMemo(() => ({ copier, copie }), [copier, copie])
}
