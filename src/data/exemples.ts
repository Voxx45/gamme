import { CONFIG_NORVA } from '../lib'
import type { BrandConfig } from '../lib/types'

export type Exemple = {
  config: BrandConfig
  /** Ce que l'exemple donne à voir, en une ligne. */
  propos: string
}

/**
 * Quelques chartes de départ.
 *
 * Chacune n'est qu'une configuration : la carte de la galerie est un lien vers
 * son URL, rien de plus. Elles ne sont pas là pour faire joli mais pour montrer
 * des cas différents — une palette qui passe partout, une qui échoue beaucoup,
 * une presque monochrome, un accord de polices à fort contraste.
 *
 * Toutes leurs couleurs sont nommées : c'est ce qui rend les exports lisibles,
 * et le plus sûr moyen de donner l'idée de le faire.
 */
export const EXEMPLES: readonly Exemple[] = [
  {
    config: CONFIG_NORVA,
    propos: 'Éditorial nordique. Un serif de titrage à fort contraste, et deux couleurs qui échouent sur blanc.',
  },
  {
    config: {
      name: 'Brasserie',
      colors: ['#7c2d12', '#e8d5b7', '#3f3a34', '#c2410c'],
      colorNames: ['brique', 'creme', 'suie', 'braise'],
      heading: { family: 'Playfair Display', weight: 700, category: 'serif' },
      body: { family: 'Karla', weight: 400, category: 'sans-serif' },
      baseSize: 17,
      ratio: 1.25,
    },
    propos: 'Chaleureux et dense. Une primaire foncée qui passe presque partout.',
  },
  {
    config: {
      name: 'Herbier',
      colors: ['#2d4a38', '#8a9a5b', '#c4b59a', '#f5f2e8'],
      colorNames: ['sapin', 'mousse', 'argile', 'papier'],
      heading: { family: 'Fraunces', weight: 600, category: 'serif' },
      body: { family: 'Public Sans', weight: 400, category: 'sans-serif' },
      baseSize: 16,
      ratio: 1.2,
    },
    propos: 'Quatre verts et terres très proches : le cas où les échelles se frôlent.',
  },
  {
    config: {
      name: 'Vela',
      colors: ['#1e1b4b', '#06b6d4', '#64748b', '#f8fafc'],
      colorNames: ['nuit', 'cyan', 'ardoise', 'givre'],
      heading: { family: 'Space Grotesk', weight: 700, category: 'sans-serif' },
      body: { family: 'Inter', weight: 400, category: 'sans-serif' },
      baseSize: 16,
      ratio: 1.333,
    },
    propos: 'Un cyan vif qui échoue en texte courant partout : beaucoup de corrections à voir.',
  },
  {
    config: {
      name: 'Kiosque',
      colors: ['#18181b', '#dc2626', '#a1a1aa', '#fafaf9'],
      colorNames: ['encre', 'rouge', 'plomb', 'journal'],
      heading: { family: 'Archivo Black', weight: 400, category: 'sans-serif' },
      body: { family: 'Source Serif 4', weight: 400, category: 'serif' },
      baseSize: 18,
      ratio: 1.5,
    },
    propos: 'Presse : un noir, un rouge, du papier. Ratio 1,5 pour une hiérarchie franche.',
  },
]
