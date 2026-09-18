import { familleCss, type Charte } from '../charte'

export type ExportOptions = {
  /** Ligne d'en-tête du fichier généré. */
  outil?: string
}

const OUTIL_DEFAUT = 'Générateur de mini charte graphique'

function entete(charte: Charte, outil: string): string {
  const nom = charte.config.name.trim()
  return nom === '' ? `/* ${outil} */` : `/* ${nom} — ${outil} */`
}

/**
 * Variables CSS natives, à coller dans n'importe quel projet.
 *
 * Les couleurs sortent en hexadécimal et non en `oklch()` : c'est l'export
 * passe-partout, il doit fonctionner partout, y compris dans un vieux projet ou
 * un mail. L'export Tailwind, lui, assume l'OKLCH.
 */
export function toCss(charte: Charte, options: ExportOptions = {}): string {
  const outil = options.outil ?? OUTIL_DEFAUT
  const lignes: string[] = [entete(charte, outil), '', ':root {']

  for (const { slug, scale } of charte.colors) {
    lignes.push(`  /* ${slug} — ${scale.source.hex} au palier ${scale.anchor} */`)
    for (const s of scale.swatches) {
      lignes.push(`  --color-${slug}-${s.step}: ${s.hex};`)
    }
    lignes.push('')
  }

  const { heading, body } = charte.config
  lignes.push('  /* Polices */')
  lignes.push(`  --font-heading: ${familleCss(heading.family, heading.category)};`)
  lignes.push(`  --font-body: ${familleCss(body.family, body.category)};`)
  lignes.push(`  --font-weight-heading: ${heading.weight};`)
  lignes.push(`  --font-weight-body: ${body.weight};`)
  lignes.push('')

  lignes.push(`  /* Échelle typographique — base ${charte.type.base} px, ratio ${charte.type.ratio} */`)
  for (const n of charte.type.levels) {
    lignes.push(`  --text-${n.name}: ${n.rem}rem; /* ${n.px} px */`)
  }
  lignes.push('')
  lignes.push('  /* Interlignage conseillé */')
  for (const n of charte.type.levels) {
    lignes.push(`  --leading-${n.name}: ${n.lineHeight};`)
  }

  lignes.push('}')
  return lignes.join('\n')
}
