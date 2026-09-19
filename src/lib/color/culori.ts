/**
 * Point d'entrée unique vers culori, en mode enregistrement explicite.
 *
 * L'entrée par défaut de culori embarque tous les espaces colorimétriques —
 * une quarantaine — soit 45 Ko pour les cinq fonctions et trois espaces que
 * l'outil emploie réellement. L'entrée `culori/fn` n'embarque rien tant qu'on
 * n'a pas enregistré les modes voulus.
 *
 * Tout le reste du code passe par ce module : ajouter un espace se fait ici,
 * une fois, et le poids du paquet reste une décision consciente.
 */
import {
  converter,
  differenceEuclidean,
  filterDeficiencyDeuter,
  filterDeficiencyProt,
  filterDeficiencyTrit,
  formatHex,
  interpolate,
  modeOklab,
  modeOklch,
  modeRgb,
  parse,
  toGamut,
  // Renomme : `useMode` n'est pas un hook React, et son préfixe trompe autant
  // les outils d'analyse que les lecteurs.
  useMode as enregistrerMode,
} from 'culori/fn'

enregistrerMode(modeRgb)
enregistrerMode(modeOklab)
enregistrerMode(modeOklch)

export {
  converter,
  differenceEuclidean,
  filterDeficiencyDeuter,
  filterDeficiencyProt,
  filterDeficiencyTrit,
  formatHex,
  interpolate,
  parse,
  toGamut,
}
