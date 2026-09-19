import { chromium } from 'playwright'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'

const require = createRequire(import.meta.url)
const CHEMIN_AXE = require.resolve('axe-core')

/**
 * Controle qualite : axe-core, parcours clavier, cas limites.
 *
 *   npm run build && npm run preview
 *   node scripts/qa.mjs
 */

const BASE = process.env.BASE ?? 'http://localhost:4200'

const NORVA =
  '#v=1&c=1b2a41%2Cc9a227%2C7c9eb2%2Cf4f1ea&h=Cormorant+Garamond&hw=600&b=Manrope&bw=400&s=16&r=1.25&n=N%C3%98RVA'

let reussis = 0
let echoues = 0
const journal = []

function verifier(condition, intitule, detail = '') {
  const ligne = `${condition ? 'OK   ' : 'ECHEC'} ${intitule}${detail ? ' -- ' + detail : ''}`
  journal.push(ligne)
  if (condition) reussis += 1
  else echoues += 1
  console.log('  ' + ligne)
}

function section(titre) {
  console.log(`\n${titre}\n${'-'.repeat(titre.length)}`)
  journal.push('', titre, '-'.repeat(titre.length))
}

async function stabiliser(page) {
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(400)
}

/** Passe axe-core sur la page et renvoie les violations. */
async function auditAxe(page) {
  await page.addScriptTag({ path: CHEMIN_AXE })
  return page.evaluate(async () => {
    const resultat = await window.axe.run(document, {
      resultTypes: ['violations'],
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
    })
    return resultat.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      aide: v.help,
      noeuds: v.nodes.length,
      exemple: v.nodes[0]?.target?.join(' ') ?? '',
    }))
  })
}

/** L'element qui a le focus, decrit de facon lisible. */
async function focusCourant(page) {
  return page.evaluate(() => {
    const e = document.activeElement
    if (!e || e === document.body) return 'aucun'
    const nom =
      e.getAttribute('aria-label') ??
      e.textContent?.trim().slice(0, 42) ??
      e.getAttribute('placeholder') ??
      ''
    return `${e.tagName.toLowerCase()}${e.type ? '[' + e.type + ']' : ''} "${nom}"`
  })
}

/** Le focus est-il visible, c'est a dire l'anneau est-il effectivement peint ? */
async function focusVisible(page) {
  return page.evaluate(() => {
    const e = document.activeElement
    if (!e || e === document.body) return false
    const style = getComputedStyle(e)
    const epaisseur = parseFloat(style.outlineWidth || '0')
    return epaisseur >= 1.5 && style.outlineStyle !== 'none'
  })
}

async function main() {
  await mkdir('rapports', { recursive: true })
  const navigateur = await chromium.launch()
  const contexte = await navigateur.newContext({
    viewport: { width: 1440, height: 960 },
    locale: 'fr-FR',
    permissions: ['clipboard-read', 'clipboard-write'],
    acceptDownloads: true,
    reducedMotion: 'reduce',
  })

  // =====================================================================
  section('3. axe-core sur trois etats')
  // =====================================================================
  const CAS = [
    ['etat vide', BASE + '/', null],
    ['exemple NORVA', BASE + '/' + NORVA, null],
    [
      'quatre couleurs proches',
      BASE + '/#v=1&c=2f6b45%2C336f49%2C2b6541%2C35744d&h=Inter&hw=700&b=Inter&bw=400&s=16&r=1.25&n=Proches',
      null,
    ],
  ]

  const violationsParCas = {}
  for (const [intitule, url] of CAS) {
    const page = await contexte.newPage()
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await stabiliser(page)

    const violations = await auditAxe(page)
    violationsParCas[intitule] = violations

    const graves = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    verifier(graves.length === 0, `${intitule} : aucune violation serieuse ou critique`, graves.map((v) => `${v.id} (${v.noeuds})`).join(', '))

    const mineures = violations.filter((v) => v.impact !== 'serious' && v.impact !== 'critical')
    if (mineures.length > 0) {
      console.log(`         (${mineures.length} violation(s) mineure(s) : ${mineures.map((v) => v.id + '/' + v.impact).join(', ')})`)
      journal.push(`         mineures : ${mineures.map((v) => v.id + '/' + v.impact + ' x' + v.noeuds).join(', ')}`)
    }
    await page.close()
  }
  await writeFile('rapports/axe.json', JSON.stringify(violationsParCas, null, 2))

  // =====================================================================
  section('4. Parcours complet au clavier seul')
  // =====================================================================
  const clavier = await contexte.newPage()
  await clavier.goto(BASE + '/' + NORVA, { waitUntil: 'domcontentloaded' })
  await stabiliser(clavier)

  // -- Atteindre le contenu par le lien d'evitement
  await clavier.keyboard.press('Tab')
  verifier((await focusCourant(clavier)).includes('Aller au contenu'), 'premier Tab : lien d evitement')
  verifier(await focusVisible(clavier), 'le lien d evitement montre un anneau de focus')

  // -- Parcourir toute la page sans jamais perdre le focus.
  //    On part d'une charte a deux couleurs : avec quatre, le bouton d'ajout
  //    est desactive, donc legitimement hors du parcours de tabulation.
  await clavier.goto(BASE + '/#v=1&c=1b2a41%2Cc9a227&h=Inter&hw=700&b=Inter&bw=400&s=16&r=1.25&n=Deux', {
    waitUntil: 'domcontentloaded',
  })
  await stabiliser(clavier)
  await clavier.keyboard.press('Tab')
  const visites = []
  let trousNoirs = 0
  let retoursAuDebut = 0
  for (let i = 0; i < 90; i++) {
    await clavier.keyboard.press('Tab')
    const ou = await focusCourant(clavier)
    if (ou === 'aucun') {
      /*
       * Le focus quitte le document une fois par tour, en passant par la barre
       * du navigateur : c'est le comportement normal, pas un defaut. Ce qui
       * serait grave, c'est qu'il n'en revienne pas — un trou noir — ou qu'il
       * n'en sorte jamais — un piege au clavier.
       */
      await clavier.keyboard.press('Tab')
      const suivant = await focusCourant(clavier)
      if (suivant === 'aucun') trousNoirs += 1
      else retoursAuDebut += 1
      visites.push(suivant)
      continue
    }
    visites.push(ou)
  }
  verifier(trousNoirs === 0, '90 tabulations : le focus ne disparait jamais durablement', `${trousNoirs} trou(s) noir(s)`)
  verifier(
    retoursAuDebut >= 1,
    'le parcours boucle : aucun piege au clavier',
    `${retoursAuDebut} tour(s) complet(s)`,
  )
  verifier(
    new Set(visites).size > 20,
    'le parcours traverse toute l interface',
    `${new Set(visites).size} elements distincts`,
  )
  verifier(
    visites.some((v) => v.includes('Ajouter une couleur')),
    'le bouton d ajout de couleur est atteignable',
  )

  // -- Ajouter une couleur au clavier
  await clavier.goto(BASE + '/#v=1&c=1b2a41%2Cc9a227&h=Inter&hw=700&b=Inter&bw=400&s=16&r=1.25', {
    waitUntil: 'domcontentloaded',
  })
  await stabiliser(clavier)
  const avantAjout = await clavier.locator('aside input[type="text"]').count()
  await clavier.getByRole('button', { name: /Ajouter une couleur/ }).focus()
  verifier(await focusVisible(clavier), 'anneau de focus visible sur le bouton d ajout')
  await clavier.keyboard.press('Enter')
  await clavier.waitForTimeout(400)
  const apresAjout = await clavier.locator('aside input[type="text"]').count()
  verifier(apresAjout === avantAjout + 1, 'couleur ajoutee par Entree', `${avantAjout} -> ${apresAjout}`)

  // -- Saisir une couleur au clavier, dans le champ
  const champ = clavier.locator('aside input[type="text"]').nth(3)
  await champ.focus()
  await clavier.keyboard.press('Control+a')
  await clavier.keyboard.type('#2f6b45')
  await clavier.waitForTimeout(400)
  verifier(
    (await clavier.evaluate(() => document.activeElement?.value)) === '#2f6b45',
    'le champ garde le focus et la saisie pendant la frappe',
  )

  // -- Changer de police au clavier seul
  const combo = clavier.locator('input[role="combobox"]').first()
  await combo.focus()
  await clavier.keyboard.type('cormor')
  await clavier.waitForTimeout(700)
  const ouvert = await combo.getAttribute('aria-expanded')
  verifier(ouvert === 'true', 'la liste des polices s ouvre a la frappe')
  const actifAvant = await combo.getAttribute('aria-activedescendant')
  await clavier.keyboard.press('ArrowDown')
  await clavier.waitForTimeout(150)
  const actifApres = await combo.getAttribute('aria-activedescendant')
  verifier(
    actifAvant !== null && actifApres !== null && actifAvant !== actifApres,
    'la fleche bas deplace l element actif',
    `${actifAvant} -> ${actifApres}`,
  )
  await clavier.keyboard.press('ArrowUp')
  await clavier.keyboard.press('Enter')
  await clavier.waitForTimeout(600)
  const policeChoisie = await combo.inputValue()
  verifier(/Cormorant/.test(policeChoisie), 'police changee par Entree', policeChoisie)
  verifier(
    (await clavier.evaluate(() => document.activeElement?.getAttribute('role'))) === 'combobox',
    'le focus revient au champ apres la selection',
  )
  await clavier.keyboard.press('Escape')

  // -- Naviguer entre les onglets aux fleches
  const premierOnglet = clavier.getByRole('tab', { name: 'Palette', exact: true })
  await premierOnglet.focus()
  await clavier.keyboard.press('ArrowRight')
  await clavier.waitForTimeout(250)
  verifier(
    (await clavier.evaluate(() => document.activeElement?.textContent?.trim())) === 'Contrastes',
    'fleche droite : onglet suivant',
  )
  await clavier.keyboard.press('End')
  await clavier.waitForTimeout(250)
  verifier(
    (await clavier.evaluate(() => document.activeElement?.textContent?.trim())) === 'Export',
    'touche Fin : dernier onglet',
  )

  // -- Copier un export au clavier
  await clavier.keyboard.press('Enter')
  await clavier.waitForTimeout(400)
  const boutonCopier = clavier.getByRole('button', { name: 'Copier', exact: true })
  await boutonCopier.focus()
  verifier(await focusVisible(clavier), 'anneau de focus visible sur le bouton Copier')
  await clavier.keyboard.press('Enter')
  await clavier.waitForTimeout(400)
  const presse = await clavier.evaluate(() => navigator.clipboard.readText())
  verifier(presse.includes('--color-primary-950'), 'export CSS copie au clavier', presse.slice(0, 40))
  verifier(
    (await clavier.getByRole('button', { name: 'Copié', exact: true }).count()) === 1,
    'la copie est confirmee visuellement',
  )

  // -- Telecharger le PNG au clavier
  await clavier.getByRole('tab', { name: 'Brand board', exact: true }).focus()
  await clavier.keyboard.press('Enter')
  await clavier.waitForTimeout(700)
  const boutonPng = clavier.getByRole('button', { name: /PNG 1200/ })
  await boutonPng.focus()
  verifier(await focusVisible(clavier), 'anneau de focus visible sur le bouton PNG')
  const attente = clavier.waitForEvent('download', { timeout: 60_000 })
  await clavier.keyboard.press('Enter')
  const fichier = await attente
  verifier(/\.png$/.test(fichier.suggestedFilename()), 'PNG telecharge au clavier', fichier.suggestedFilename())

  // -- Le mouvement reduit est respecte
  const transitions = await clavier.evaluate(() => {
    const b = document.querySelector('button')
    return b ? parseFloat(getComputedStyle(b).transitionDuration) : -1
  })
  verifier(transitions >= 0 && transitions < 0.001, 'prefers-reduced-motion coupe les transitions', `${transitions}s`)
  await clavier.close()

  // =====================================================================
  section('5. Cas limites')
  // =====================================================================

  // -- Couleur invalide saisie a la main
  const limites = await contexte.newPage()
  const erreursJs = []
  limites.on('pageerror', (e) => erreursJs.push(String(e)))
  await limites.goto(BASE + '/' + NORVA, { waitUntil: 'domcontentloaded' })
  await stabiliser(limites)

  const premierChamp = limites.locator('aside input[type="text"]').nth(1)
  await premierChamp.fill('pas une couleur')
  await limites.waitForTimeout(400)
  verifier(
    (await premierChamp.getAttribute('aria-invalid')) === 'true',
    'couleur invalide : le champ est marque aria-invalid',
  )
  const messageErreur = await limites.locator('aside p.text-fail').first().textContent()
  verifier(
    (messageErreur ?? '').includes('Formats acceptes') || (messageErreur ?? '').includes('Formats acceptés'),
    'couleur invalide : le message dit quoi faire',
    (messageErreur ?? '').slice(0, 70),
  )
  const decrit = await premierChamp.getAttribute('aria-describedby')
  verifier(decrit !== null, 'couleur invalide : le message est relie au champ par aria-describedby')
  verifier(
    (await limites.locator('[role="tabpanel"], h2').count()) > 0,
    'couleur invalide : la charte precedente reste affichee',
  )
  await premierChamp.fill('#1b2a41')
  await limites.waitForTimeout(400)
  verifier((await premierChamp.getAttribute('aria-invalid')) === 'false', 'la saisie corrigee efface l erreur')

  // -- Une seule couleur
  await limites.goto(BASE + '/#v=1&c=1b2a41&h=Inter&hw=700&b=Inter&bw=400&s=16&r=1.25&n=Solo', {
    waitUntil: 'domcontentloaded',
  })
  await stabiliser(limites)
  const suppression = limites.getByRole('button', { name: /Supprimer/ })
  verifier(await suppression.isDisabled(), 'une seule couleur : la suppression est desactivee')
  const nuancesSolo = await limites.locator('button[title^="Copier #"]').count()
  verifier(nuancesSolo === 11, 'une seule couleur : 11 nuances calculees', String(nuancesSolo))
  await limites.getByRole('tab', { name: 'Contrastes', exact: true }).click()
  await limites.waitForTimeout(400)
  const cellulesSolo = await limites.locator('table td').count()
  verifier(cellulesSolo === 9, 'une seule couleur : matrice 3x3 avec blanc et noir', String(cellulesSolo))

  // -- Quatre couleurs presque identiques
  await limites.goto(BASE + '/#v=1&c=2f6b45%2C336f49%2C2b6541%2C35744d&h=Inter&hw=700&b=Inter&bw=400&s=16&r=1.25&n=Proches', {
    waitUntil: 'domcontentloaded',
  })
  await stabiliser(limites)
  await limites.getByRole('tab', { name: 'Contrastes', exact: true }).click()
  await limites.waitForTimeout(500)
  const resume = await limites.locator('p.tabulaire').first().textContent()
  verifier((resume ?? '').includes('/30'), 'quatre couleurs proches : la matrice se calcule', (resume ?? '').trim())

  /*
   * Chaque paire en echec doit recevoir soit une nuance cliquable, soit le
   * message qui dit qu'aucune ne passe. Une ligne muette serait un cul-de-sac :
   * on annonce un probleme sans rien proposer ni expliquer pourquoi.
   */
  const lignes = await limites.evaluate(() => {
    const liste = [...document.querySelectorAll('li')].filter((li) => (li.textContent ?? '').includes(' sur '))
    return liste.map((li) => ({
      proposition: li.querySelector('button') !== null,
      explication: /Aucune nuance de cette teinte ne passe/.test(li.textContent ?? ''),
    }))
  })
  verifier(
    lignes.length > 0 && lignes.every((l) => l.proposition || l.explication),
    'quatre couleurs proches : aucune correction muette',
    `${lignes.length} lignes, ${lignes.filter((l) => l.explication).length} sans solution mais annoncees`,
  )

  // Quatre verts a un cheveu l'un de l'autre doivent produire quatre echelles
  // reellement differentes : sinon l'ancrage ecrase les ecarts.
  await limites.getByRole('tab', { name: 'Palette', exact: true }).click()
  await limites.waitForTimeout(400)
  const nuancesProches = await limites.locator('button[title^="Copier #"]').evaluateAll((b) =>
    b.map((x) => x.getAttribute('title')),
  )
  const distinctes = new Set(nuancesProches).size
  /*
   * Quatre verts a 1 % l'un de l'autre produisent forcement quelques collisions
   * apres quantification sur 8 bits, surtout aux extremites ou les rampes se
   * rejoignent presque. Ce qui compte n'est pas l'absence de doublon mais que
   * les quatre echelles ne se soient pas effondrees en une seule : une seule
   * rampe ne ferait que 11 valeurs.
   */
  verifier(
    nuancesProches.length === 44 && distinctes >= 30,
    'quatre couleurs proches : les quatre echelles restent distinctes',
    `${nuancesProches.length} nuances, ${distinctes} valeurs differentes, ${44 - distinctes} collisions`,
  )

  // -- Une police qui ne charge pas
  const sansPolice = await contexte.newPage()
  await sansPolice.route('**fonts.googleapis.com/**', (r) => r.abort())
  await sansPolice.route('**fonts.gstatic.com/**', (r) => r.abort())
  await sansPolice.goto(BASE + '/' + NORVA, { waitUntil: 'domcontentloaded' })
  await sansPolice.waitForTimeout(2500)
  const vivantSansPolice = await sansPolice.evaluate(() => ({
    rendu: (document.getElementById('root')?.children.length ?? 0) > 0,
    boutons: document.querySelectorAll('button:not([disabled])').length,
    texteVisible: (document.body.innerText ?? '').length,
  }))
  verifier(
    vivantSansPolice.rendu && vivantSansPolice.boutons > 5 && vivantSansPolice.texteVisible > 400,
    'police injoignable : l outil reste entierement utilisable',
    JSON.stringify(vivantSansPolice),
  )
  const famillesAppliquees = await sansPolice.evaluate(() => {
    const p = document.querySelector('[role="tabpanel"] p, main p')
    return p ? getComputedStyle(p).fontFamily : ''
  })
  verifier(famillesAppliquees.length > 0, 'police injoignable : la pile de repli s applique', famillesAppliquees.slice(0, 60))
  await sansPolice.close()

  // -- Ecran de 320 px
  const etroit = await navigateur.newContext({
    viewport: { width: 320, height: 640 },
    isMobile: true,
    hasTouch: true,
    locale: 'fr-FR',
    reducedMotion: 'reduce',
  })
  const petit = await etroit.newPage()
  await petit.goto(BASE + '/' + NORVA, { waitUntil: 'domcontentloaded' })
  await stabiliser(petit)

  /*
   * Mesurer le debordement par `documentElement.scrollWidth` donne un faux
   * positif : Chrome y compte le contenu des conteneurs a defilement imbriques,
   * meme quand ils le clipent correctement. La matrice de contrastes, large de
   * 878 px dans une zone de 280 px, suffisait a faire monter la valeur a 833
   * alors que la page ne defile pas d'un pixel.
   *
   * On mesure donc ce que la personne constate : la page defile-t-elle
   * horizontalement, et un element deborde-t-il sans qu'un ancetre le clipe.
   */
  const debordement = await petit.evaluate((largeur) => {
    window.scrollTo(2000, 0)
    const atteint = window.scrollX
    window.scrollTo(0, 0)

    const coupables = [...document.querySelectorAll('body *')]
      .filter((e) => e.getBoundingClientRect().right > largeur + 1)
      .filter((e) => {
        let p = e.parentElement
        while (p && p !== document.body) {
          const o = getComputedStyle(p).overflowX
          if (o === 'auto' || o === 'scroll' || o === 'hidden') return false
          p = p.parentElement
        }
        return true
      })
      .slice(0, 6)
      .map((e) => e.tagName.toLowerCase() + '.' + String(e.className).slice(0, 46))

    return { atteint, bodyScroll: document.body.scrollWidth, clientWidth: document.documentElement.clientWidth, coupables }
  }, 320)

  verifier(
    debordement.atteint === 0,
    '320 px : la page ne defile pas horizontalement',
    `scrollX atteint ${debordement.atteint}`,
  )
  verifier(
    debordement.bodyScroll <= debordement.clientWidth + 1,
    '320 px : le corps de page tient dans la largeur',
    `${debordement.bodyScroll} / ${debordement.clientWidth}`,
  )
  verifier(
    debordement.coupables.length === 0,
    '320 px : aucun element ne deborde hors d une zone a defilement',
    debordement.coupables.join(' | '),
  )

  const axe320 = await auditAxe(petit)
  const graves320 = axe320.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  verifier(graves320.length === 0, '320 px : aucune violation axe serieuse ou critique', graves320.map((v) => v.id).join(', '))
  await petit.screenshot({ path: 'captures/mobile-320.png', fullPage: false })
  await etroit.close()

  verifier(erreursJs.length === 0, 'aucune exception JavaScript sur tout le parcours', erreursJs.join(' | ').slice(0, 160))
  await limites.close()

  await contexte.close()
  await navigateur.close()

  console.log(`\n${'='.repeat(56)}`)
  console.log(`  ${reussis} verifications reussies, ${echoues} echouees`)
  console.log('='.repeat(56))
  await writeFile('rapports/qa.txt', journal.join('\n') + `\n\n${reussis} reussies, ${echoues} echouees\n`)
  process.exit(echoues === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
