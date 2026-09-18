import { chromium } from 'playwright'
import { readFile, writeFile, mkdir } from 'node:fs/promises'

/**
 * Fabrique les images du depot : l'apercu Open Graph et les icones.
 *
 *   npm run build && npm run preview
 *   node scripts/assets.mjs
 *
 * L'apercu Open Graph n'est pas une capture d'ecran : c'est le brand board de
 * l'exemple NORVA, produit par l'outil lui-meme, avec ses polices inlinees.
 * L'image que les gens verront dans leur fil est donc exactement ce que l'outil
 * fabrique — ce qui est la seule promesse honnete a faire.
 */

const BASE = process.env.BASE ?? 'http://localhost:4200'
const NORVA =
  '#v=1&c=1b2a41%2Cc9a227%2C7c9eb2%2Cf4f1ea&h=Cormorant+Garamond&hw=600&b=Manrope&bw=400&s=16&r=1.25&n=N%C3%98RVA'

/** Lit largeur et hauteur dans l'en-tete IHDR d'un PNG, sans dependance. */
function dimensionsPng(tampon) {
  if (tampon.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') return null
  return { largeur: tampon.readUInt32BE(16), hauteur: tampon.readUInt32BE(20) }
}

async function main() {
  await mkdir('public', { recursive: true })
  const navigateur = await chromium.launch()

  // --- L'apercu Open Graph, 1200 x 630 ---
  const contexte = await navigateur.newContext({
    viewport: { width: 1600, height: 1000 },
    locale: 'fr-FR',
    acceptDownloads: true,
  })
  const page = await contexte.newPage()
  await page.goto(BASE + '/' + NORVA, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(800)

  await page.getByRole('tab', { name: 'Brand board', exact: true }).click()
  await page.waitForTimeout(700)

  const attente = page.waitForEvent('download', { timeout: 90_000 })
  await page.locator('[data-test="telecharger-paysage"]').click()
  const telechargement = await attente
  await telechargement.saveAs('public/og.png')

  const og = await readFile('public/og.png')
  const d = dimensionsPng(og)
  // L'outil exporte a deux fois le format nominal ; Open Graph veut 1200 x 630.
  // On redimensionne dans un canevas plutot que d'ajouter une dependance image.
  const redimensionnee = await page.evaluate(
    async ([data64, largeur, hauteur]) => {
      const image = new Image()
      image.src = 'data:image/png;base64,' + data64
      await image.decode()
      const toile = document.createElement('canvas')
      toile.width = largeur
      toile.height = hauteur
      const ctx = toile.getContext('2d')
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(image, 0, 0, largeur, hauteur)
      return toile.toDataURL('image/png')
    },
    [og.toString('base64'), 1200, 630],
  )
  await writeFile('public/og.png', Buffer.from(redimensionnee.split(',')[1], 'base64'))
  const apres = dimensionsPng(await readFile('public/og.png'))
  console.log(`og.png        ${d.largeur}x${d.hauteur} -> ${apres.largeur}x${apres.hauteur}`)

  // --- Les icones, depuis le favicon SVG ---
  const svg = await readFile('public/favicon.svg', 'utf-8')
  const icones = [
    ['icone-180.png', 180, false],
    ['icone-192.png', 192, false],
    ['icone-512.png', 512, false],
    // L'icone « maskable » est rognee par le systeme : on laisse une marge de
    // securite de 10 % sur chaque bord pour que le motif survive au rognage.
    ['icone-512-pleine.png', 512, true],
  ]

  for (const [nom, taille, pleine] of icones) {
    const data = await page.evaluate(
      async ([source, cote, marge]) => {
        const image = new Image()
        image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source)
        await image.decode()
        const toile = document.createElement('canvas')
        toile.width = cote
        toile.height = cote
        const ctx = toile.getContext('2d')
        ctx.fillStyle = '#faf9f6'
        ctx.fillRect(0, 0, cote, cote)
        const d = marge ? cote * 0.8 : cote
        const o = marge ? cote * 0.1 : 0
        ctx.drawImage(image, o, o, d, d)
        return toile.toDataURL('image/png')
      },
      [svg, taille, pleine],
    )
    await writeFile(`public/${nom}`, Buffer.from(data.split(',')[1], 'base64'))
    const v = dimensionsPng(await readFile(`public/${nom}`))
    console.log(`${nom.padEnd(22)} ${v.largeur}x${v.hauteur}`)
  }

  await contexte.close()
  await navigateur.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
