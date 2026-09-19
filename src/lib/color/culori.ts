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
  modeHsl,
  modeOklab,
  modeOklch,
  modeRgb,
  parse,
  toGamut,
  // Renomme : `useMode` n'est pas un hook React, et son préfixe trompe autant
  // les outils d'analyse que les lecteurs.
  useMode as enregistrerMode,
} from 'culori/fn'

/*
 * Les quatre espaces dont l'outil a besoin, et pas un de plus :
 *
 * — `rgb` pour l'hexadécimal, `rgb()` et toutes les sorties ;
 * — `hsl` parce que l'outil annonce accepter cette syntaxe en saisie ;
 * — `oklch` pour les échelles ;
 * — `oklab` pour l'interpolation d'`attenuer`.
 *
 * Oublier `hsl` ici a suffi à casser la saisie en `hsl()` sans que rien ne le
 * signale à la compilation : le test ci-dessous existe pour ça.
 */
enregistrerMode(modeRgb)
enregistrerMode(modeHsl)
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
