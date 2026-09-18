import { useSyncExternalStore } from 'react'

/**
 * Suit une media query, sans effet ni rendu supplémentaire.
 *
 * Sert à ne monter qu'une seule disposition. Afficher les deux et en masquer
 * une en CSS était plus simple, mais montait chaque panneau en double : deux
 * fois le calcul, et surtout des `id` en double, ce qui casse les `aria-controls`
 * et fait pointer un onglet vers le mauvais volet pour un lecteur d'écran.
 */
export function useMediaQuery(requete: string): boolean {
  return useSyncExternalStore(
    (rappel) => {
      if (typeof window === 'undefined') return () => {}
      const liste = window.matchMedia(requete)
      liste.addEventListener('change', rappel)
      return () => liste.removeEventListener('change', rappel)
    },
    () => (typeof window === 'undefined' ? false : window.matchMedia(requete).matches),
    () => false,
  )
}

/** Le seuil au delà duquel l'outil passe en deux colonnes et en onglets. */
export const GRAND_ECRAN = '(min-width: 1024px)'
