import { converter } from './culori'

const toRgb = converter('rgb')

/**
 * APCA — le calcul de contraste du brouillon WCAG 3.
 *
 * Ce n'est pas un remplacement de WCAG 2, c'est un second avis. Les deux
 * répondent à la même question par des moyens différents, et là où ils
 * divergent il y a généralement quelque chose à regarder :
 *
 * — WCAG 2 est un rapport entre deux luminances, donc symétrique : du texte
 *   clair sur fond sombre et l'inverse donnent le même chiffre. Or l'oeil ne
 *   les perçoit pas pareillement, et c'est la critique principale faite à ce
 *   calcul. APCA est orienté : il distingue la polarité.
 * — WCAG 2 est connu pour se tromper dans les tons sombres, où il déclare
 *   conformes des paires que personne ne lit.
 *
 * APCA rend un « Lc », entre -108 et +106 environ. Le signe indique la
 * polarité : positif pour du texte sombre sur fond clair, négatif pour
 * l'inverse. Seule la valeur absolue s'interprète comme un niveau.
 *
 * Implémentation de APCA-W3 0.1.9, les constantes sont celles de la
 * spécification. Le calcul reste un brouillon : l'outil l'affiche en second,
 * jamais à la place du verdict WCAG 2, qui est la norme opposable aujourd'hui.
 */

// Constantes de APCA-W3 0.1.9 — ne pas ajuster.
const EXPOSANT = 2.4
const SEUIL_NOIR = 0.022
const PUISSANCE_NOIR = 1.414
const DELTA = 0.0005

const ECHELLE_SOMBRE_SUR_CLAIR = 1.14
const ECHELLE_CLAIR_SUR_SOMBRE = 1.14
const PUISSANCE_TEXTE_NORMAL = 0.57
const PUISSANCE_FOND_NORMAL = 0.56
const PUISSANCE_TEXTE_INVERSE = 0.62
const PUISSANCE_FOND_INVERSE = 0.65
const SEUIL_BAS = 0.1
const OFFSET_BAS = 0.027

/** Luminance APCA, distincte de la luminance relative de WCAG 2. */
function luminanceY(hex: string): number {
  const rgb = toRgb(hex)
  if (!rgb) return 0
  const canal = (c: number) => Math.min(1, Math.max(0, c)) ** EXPOSANT
  const y = 0.2126729 * canal(rgb.r) + 0.7151522 * canal(rgb.g) + 0.072175 * canal(rgb.b)
  // Les valeurs très sombres sont relevées : c'est la correction qui distingue
  // APCA de WCAG 2 dans les tons foncés.
  return y > SEUIL_NOIR ? y : y + (SEUIL_NOIR - y) ** PUISSANCE_NOIR
}

/**
 * Contraste APCA entre un texte et un fond, en Lc.
 *
 * L'ordre des arguments compte, contrairement à WCAG 2 : `apca(noir, blanc)`
 * et `apca(blanc, noir)` ne donnent pas le même résultat.
 */
export function apca(texte: string, fond: string): number {
  const yTexte = luminanceY(texte)
  const yFond = luminanceY(fond)

  // Deux luminances trop proches : le calcul n'a plus de sens.
  if (Math.abs(yFond - yTexte) < DELTA) return 0

  let contraste: number

  if (yFond > yTexte) {
    // Texte sombre sur fond clair : polarité dite normale.
    contraste = (yFond ** PUISSANCE_FOND_NORMAL - yTexte ** PUISSANCE_TEXTE_NORMAL) * ECHELLE_SOMBRE_SUR_CLAIR
    contraste = contraste < SEUIL_BAS ? 0 : contraste - OFFSET_BAS
  } else {
    // Texte clair sur fond sombre : polarité inverse, d'où le signe négatif.
    contraste = (yFond ** PUISSANCE_FOND_INVERSE - yTexte ** PUISSANCE_TEXTE_INVERSE) * ECHELLE_CLAIR_SUR_SOMBRE
    contraste = contraste > -SEUIL_BAS ? 0 : contraste + OFFSET_BAS
  }

  return contraste * 100
}

export type NiveauApca = {
  /** Le Lc, arrondi au dixième. */
  lc: number
  /** Sa valeur absolue, la seule qui s'interprète comme un niveau. */
  force: number
  /** Ce que cette valeur autorise, en clair. */
  usage: string
  /** Vrai à partir de Lc 60, le seuil du texte courant. */
  texteCourant: boolean
}

/**
 * Les paliers de lisibilité d'APCA, tels que la spécification les décrit.
 *
 * APCA ne raisonne pas en « conforme ou non » mais en « quelle taille et quelle
 * graisse ce contraste autorise ». C'est plus juste, et plus difficile à
 * résumer : d'où ces quelques paliers plutôt qu'un verdict.
 */
export function niveauApca(texte: string, fond: string): NiveauApca {
  const lc = Math.round(apca(texte, fond) * 10) / 10
  const force = Math.abs(lc)

  const usage =
    force >= 90
      ? 'Tout, y compris le texte fin'
      : force >= 75
        ? 'Texte courant à partir de 15 px'
        : force >= 60
          ? 'Texte courant à partir de 18 px'
          : force >= 45
            ? 'Gros titres et éléments d’interface'
            : force >= 30
              ? 'Texte désactivé ou décoratif seulement'
              : 'Insuffisant pour du texte'

  return { lc, force, usage, texteCourant: force >= 60 }
}
