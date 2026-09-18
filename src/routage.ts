import { useSyncExternalStore } from 'react'

/**
 * Un routage minuscule, sur deux chemins.
 *
 * L'outil n'a que deux pages : l'atelier et « à propos ». Une bibliothèque de
 * routage coûterait plus cher en poids qu'elle ne rapporterait — d'autant que
 * la configuration vit déjà dans le fragment de l'URL, qui n'est pas du ressort
 * d'un routeur.
 */

const abonnes = new Set<() => void>()

function prevenir() {
  for (const a of abonnes) a()
}

function souscrire(rappel: () => void) {
  abonnes.add(rappel)
  window.addEventListener('popstate', rappel)
  return () => {
    abonnes.delete(rappel)
    window.removeEventListener('popstate', rappel)
  }
}

/** Le chemin courant, sans barre oblique finale. */
export function useChemin(): string {
  return useSyncExternalStore(
    souscrire,
    () => window.location.pathname.replace(/\/+$/, '') || '/',
    () => '/',
  )
}

export function naviguer(vers: string) {
  if (window.location.pathname === vers) return
  // On ne garde pas le fragment en changeant de page : la configuration d'une
  // charte n'a aucun sens sur la page « à propos ».
  window.history.pushState(null, '', vers)
  window.scrollTo(0, 0)
  prevenir()
}
