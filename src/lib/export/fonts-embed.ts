/**
 * Fabrique une feuille `@font-face` dont les fichiers de police sont inlinés
 * en data-URI, pour que l'export PNG rende les vraies polices.
 *
 * Pourquoi ne pas laisser `html-to-image` s'en charger : la bibliothèque
 * parcourt `document.styleSheets` pour retrouver les `@font-face`. Une feuille
 * servie par un autre domaine — c'est le cas de Google Fonts — lève une
 * `SecurityError` à la lecture de ses règles. La bibliothèque retombe alors sur
 * un re-téléchargement qui échoue parfois silencieusement, et l'image sort avec
 * la police de repli. C'est le bug le plus courant de cet export, et il ne se
 * voit qu'en ouvrant le fichier.
 *
 * On construit donc nous-mêmes la feuille, et on la passe à `html-to-image` par
 * son option `fontEmbedCSS`, qui court-circuite entièrement sa propre détection.
 */

/** Une feuille par famille et jeu de graisses : on ne retélécharge jamais. */
const cache = new Map<string, Promise<string>>()

/**
 * Plages Unicode conservées.
 *
 * Google sert une dizaine de sous-ensembles par famille — cyrillique, grec,
 * vietnamien… Tout inliner ferait plusieurs mégaoctets de base64 pour une image
 * qui n'affiche que du latin. On garde le latin de base, qui contient déjà le Ø
 * de NØRVA et les accents français, et le latin étendu.
 */
const PLAGES_GARDEES = ['U+0000-00FF', 'U+0100-02AF', 'U+0000-007F']

function urlCss2(family: string, weights: number[]): string {
  const nom = encodeURIComponent(family).replace(/%20/g, '+')
  const graisses = [...new Set(weights)].sort((a, b) => a - b).join(';')
  return `https://fonts.googleapis.com/css2?family=${nom}:wght@${graisses}&display=swap`
}

/** Ne garde que les blocs `@font-face` utiles au latin. */
function filtrerAuLatin(css: string): string {
  const blocs = css.split('@font-face').slice(1)
  const gardes = blocs.filter((bloc) => {
    const plage = /unicode-range:\s*([^;}]+)/i.exec(bloc)
    // Pas de plage déclarée : la police couvre tout, on la garde.
    if (!plage) return true
    return PLAGES_GARDEES.some((p) => plage[1]!.includes(p))
  })
  return gardes.map((b) => `@font-face${b}`).join('')
}

async function versDataUri(url: string): Promise<string | null> {
  try {
    const reponse = await fetch(url)
    if (!reponse.ok) return null
    const blob = await reponse.blob()
    return await new Promise<string | null>((resoudre) => {
      const lecteur = new FileReader()
      lecteur.onload = () => resoudre(typeof lecteur.result === 'string' ? lecteur.result : null)
      lecteur.onerror = () => resoudre(null)
      lecteur.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

async function feuillePourFamille(family: string, weights: number[]): Promise<string> {
  const reponse = await fetch(urlCss2(family, weights))
  if (!reponse.ok) return ''

  // Le navigateur envoie son propre User-Agent : Google renvoie donc du woff2.
  let css = filtrerAuLatin(await reponse.text())
  if (css === '') return ''

  const liens = [...new Set([...css.matchAll(/url\((https:\/\/[^)"']+)\)/g)].map((m) => m[1]!))]
  const inlines = await Promise.all(liens.map(async (u) => [u, await versDataUri(u)] as const))

  for (const [lien, data] of inlines) {
    if (data) css = css.split(lien).join(data)
  }

  // Un fichier qui n'a pas pu être inliné laisserait une URL distante que le
  // canevas refusera de peindre : on retire le bloc plutôt que de salir l'image.
  const echecs = inlines.filter(([, d]) => d === null).map(([u]) => u)
  if (echecs.length > 0) {
    css = css
      .split('@font-face')
      .slice(1)
      .filter((bloc) => !echecs.some((u) => bloc.includes(u)))
      .map((b) => `@font-face${b}`)
      .join('')
  }

  return css
}

/**
 * Feuille `@font-face` complète, polices inlinées, pour les familles demandées.
 * Une famille qui échoue est simplement absente : l'image sortira avec son
 * repli plutôt que de ne pas sortir du tout.
 */
export async function cssPolicesEmbarquees(
  demandes: { family: string; weights: number[] }[],
): Promise<string> {
  const morceaux = await Promise.all(
    demandes.map(({ family, weights }) => {
      const cle = `${family}:${[...new Set(weights)].sort((a, b) => a - b).join(',')}`
      let promesse = cache.get(cle)
      if (!promesse) {
        promesse = feuillePourFamille(family, weights).catch(() => '')
        cache.set(cle, promesse)
      }
      return promesse
    }),
  )
  return morceaux.filter((m) => m !== '').join('\n')
}
