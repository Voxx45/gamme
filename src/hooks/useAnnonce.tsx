import { useCallback, useState, type ReactNode } from 'react'
import { ContexteAnnonce, type Annonceur } from './annonce-context'

/**
 * Espace fine insécable, invisible à l'affichage.
 *
 * Réémettre un message identique dans une région `aria-live` ne déclenche
 * aucune lecture : le texte du DOM n'a pas changé. On alterne donc avec cette
 * espace pour forcer la relecture d'une confirmation répétée.
 */
const ESPACE_FINE = String.fromCharCode(0x202f)

/**
 * Une seule région `aria-live` pour toute l'application.
 *
 * Deux régions, en réalité : « polie » pour les résultats qui se recalculent,
 * « immédiate » pour les confirmations d'action comme une copie. Multiplier les
 * régions vivantes dans la page rend leur ordre de lecture imprévisible.
 */
export function FournisseurAnnonces({ children }: { children: ReactNode }) {
  const [polie, setPolie] = useState('')
  const [immediate, setImmediate] = useState('')

  const annoncer = useCallback<Annonceur>((message, urgence = 'polie') => {
    const forcer = (precedent: string) => (precedent === message ? message + ESPACE_FINE : message)
    if (urgence === 'immediate') setImmediate(forcer)
    else setPolie(forcer)
  }, [])

  return (
    <ContexteAnnonce.Provider value={annoncer}>
      {children}
      <div className="visuellement-masque" aria-live="polite" aria-atomic="true">
        {polie}
      </div>
      <div className="visuellement-masque" role="status" aria-live="assertive" aria-atomic="true">
        {immediate}
      </div>
    </ContexteAnnonce.Provider>
  )
}
