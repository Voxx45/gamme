import { converter, formatHex, parse as culoriParse, toGamut } from './culori'
import type { OklchColor, ParsedColor, Result } from '../types'

const toOklch = converter('oklch')
const toRgb = converter('rgb')
/**
 * Gamut mapping de CSS Color 4 : réduit le chroma en préservant clarté et teinte.
 * Le premier argument est le gamut visé (sRGB), le second l'espace dans lequel
 * la réduction s'opère (OKLCH).
 */
const mapToSrgb = toGamut('rgb', 'oklch')

/**
 * Syntaxes acceptées. On filtre en amont plutôt que de laisser culori tout
 * avaler : culori reconnaît aussi `lab()`, `color()`, les noms CSS… et accepter
 * l'implicite dans un outil de charte graphique rend les erreurs illisibles.
 */
const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i
const HEX_AVEC_ALPHA = /^#?([0-9a-f]{4}|[0-9a-f]{8})$/i
const FONCTION = /^(rgba?|hsla?|oklch)\s*\(/i

/**
 * Tolerance du test de gamut.
 *
 * Les couleurs qui posent aux sommets ou sur les faces du cube sRGB
 * — un rouge pur, un blanc, un bleu sature — ont un canal exactement a 0 ou a 1.
 * L'arrondi des composantes OKLCH suffit alors a les faire basculer d'un cheveu
 * hors du cube, et l'outil annoncerait a tort avoir corrige la couleur saisie.
 *
 * 1e-4 se situe largement au dessus de l'erreur d'arrondi (~1e-6) et largement
 * en dessous d'un pas de quantification 8 bits (~3.9e-3) : la tolerance absorbe
 * le bruit numerique sans jamais masquer un vrai depassement de gamut.
 */
const TOLERANCE_GAMUT = 1e-4

/** Vrai si la couleur est representable en sRGB, au bruit numerique pres. */
export function dansGamutSrgb(couleur: OklchColor): boolean {
  const rgb = toRgb({ mode: 'oklch', l: couleur.l, c: couleur.c, h: couleur.h })
  if (!rgb) return false
  const e = TOLERANCE_GAMUT
  return (
    rgb.r >= -e && rgb.r <= 1 + e &&
    rgb.g >= -e && rgb.g <= 1 + e &&
    rgb.b >= -e && rgb.b <= 1 + e
  )
}

/** Normalise une teinte dans [0, 360). `NaN` (couleur grise) devient 0. */
function normaliserTeinte(h: number | undefined): number {
  if (h === undefined || !Number.isFinite(h)) return 0
  const t = h % 360
  return t < 0 ? t + 360 : t
}

function arrondir(n: number, decimales: number): number {
  const f = 10 ** decimales
  return Math.round(n * f) / f
}

/** Convertit une couleur culori quelconque en `OklchColor` propre. */
export function versOklch(couleur: string): OklchColor | undefined {
  const o = toOklch(couleur)
  if (!o) return undefined
  return {
    l: arrondir(o.l, 6),
    c: arrondir(o.c, 6),
    h: arrondir(normaliserTeinte(o.h), 3),
  }
}

/** Formate une couleur OKLCH en notation CSS lisible. */
export function formaterOklch({ l, c, h }: OklchColor): string {
  return `oklch(${arrondir(l * 100, 2)}% ${arrondir(c, 4)} ${arrondir(h, 2)})`
}

/** Convertit un OKLCH en hexadécimal sRGB, après gamut mapping si nécessaire. */
export function oklchVersHex(couleur: OklchColor): string {
  const brut = { mode: 'oklch' as const, l: couleur.l, c: couleur.c, h: couleur.h }
  const rgb = dansGamutSrgb(couleur) ? toRgb(brut) : mapToSrgb(brut)
  return formatHex(rgb).toLowerCase()
}

/**
 * Interprète une couleur saisie par l'utilisateur.
 *
 * Accepte l'hexadécimal (3 ou 6 chiffres), `rgb()`, `hsl()` et `oklch()`,
 * dans leur syntaxe historique à virgules comme dans la syntaxe CSS moderne.
 * Toute autre valeur renvoie une erreur explicite — jamais une exception.
 */
export function parseColor(saisie: string): Result<ParsedColor> {
  if (typeof saisie !== 'string') {
    return { ok: false, error: 'Entrez une couleur.' }
  }

  const texte = saisie.trim()
  if (texte === '') {
    return { ok: false, error: 'Entrez une couleur.' }
  }

  let format: ParsedColor['format']

  if (HEX.test(texte)) {
    format = 'hex'
  } else if (HEX_AVEC_ALPHA.test(texte)) {
    return {
      ok: false,
      error:
        'Les couleurs semi-transparentes ne sont pas prises en charge : le ratio de contraste dépend de ce qu’il y a derrière. Utilisez un hexadécimal à 3 ou 6 chiffres.',
    }
  } else if (FONCTION.test(texte)) {
    const fn = texte.slice(0, texte.indexOf('(')).trim().toLowerCase()
    format = fn.startsWith('rgb') ? 'rgb' : fn.startsWith('hsl') ? 'hsl' : 'oklch'
  } else {
    return {
      ok: false,
      error: `« ${texte} » n’est pas une couleur reconnue. Formats acceptés : #1b2a41, rgb(27 42 65), hsl(213 41% 18%), oklch(27% 0.05 260).`,
    }
  }

  const prefixe = format === 'hex' && !texte.startsWith('#') ? `#${texte}` : texte
  const couleur = culoriParse(prefixe)

  if (!couleur) {
    return {
      ok: false,
      error: `« ${texte} » a la forme d’un ${format === 'hex' ? 'hexadécimal' : format + '()'} mais ses valeurs sont invalides.`,
    }
  }

  if (couleur.alpha !== undefined && couleur.alpha < 1) {
    return {
      ok: false,
      error:
        'Les couleurs semi-transparentes ne sont pas prises en charge : le ratio de contraste dépend de ce qu’il y a derrière.',
    }
  }

  const oklchBrut = versOklch(prefixe)
  if (!oklchBrut) {
    return { ok: false, error: `« ${texte} » n’a pas pu être converti en OKLCH.` }
  }

  const clamped = !dansGamutSrgb(oklchBrut)
  const hex = oklchVersHex(oklchBrut)

  // On re-dérive l'OKLCH depuis l'hexadécimal produit : ainsi `hex` et `oklch`
  // décrivent toujours exactement la même couleur, celle que l'outil affichera.
  const oklch = versOklch(hex) ?? oklchBrut

  return {
    ok: true,
    value: { input: texte, format, oklch, hex, clamped },
  }
}
