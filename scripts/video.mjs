import { chromium } from 'playwright'
import { mkdir, readdir, rename, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

/**
 * Enregistre une demo de 30 secondes au format 1080 x 1350.
 *
 *   npm run build && npm run preview
 *   node scripts/video.mjs
 *
 * Deroule : l'etat vide, l'exemple NORVA, la palette, la matrice de contrastes,
 * la correction d'une paire, le brand board, la copie du lien.
 *
 * Playwright n'enregistre qu'en WebM. La conversion en MP4 est tentee si ffmpeg
 * est installe ; sinon le WebM reste utilisable tel quel, y compris par
 * LinkedIn.
 */

const BASE = process.env.BASE ?? 'http://localhost:4200'
const SORTIE = 'captures/video'
const LARGEUR = 1080
const HAUTEUR = 1350

// Pas d'URL pre-remplie ici : la demo part de l'etat vide et clique sur
// « Voir l'exemple », comme le ferait une personne qui decouvre l'outil.

/*
 * Le deroule, en secondes de pause explicite.
 *
 * Les clics, defilements et survols ajoutent environ 6,4 s que l'on ne controle
 * pas directement : les pauses somment donc a 23,6 s pour une video de 30 s.
 * Mesure a l'appui, pas au juge.
 */
const TEMPS = {
  etatVide: 3.2,
  apresExemple: 3.5,
  palette: 2.8,
  ouvrirContrastes: 3.2,
  filtre: 2.0,
  correction: 3.1,
  board: 3.1,
  lien: 2.7,
}

async function pause(page, secondes) {
  await page.waitForTimeout(Math.round(secondes * 1000))
}

async function main() {
  if (existsSync(SORTIE)) await rm(SORTIE, { recursive: true })
  await mkdir(SORTIE, { recursive: true })

  const navigateur = await chromium.launch()
  const contexte = await navigateur.newContext({
    viewport: { width: LARGEUR, height: HAUTEUR },
    // Sans taille explicite, Playwright reduit la video pour tenir dans
    // 800 x 800 : on impose le format du post.
    recordVideo: { dir: SORTIE, size: { width: LARGEUR, height: HAUTEUR } },
    locale: 'fr-FR',
    permissions: ['clipboard-read', 'clipboard-write'],
    deviceScaleFactor: 1,
  })
  const page = await contexte.newPage()

  const debut = Date.now()

  // --- 1. L'etat vide ---
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await pause(page, TEMPS.etatVide)

  // --- 2. Charger l'exemple ---
  await page.getByRole('button', { name: 'Voir l’exemple NØRVA' }).click()
  await page.waitForTimeout(600)
  await page.evaluate(() => document.fonts.ready)
  await pause(page, TEMPS.apresExemple)

  // --- 3. La palette, en defilant doucement ---
  await page.evaluate(() => window.scrollTo({ top: 260, behavior: 'smooth' }))
  await pause(page, TEMPS.palette)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  await page.waitForTimeout(500)

  // --- 4. La matrice de contrastes ---
  await page.getByRole('tab', { name: 'Contrastes', exact: true }).click()
  await pause(page, TEMPS.ouvrirContrastes)

  // --- 5. Le filtre, puis une correction appliquee ---
  await page.getByText('Seulement les paires valides').click()
  await pause(page, TEMPS.filtre)
  await page.getByText('Seulement les paires valides').click()
  await page.waitForTimeout(500)

  await page.evaluate(() => {
    const titre = [...document.querySelectorAll('h3')].find((h) => h.textContent?.includes('Corrections'))
    titre?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
  await page.waitForTimeout(900)

  const correction = page.locator('button:has-text("palier")').first()
  if (await correction.count()) {
    await correction.hover()
    await page.waitForTimeout(500)
    await correction.click()
  }
  await pause(page, TEMPS.correction)

  // --- 6. Le brand board ---
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  await page.waitForTimeout(400)
  await page.getByRole('tab', { name: 'Brand board', exact: true }).click()
  await page.waitForTimeout(700)
  await page.evaluate(() => window.scrollTo({ top: 200, behavior: 'smooth' }))
  await pause(page, TEMPS.board)

  // --- 7. Copier le lien ---
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  await page.waitForTimeout(400)
  const boutonLien = page.getByRole('button', { name: 'Copier le lien de ma charte' })
  await boutonLien.hover()
  await page.waitForTimeout(500)
  await boutonLien.click()
  await pause(page, TEMPS.lien)

  const duree = (Date.now() - debut) / 1000
  const video = page.video()
  await contexte.close()
  await navigateur.close()

  const brut = await video.path()
  const webm = `${SORTIE}/demo-${LARGEUR}x${HAUTEUR}.webm`
  await rename(brut, webm)

  // Playwright laisse parfois des fichiers intermediaires derriere lui.
  for (const f of await readdir(SORTIE)) {
    if (f.endsWith('.webm') && !webm.endsWith(f)) await rm(`${SORTIE}/${f}`)
  }

  console.log(`WebM ecrit : ${webm}`)
  console.log(`Duree du scenario : ${duree.toFixed(1)} s`)

  // --- Conversion facultative en MP4 ---
  const versionFfmpeg = spawnSync('ffmpeg', ['-version'], { encoding: 'utf-8' })
  if (versionFfmpeg.error) {
    console.log('\nffmpeg absent : pas de conversion en MP4.')
    console.log('Le WebM est accepte par LinkedIn tel quel. Pour convertir plus tard :')
    console.log(`  ffmpeg -i ${webm} -c:v libx264 -pix_fmt yuv420p -crf 20 -movflags +faststart ${SORTIE}/demo.mp4`)
    return
  }

  const mp4 = `${SORTIE}/demo-${LARGEUR}x${HAUTEUR}.mp4`
  const conversion = spawnSync(
    'ffmpeg',
    ['-y', '-i', webm, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart', mp4],
    { encoding: 'utf-8' },
  )
  console.log(conversion.status === 0 ? `MP4 ecrit : ${mp4}` : 'La conversion ffmpeg a echoue ; le WebM reste valable.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
