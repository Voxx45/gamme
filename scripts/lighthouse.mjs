import lighthouse from 'lighthouse'
import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'

/**
 * Lighthouse en profil mobile, pilote depuis Node.
 *
 * La ligne de commande de Lighthouse passe par `chrome-launcher`, qui ne sait
 * pas demarrer le Chromium de Playwright sous Windows (`spawn UNKNOWN`). On
 * ouvre donc le navigateur nous-memes avec un port de debogage, et on branche
 * Lighthouse dessus.
 */

const BASE = process.env.BASE ?? 'http://localhost:4200'
const PORT_CDP = 9222

const PAGES = [
  ['accueil', '/', 'Etat vide, premiere visite'],
  [
    'norva',
    '/#v=1&c=1b2a41%2Cc9a227%2C7c9eb2%2Cf4f1ea&h=Cormorant+Garamond&hw=600&b=Manrope&bw=400&s=16&r=1.25&n=N%C3%98RVA',
    'Exemple NORVA, quatre couleurs et deux polices chargees',
  ],
]

const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo']
const SEUIL = 95

async function main() {
  await mkdir('rapports', { recursive: true })

  const navigateur = await chromium.launch({
    args: [`--remote-debugging-port=${PORT_CDP}`, '--no-sandbox', '--disable-dev-shm-usage'],
  })

  let echecs = 0
  const resume = []

  for (const [cle, chemin, intitule] of PAGES) {
    const resultat = await lighthouse(
      BASE + chemin,
      { port: PORT_CDP, output: ['json', 'html'], logLevel: 'error' },
      // Pas de config : le profil par defaut de Lighthouse est deja le mobile
      // (Moto G Power, reseau 4G bride, ecran 412 x 823).
      undefined,
    )

    await writeFile(`rapports/lighthouse-${cle}.html`, resultat.report[1])
    await writeFile(`rapports/lighthouse-${cle}.json`, resultat.report[0])

    const scores = {}
    console.log(`\n${intitule}`)
    console.log('-'.repeat(intitule.length))
    for (const c of CATEGORIES) {
      const note = Math.round((resultat.lhr.categories[c]?.score ?? 0) * 100)
      scores[c] = note
      const verdict = note >= SEUIL ? 'OK   ' : 'ECHEC'
      if (note < SEUIL) echecs += 1
      console.log(`  ${verdict} ${String(note).padStart(3)}  ${c}`)
    }
    resume.push({ cle, intitule, scores })

    // Ce qui a coute des points, pour savoir quoi corriger.
    const rates = Object.values(resultat.lhr.audits)
      .filter((a) => a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'informative')
      .sort((a, b) => a.score - b.score)
      .slice(0, 12)
    if (rates.length > 0) {
      console.log('  audits sous la note maximale :')
      for (const a of rates) {
        const valeur = a.displayValue ? ` (${a.displayValue})` : ''
        console.log(`    ${String(Math.round(a.score * 100)).padStart(3)}  ${a.id}${valeur}`)
      }
    }
  }

  await navigateur.close()
  await writeFile('rapports/lighthouse-resume.json', JSON.stringify(resume, null, 2))

  console.log(`\n${'='.repeat(56)}`)
  console.log(`  ${echecs === 0 ? 'Tous les scores atteignent ' + SEUIL : echecs + ' score(s) sous ' + SEUIL}`)
  console.log('='.repeat(56))
  process.exit(echecs === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
