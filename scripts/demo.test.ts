import { it } from 'vitest'
import {
  buildCharte,
  CONFIG_NORVA,
  encodeState,
  evaluatePair,
  shareUrl,
  suggestAccessible,
  toCss,
  toDtcg,
  toTailwind,
} from '../src/lib'

const BLANC = '#ffffff'

function titre(t: string): void {
  console.log(`\n${'─'.repeat(78)}\n  ${t}\n${'─'.repeat(78)}`)
}

function extrait(texte: string, lignes: number): string {
  const l = texte.split('\n')
  return l.length <= lignes ? texte : `${l.slice(0, lignes).join('\n')}\n  … (${l.length - lignes} lignes de plus)`
}

it('exemple NØRVA', () => {
  const charte = buildCharte(CONFIG_NORVA, ['encre', 'laiton', 'givre', 'os'])

  titre('URL PARTAGEABLE')
  console.log(shareUrl(CONFIG_NORVA, 'https://exemple.fr'))
  console.log(`${encodeState(CONFIG_NORVA).length} caractères de configuration.`)

  titre('ÉCHELLES 50 → 950')
  for (const { slug, scale } of charte.colors) {
    console.log(`\n  ${slug.padEnd(8)} (saisi ${scale.source.hex}, ancré au palier ${scale.anchor})`)
    console.log(
      `  ${scale.swatches
        .map((s) => (s.isSource ? `[${s.hex}]` : ` ${s.hex} `))
        .join('')}`,
    )
    console.log(`  ${scale.swatches.map((s) => String(s.step).padStart(5).padEnd(9)).join('')}`)
  }

  titre('MATRICE DE CONTRASTES — couleurs de base, blanc et noir')
  const jetons = [
    ...charte.colors.map((c) => ({ nom: c.slug, hex: c.scale.source.hex })),
    { nom: 'blanc', hex: BLANC },
    { nom: 'noir', hex: '#000000' },
  ]
  console.log(`  ${'texte sur fond'.padEnd(14)}${jetons.map((j) => j.nom.padStart(10)).join('')}`)
  for (const a of jetons) {
    const cellules = jetons.map((b) => {
      const e = evaluatePair(a.hex, b.hex)
      const v = e.normal.verdict === 'échec' ? (e.grand.aa ? 'AA+' : '—') : e.normal.verdict
      return `${e.ratio.toFixed(2)} ${v}`.padStart(10)
    })
    console.log(`  ${a.nom.padEnd(14)}${cellules.join('')}`)
  }
  console.log('\n  AA+ = échoue en texte courant mais passe en grand texte. — = échec partout.')

  titre('SUGGESTIONS POUR LES PAIRES QUI ÉCHOUENT SUR FOND BLANC')
  for (const { slug, scale } of charte.colors) {
    const e = evaluatePair(scale.source.hex, BLANC)
    if (e.normal.aa) {
      console.log(`  ${slug.padEnd(8)} ${scale.source.hex}  ${e.ratio.toFixed(2)}:1  ${e.normal.verdict} — rien à corriger`)
      continue
    }
    const s = suggestAccessible(scale, scale.anchor, BLANC)
    if (!s) {
      console.log(`  ${slug.padEnd(8)} ${scale.source.hex}  ${e.ratio.toFixed(2)}:1  échec — aucune nuance ne passe, changez le fond`)
      continue
    }
    console.log(
      `  ${slug.padEnd(8)} ${scale.source.hex}  ${e.ratio.toFixed(2)}:1  échec  →  palier ${s.depuis} vers ${s.step} (${s.hex}), ${s.ratio.toFixed(2)}:1`,
    )
  }

  titre(`ÉCHELLE TYPOGRAPHIQUE — base ${charte.type.base} px, ratio ${charte.type.ratio}`)
  console.log(`  ${'niveau'.padEnd(8)}${'px'.padStart(8)}${'rem'.padStart(10)}${'interligne'.padStart(16)}   police`)
  for (const n of charte.type.levels) {
    const police = n.step >= 2 ? CONFIG_NORVA.heading.family : CONFIG_NORVA.body.family
    const interligne = `${n.lineHeight.toFixed(2)} (${n.lineHeightPx.toFixed(1)} px)`
    console.log(
      `  ${n.name.padEnd(8)}${n.px.toFixed(2).padStart(8)}${n.rem.toFixed(4).padStart(10)}${interligne.padStart(16)}   ${police}`,
    )
  }

  titre('EXPORT — VARIABLES CSS')
  console.log(extrait(toCss(charte), 22))

  titre('EXPORT — BLOC @theme TAILWIND v4')
  console.log(extrait(toTailwind(charte), 20))

  titre('EXPORT — TOKENS JSON (DTCG)')
  console.log(extrait(toDtcg(charte), 26))
  console.log(`\n  Total : ${toDtcg(charte).split('\n').length} lignes.`)
})
