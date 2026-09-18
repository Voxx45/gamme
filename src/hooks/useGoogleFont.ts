import { useEffect } from 'react'
import { graisseDisponible, trouverFont } from '../data/fonts'

/**
 * Familles déjà demandées, pour ne jamais injecter deux fois la même balise.
 * Au niveau du module : le cache doit survivre au démontage des composants.
 */
const dejaChargees = new Set<string>()

function cle(family: string, weights: number[]): string {
  return `${family}:${[...weights].sort((a, b) => a - b).join(',')}`
}

/**
 * Charge une famille Google Fonts via l'URL `css2`, à la demande.
 *
 * Deux garde-fous :
 *
 * — La famille doit figurer dans le catalogue embarqué. Une URL partagée ne peut
 *   donc pas faire construire à l'outil une requête vers une chaîne arbitraire.
 * — Les graisses sont calées sur celles que la famille sert réellement :
 *   demander une graisse inexistante fait échouer toute la requête, et la police
 *   ne se charge pas du tout.
 *
 * On n'utilise pas l'API Google Fonts, qui exige une clé.
 */
export function chargerPolice(family: string, weights: number[] = [400]): void {
  const entree = trouverFont(family)
  if (!entree) return

  const calees = [...new Set(weights.map((w) => graisseDisponible(family, w)))].sort((a, b) => a - b)
  const identifiant = cle(family, calees)
  if (dejaChargees.has(identifiant)) return
  dejaChargees.add(identifiant)

  const lien = document.createElement('link')
  lien.rel = 'stylesheet'
  lien.href =
    'https://fonts.googleapis.com/css2?family=' +
    encodeURIComponent(family).replace(/%20/g, '+') +
    ':wght@' +
    calees.join(';') +
    '&display=swap'
  lien.dataset.police = family
  document.head.appendChild(lien)
}

/** Charge une famille pendant la vie du composant. */
export function useGoogleFont(family: string, weights: number[] = [400]): void {
  const signature = weights.join(',')
  useEffect(() => {
    chargerPolice(family, signature.split(',').map(Number))
  }, [family, signature])
}

/** Pile CSS complète pour une famille du catalogue. */
export function pileCss(family: string): string {
  const entree = trouverFont(family)
  const repli =
    entree?.category === 'serif'
      ? 'serif'
      : entree?.category === 'monospace'
        ? 'monospace'
        : entree?.category === 'handwriting'
          ? 'cursive'
          : 'sans-serif'
  return `${/\s/.test(family) ? `"${family}"` : family}, ${repli}`
}
