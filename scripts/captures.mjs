import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

/**
 * Captures d'ecran de l'outil, desktop et mobile.
 *
 * Lance d'abord un serveur : `npm run build && npm run preview`, puis
 * `node scripts/captures.mjs`. L'URL se surcharge par la variable BASE.
 */

const BASE = process.env.BASE ?? 'http://localhost:4173'
const SORTIE = 'captures'

const NORVA =
  '#v=1&c=1b2a41%2Cc9a227%2C7c9eb2%2Cf4f1ea&h=Cormorant+Garamond&hw=600&b=Manrope&bw=400&s=16&r=1.25&n=N%C3%98RVA'

/** Attend que les polices soient posees : sinon on photographie le repli. */
async function stabiliser(page) {
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(450)
}

async function ongletActif(page, nom) {
  await page.getByRole('tab', { name: nom, exact: true }).click()
  await page.waitForTimeout(250)
}

async function main() {
  await mkdir(SORTIE, { recursive: true })
  const navigateur = await chromium.launch()

  // --- Desktop ---
  const desktop = await navigateur.newContext({
    viewport: { width: 1440, height: 960 },
    deviceScaleFactor: 2,
    locale: 'fr-FR',
    reducedMotion: 'reduce',
  })
  const page = await desktop.newPage()

  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await stabiliser(page)
  await page.screenshot({ path: `${SORTIE}/desktop-1-etat-vide.png` })

  await page.goto(`${BASE}/${NORVA}`, { waitUntil: 'domcontentloaded' })
  await stabiliser(page)
  await page.screenshot({ path: `${SORTIE}/desktop-2-palette.png` })

  await ongletActif(page, 'Contrastes')
  await page.screenshot({ path: `${SORTIE}/desktop-3-contrastes.png` })
  await page.screenshot({ path: `${SORTIE}/desktop-3b-contrastes-complet.png`, fullPage: true })

  await ongletActif(page, 'Typographie')
  await page.screenshot({ path: `${SORTIE}/desktop-4-typographie.png` })

  await ongletActif(page, 'Brand board')
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${SORTIE}/desktop-5-brand-board.png` })

  await ongletActif(page, 'Export')
  await page.screenshot({ path: `${SORTIE}/desktop-6-export.png` })

  // Le selecteur de police, ouvert : chaque nom dans sa propre fonte.
  await ongletActif(page, 'Palette')
  await page.locator('#\\:r0\\:, input[role="combobox"]').first().click()
  await page.waitForTimeout(900)
  await page.screenshot({ path: `${SORTIE}/desktop-7-selecteur-police.png` })

  // Le focus clavier, visible.
  await page.keyboard.press('Escape')
  await page.goto(`${BASE}/${NORVA}`, { waitUntil: 'domcontentloaded' })
  await stabiliser(page)
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await page.screenshot({ path: `${SORTIE}/desktop-8-focus-clavier.png` })

  await desktop.close()

  // --- Mobile ---
  const mobile = await navigateur.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    locale: 'fr-FR',
    reducedMotion: 'reduce',
  })
  const petite = await mobile.newPage()

  await petite.goto(BASE, { waitUntil: 'domcontentloaded' })
  await stabiliser(petite)
  await petite.screenshot({ path: `${SORTIE}/mobile-1-etat-vide.png` })

  await petite.goto(`${BASE}/${NORVA}`, { waitUntil: 'domcontentloaded' })
  await stabiliser(petite)
  await petite.screenshot({ path: `${SORTIE}/mobile-2-saisie.png` })
  await petite.screenshot({ path: `${SORTIE}/mobile-2b-page-entiere.png`, fullPage: true })

  for (const [nom, fichier] of [
    ['Palette', 'mobile-3-palette'],
    ['Contrastes', 'mobile-4-contrastes'],
    ['Brand board', 'mobile-5-brand-board'],
  ]) {
    await petite.getByRole('heading', { name: nom, exact: true }).scrollIntoViewIfNeeded()
    await petite.waitForTimeout(500)
    await petite.screenshot({ path: `${SORTIE}/${fichier}.png` })
  }

  await mobile.close()
  await navigateur.close()
  console.log('Captures ecrites dans', SORTIE)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
