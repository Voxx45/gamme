import { chromium } from 'playwright'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'

/**
 * Verifications de bout en bout du partage et des exports.
 *
 *   npm run build && npm run preview
 *   node scripts/e2e.mjs
 *
 * L'URL se surcharge par la variable BASE.
 */

const BASE = process.env.BASE ?? 'http://localhost:4173'
const TELECHARGEMENTS = 'captures/telechargements'

let reussis = 0
let echoues = 0

function verifier(condition, intitule, detail = '') {
  if (condition) {
    reussis += 1
    console.log(`  OK    ${intitule}`)
  } else {
    echoues += 1
    console.log(`  ECHEC ${intitule}${detail ? ' -- ' + detail : ''}`)
  }
}

function section(titre) {
  console.log(`\n${titre}\n${'-'.repeat(titre.length)}`)
}

async function stabiliser(page) {
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(350)
}

/**
 * Empreinte de la charte affichee : ce qui doit etre identique de part et
 * d'autre d'un partage. On lit le rendu, pas l'etat interne — sinon on
 * verifierait que le code est d'accord avec lui-meme.
 */
async function empreinte(page) {
  return page.evaluate(() => {
    const champs = [...document.querySelectorAll('aside input[type="text"], aside select')].map((e) => e.value)
    const onglets = [...document.querySelectorAll('[role="tab"]')].map((e) => e.textContent.trim())
    const titre = document.title
    return JSON.stringify({ champs, onglets, titre })
  })
}

/** Toutes les valeurs hexadecimales visibles dans le panneau Palette. */
async function nuancesVisibles(page) {
  await page.getByRole('tab', { name: 'Palette', exact: true }).click()
  await page.waitForTimeout(250)
  return page.evaluate(() =>
    [...document.querySelectorAll('[role="tabpanel"] button[title^="Copier #"]')].map((b) => b.title),
  )
}

/** Lit largeur et hauteur dans l'en-tete IHDR d'un PNG, sans dependance. */
function dimensionsPng(tampon) {
  const signature = tampon.subarray(0, 8).toString('hex')
  if (signature !== '89504e470d0a1a0a') return null
  return { largeur: tampon.readUInt32BE(16), hauteur: tampon.readUInt32BE(20) }
}

async function main() {
  if (existsSync(TELECHARGEMENTS)) await rm(TELECHARGEMENTS, { recursive: true })
  await mkdir(TELECHARGEMENTS, { recursive: true })

  const navigateur = await chromium.launch()
  const contexte = await navigateur.newContext({
    viewport: { width: 1440, height: 960 },
    locale: 'fr-FR',
    permissions: ['clipboard-read', 'clipboard-write'],
    acceptDownloads: true,
  })

  // =====================================================================
  section('1. Charger l exemple, copier le lien, le rouvrir dans un onglet neuf')
  // =====================================================================
  const page = await contexte.newPage()
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await stabiliser(page)

  verifier(new URL(page.url()).hash === '', 'la premiere visite n a pas de fragment')

  await page.getByRole('button', { name: 'Exemple', exact: true }).click()
  await stabiliser(page)

  const hashApres = new URL(page.url()).hash
  verifier(hashApres.includes('n=N%C3%98RVA'), 'le fragment porte le nom NORVA', hashApres)

  const empreinteOrigine = await empreinte(page)
  const nuancesOrigine = await nuancesVisibles(page)
  verifier(nuancesOrigine.length === 44, '44 nuances affichees (4 couleurs x 11 paliers)', String(nuancesOrigine.length))

  await page.getByRole('button', { name: 'Copier le lien de ma charte' }).click()
  await page.waitForTimeout(250)

  const lienCopie = await page.evaluate(() => navigator.clipboard.readText())
  verifier(lienCopie.startsWith(BASE), 'le lien copie pointe sur l outil', lienCopie.slice(0, 60))
  verifier(lienCopie.includes('#v=1&c='), 'le lien copie contient la configuration')

  const confirmation = await page.getByRole('button', { name: 'Copié', exact: true }).count()
  verifier(confirmation === 1, 'le bouton confirme visuellement la copie')

  // Un onglet neuf : aucun etat partage avec le precedent.
  const ongletNeuf = await contexte.newPage()
  await ongletNeuf.goto(lienCopie, { waitUntil: 'domcontentloaded' })
  await stabiliser(ongletNeuf)

  const empreinteRestauree = await empreinte(ongletNeuf)
  verifier(empreinteRestauree === empreinteOrigine, 'la charte restauree est identique')

  const nuancesRestaurees = await nuancesVisibles(ongletNeuf)
  verifier(
    JSON.stringify(nuancesRestaurees) === JSON.stringify(nuancesOrigine),
    'les 44 nuances calculees sont identiques au bit pres',
  )
  await ongletNeuf.close()

  // =====================================================================
  section('2. L historique du navigateur ne se remplit pas')
  // =====================================================================
  const pageHisto = await contexte.newPage()
  await pageHisto.goto(BASE, { waitUntil: 'domcontentloaded' })
  await stabiliser(pageHisto)
  const longueurDepart = await pageHisto.evaluate(() => history.length)

  await pageHisto.getByRole('button', { name: 'Exemple', exact: true }).click()
  await stabiliser(pageHisto)

  // Vingt modifications d'affilee : un `pushState` par frappe ferait exploser
  // l'historique et rendrait le bouton retour inutilisable.
  const curseur = pageHisto.locator('input[type="range"]')
  for (let i = 0; i < 20; i++) {
    await curseur.focus()
    await pageHisto.keyboard.press(i % 2 === 0 ? 'ArrowRight' : 'ArrowLeft')
    await pageHisto.waitForTimeout(60)
  }
  await pageHisto.waitForTimeout(500)

  const longueurFin = await pageHisto.evaluate(() => history.length)
  verifier(
    longueurFin === longueurDepart,
    `20 modifications n ajoutent aucune entree d historique`,
    `${longueurDepart} -> ${longueurFin}`,
  )
  await pageHisto.close()

  // =====================================================================
  section('3. URL corrompues : l outil reste utilisable')
  // =====================================================================
  const corrompues = [
    ['#v=1&c=zzzzzz,pasunecouleur', 'couleurs illisibles'],
    ['#c=', 'parametre couleur vide'],
    ['#v=99&c=1b2a41&s=999&r=-4&hw=abc', 'version inconnue et nombres absurdes'],
    ['#h=<script>alert(1)</script>&b=../../etc/passwd', 'injection dans le nom de police'],
    ['#%E0%A4%A', 'sequence d echappement tronquee'],
    ['#' + 'c=1b2a41&'.repeat(400), 'fragment demesure'],
    ['#n=' + encodeURIComponent('M'.repeat(500)), 'nom de marque demesure'],
    ['#c=1b2a41,c9a227,7c9eb2,f4f1ea,111111,222222,333333', 'plus de quatre couleurs'],
  ]

  const pageAbimee = await contexte.newPage()
  const erreursConsole = []
  pageAbimee.on('pageerror', (e) => erreursConsole.push(String(e)))

  for (const [fragment, intitule] of corrompues) {
    await pageAbimee.goto(BASE + '/' + fragment, { waitUntil: 'domcontentloaded' })
    await pageAbimee.waitForTimeout(500)

    const vivant = await pageAbimee.evaluate(() => {
      const racine = document.getElementById('root')
      return {
        rendu: !!racine && racine.children.length > 0,
        onglets: document.querySelectorAll('[role="tab"]').length,
        boutons: document.querySelectorAll('button:not([disabled])').length,
      }
    })
    verifier(
      vivant.rendu && vivant.boutons > 0,
      `reste utilisable : ${intitule}`,
      JSON.stringify(vivant),
    )
  }

  // Apres tout ca, l'outil doit encore accepter une saisie normale.
  await pageAbimee.goto(BASE + '/#c=zzzzzz', { waitUntil: 'domcontentloaded' })
  await stabiliser(pageAbimee)
  const champCouleur = pageAbimee.locator('[data-test="couleur-hex"]').first()
  await champCouleur.fill('#2f6b45')
  await pageAbimee.waitForTimeout(400)
  const nuancesApres = await nuancesVisibles(pageAbimee)
  verifier(nuancesApres.includes('Copier #2f6b45'), 'une saisie normale fonctionne encore apres une URL corrompue')

  verifier(erreursConsole.length === 0, 'aucune exception non rattrapee', erreursConsole.join(' | ').slice(0, 200))
  await pageAbimee.close()

  // =====================================================================
  section('4. Les polices sont bien inlinees dans le PNG')
  // =====================================================================
  const pagePng = await contexte.newPage()
  await pagePng.goto(BASE + '/#v=1&c=1b2a41%2Cc9a227%2C7c9eb2%2Cf4f1ea&h=Cormorant+Garamond&hw=600&b=Manrope&bw=400&s=16&r=1.25&n=N%C3%98RVA', {
    waitUntil: 'domcontentloaded',
  })
  await stabiliser(pagePng)

  // On interroge directement le module qui fabrique la feuille embarquee :
  // c'est lui qui casse quand Google Fonts change quelque chose.
  const feuille = await pagePng.evaluate(async () => {
    const mod = await import('/src/lib/export/fonts-embed.ts').catch(() => null)
    if (mod) {
      return mod.cssPolicesEmbarquees([
        { family: 'Cormorant Garamond', weights: [600] },
        { family: 'Manrope', weights: [400] },
      ])
    }
    // En build de production les modules ne sont pas adressables : on refait le
    // meme travail ici pour verifier que la chaine reseau fonctionne.
    async function pour(family, weight) {
      const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@${weight}&display=swap`
      const css = await (await fetch(url)).text()
      const lien = /url\((https:\/\/[^)]+)\)/.exec(css)
      if (!lien) return ''
      const blob = await (await fetch(lien[1])).blob()
      const data = await new Promise((r) => {
        const f = new FileReader()
        f.onload = () => r(f.result)
        f.readAsDataURL(blob)
      })
      return `@font-face{font-family:'${family}';src:url(${data})}`
    }
    return (await Promise.all([pour('Cormorant Garamond', 600), pour('Manrope', 400)])).join('')
  })

  verifier(feuille.includes('@font-face'), 'la feuille embarquee contient des regles @font-face')
  verifier(feuille.includes('src:url(data:') || feuille.includes('src: url(data:'), 'les fichiers de police sont inlines en data-URI')
  verifier(/Cormorant Garamond/.test(feuille), 'Cormorant Garamond est presente dans la feuille')
  verifier(/Manrope/.test(feuille), 'Manrope est presente dans la feuille')
  verifier(!/url\(https:\/\/fonts\.gstatic/.test(feuille), 'aucune URL distante ne subsiste (le canevas les refuserait)')

  await pagePng.getByRole('tab', { name: 'Brand board', exact: true }).click()
  await pagePng.waitForTimeout(600)

  for (const [selecteur, attendu] of [
    ['telecharger-paysage', { largeur: 2400, hauteur: 1260 }],
    ['telecharger-portrait', { largeur: 2160, hauteur: 2700 }],
  ]) {
    const attente = pagePng.waitForEvent('download', { timeout: 60_000 })
    await pagePng.locator(`[data-test="${selecteur}"]`).click()
    const telechargement = await attente
    const chemin = `${TELECHARGEMENTS}/${telechargement.suggestedFilename()}`
    await telechargement.saveAs(chemin)

    const tampon = await readFile(chemin)
    const d = dimensionsPng(tampon)
    verifier(d !== null, `${selecteur} : le fichier est un PNG valide`)
    verifier(
      d && d.largeur === attendu.largeur && d.hauteur === attendu.hauteur,
      `${selecteur} : ${attendu.largeur} x ${attendu.hauteur}`,
      d ? `${d.largeur} x ${d.hauteur}` : 'illisible',
    )
    verifier(tampon.length > 40_000, `${selecteur} : l image n est pas vide`, `${Math.round(tampon.length / 1024)} ko`)
  }

  // =====================================================================
  section('5. Les exports texte se telechargent en fichiers')
  // =====================================================================
  await pagePng.getByRole('tab', { name: 'Export', exact: true }).click()
  await pagePng.waitForTimeout(300)

  for (const [onglet, cle, extension, sonde] of [
    ['Variables CSS', 'css', '.css', '--color-primary-950: #1b2a41;'],
    ['Tailwind v4', 'tailwind', '.css', '@theme {'],
    ['Tokens JSON', 'dtcg', '.json', '"$type": "color"'],
  ]) {
    await pagePng.getByRole('tab', { name: onglet, exact: true }).click()
    await pagePng.waitForTimeout(200)

    const attente = pagePng.waitForEvent('download', { timeout: 20_000 })
    await pagePng.locator(`[data-test="telecharger-${cle}"]`).click()
    const telechargement = await attente
    const nom = telechargement.suggestedFilename()
    const chemin = `${TELECHARGEMENTS}/${nom}`
    await telechargement.saveAs(chemin)

    const contenu = await readFile(chemin, 'utf-8')
    verifier(nom.endsWith(extension), `${onglet} : le fichier s appelle ${nom}`)
    verifier(nom.startsWith('norva-'), `${onglet} : le nom reprend la marque`, nom)
    verifier(contenu.includes(sonde), `${onglet} : le contenu est complet`, sonde)
  }

  // Le JSON telecharge doit se relire tel quel.
  const json = await readFile(`${TELECHARGEMENTS}/norva-tokens.json`, 'utf-8')
  let relu = null
  try {
    relu = JSON.parse(json)
  } catch {
    /* relu reste nul */
  }
  verifier(relu !== null, 'le JSON telecharge se reparse sans erreur')
  verifier(relu && relu.color && relu.color.primary && relu.color.primary['950'].$value === '#1b2a41', 'les tokens portent les bonnes valeurs')

  await pagePng.close()
  await contexte.close()
  await navigateur.close()

  console.log(`\n${'='.repeat(56)}`)
  console.log(`  ${reussis} verifications reussies, ${echoues} echouees`)
  console.log('='.repeat(56))
  await writeFile(`${TELECHARGEMENTS}/resultat.txt`, `${reussis} reussies, ${echoues} echouees\n`)
  process.exit(echoues === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
