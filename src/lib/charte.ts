import { generateScale } from './color/scale'
import { typeScale } from './typography/scale'
import type { BrandConfig, ColorScale, TypeScale } from './types'

/**
 * Noms par défaut des couleurs, attribués par position.
 *
 * En anglais, contrairement à l'interface : ces noms finissent dans du code —
 * variables CSS, thème Tailwind, tokens JSON — et le code se lit en anglais.
 * L'interface reste en français, les livrables en anglais.
 */
export const NOMS_PAR_DEFAUT = ['primary', 'secondary', 'accent', 'neutral'] as const

export type NamedScale = {
  /** Nom court, utilisable tel quel comme segment de token. */
  slug: string
  scale: ColorScale
}

/** Tout ce que les exporteurs ont besoin de connaître. */
export type Charte = {
  config: BrandConfig
  colors: NamedScale[]
  type: TypeScale
}

/**
 * Réduit une chaîne à un identifiant sûr pour un nom de variable CSS
 * ou de token : minuscules, sans accent, séparé par des tirets.
 */
export function slugify(brut: string): string {
  const sansAccent = brut.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const slug = sansAccent
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug === '' ? 'color' : slug
}

/**
 * Assemble la charte complète à partir de la configuration : une échelle par
 * couleur, plus l'échelle typographique.
 *
 * Les couleurs illisibles sont écartées silencieusement — la configuration
 * arrive de `decodeState`, qui a déjà validé, et une couleur cassée ne doit pas
 * emporter toute la charte.
 */
export function buildCharte(config: BrandConfig, noms?: readonly string[]): Charte {
  const colors: NamedScale[] = []
  const utilises = new Set<string>()

  config.colors.forEach((couleur, i) => {
    let scale: ColorScale
    try {
      scale = generateScale(couleur)
    } catch {
      return
    }

    const propose = slugify(noms?.[i] ?? NOMS_PAR_DEFAUT[i] ?? `color-${i + 1}`)
    // Deux couleurs peuvent porter le même nom : on désambiguïse plutôt que
    // de produire un export où un token en écrase silencieusement un autre.
    let slug = propose
    let n = 2
    while (utilises.has(slug)) {
      slug = `${propose}-${n}`
      n += 1
    }
    utilises.add(slug)

    colors.push({ slug, scale })
  })

  return {
    config,
    colors,
    type: typeScale(config.baseSize, config.ratio),
  }
}

/** Pile de repli associée à une catégorie de police Google Fonts. */
export function pileDeRepli(categorie: string | undefined): string {
  switch (categorie) {
    case 'serif':
      return 'serif'
    case 'monospace':
      return 'monospace'
    case 'handwriting':
      return 'cursive'
    case 'display':
      return 'sans-serif'
    default:
      return 'sans-serif'
  }
}

/** Formate une famille pour CSS, en la citant si elle contient un espace. */
export function familleCss(famille: string, categorie: string | undefined): string {
  const nom = /\s/.test(famille) ? `"${famille}"` : famille
  return `${nom}, ${pileDeRepli(categorie)}`
}
