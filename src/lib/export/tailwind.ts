import { familleCss, type Charte } from '../charte'
import type { ExportOptions } from './css'

const OUTIL_DEFAUT = 'Générateur de mini charte graphique'

/**
 * Bloc `@theme` pour Tailwind CSS v4.
 *
 * En v4 la configuration vit dans le CSS : chaque variable déclarée dans
 * `@theme` engendre les classes utilitaires correspondantes — `--color-primary-500`
 * donne `bg-primary-500`, `text-primary-500`, `border-primary-500`, etc.
 *
 * Les couleurs sortent ici en `oklch()`, comme la palette native de Tailwind v4 :
 * c'est le format que la v4 emploie elle-même, et il évite une conversion de plus
 * dans un projet qui interpolera peut-être ces couleurs.
 */
export function toTailwind(charte: Charte, options: ExportOptions = {}): string {
  const outil = options.outil ?? OUTIL_DEFAUT
  const nom = charte.config.name.trim()

  const lignes: string[] = [
    nom === '' ? `/* ${outil} */` : `/* ${nom} — ${outil} */`,
    '',
    '@import "tailwindcss";',
    '',
    '@theme {',
  ]

  for (const { slug, scale } of charte.colors) {
    lignes.push(`  /* ${slug} — ${scale.source.hex} au palier ${scale.anchor} */`)
    for (const s of scale.swatches) {
      lignes.push(`  --color-${slug}-${s.step}: ${s.css}; /* ${s.hex} */`)
    }
    lignes.push('')
  }

  const { heading, body } = charte.config
  lignes.push(`  --font-heading: ${familleCss(heading.family, heading.category)};`)
  lignes.push(`  --font-body: ${familleCss(body.family, body.category)};`)
  lignes.push('')

  lignes.push(`  /* Base ${charte.type.base} px, ratio ${charte.type.ratio} */`)
  for (const n of charte.type.levels) {
    lignes.push(`  --text-${n.name}: ${n.rem}rem;`)
    lignes.push(`  --text-${n.name}--line-height: ${n.lineHeight};`)
  }

  lignes.push('}')
  return lignes.join('\n')
}
