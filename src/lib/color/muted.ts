import { converter, formatHex, interpolate } from 'culori'
import { contrastRatio } from './contrast'

const toRgb = converter('rgb')

/**
 * La couleur la plus effacée qui tient encore le ratio demandé sur ce fond.
 *
 * Pourquoi ne pas se contenter d'`opacity` : une opacité de 0,6 sur du texte
 * réduit son contraste dans les mêmes proportions, sans qu'on le voie venir.
 * C'est ainsi que des libellés secondaires tombent à 3,1:1 alors que la couleur
 * de départ était à 12:1. Sur un outil qui juge le contraste des autres, c'est
 * la faute à ne pas commettre.
 *
 * On mélange donc la couleur vers le fond — ce qui donne le même effet visuel
 * d'atténuation — mais en s'arrêtant au dernier point où le ratio tient encore.
 * Recherche dichotomique : le contraste décroît de façon monotone à mesure que
 * l'on se rapproche du fond, la bissection converge donc toujours.
 *
 * Si la couleur de départ n'atteint déjà pas le seuil, on la renvoie telle
 * quelle : l'atténuer ne ferait qu'aggraver les choses.
 */
export function attenuer(texte: string, fond: string, ratioMin = 4.5): string {
  if (contrastRatio(texte, fond) < ratioMin) return normaliser(texte)

  const melange = interpolate([texte, fond], 'oklab')

  let bas = 0 // la couleur d'origine, qui passe
  let haut = 1 // le fond, qui ne passe jamais

  for (let i = 0; i < 18; i++) {
    const milieu = (bas + haut) / 2
    const candidat = formatHex(toRgb(melange(milieu))!)
    if (contrastRatio(candidat, fond) >= ratioMin) bas = milieu
    else haut = milieu
  }

  return formatHex(toRgb(melange(bas))!).toLowerCase()
}

function normaliser(couleur: string): string {
  const rgb = toRgb(couleur)
  return rgb ? formatHex(rgb).toLowerCase() : couleur
}
