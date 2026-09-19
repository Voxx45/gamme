import { cssPolicesEmbarquees } from './fonts-embed'

export { baseNomFichier } from './nom-fichier'

/**
 * Le seul module de `src/lib/` qui touche au DOM.
 *
 * `html-to-image` sérialise le nœud dans un SVG à objet étranger, puis le peint
 * dans un canevas. Trois précautions :
 *
 * — Les polices sont embarquées par nos soins et passées via `fontEmbedCSS`
 *   (voir `fonts-embed.ts`) : c'est le point de rupture habituel de cet export.
 * — On attend `document.fonts.ready`, sans quoi une police encore en vol serait
 *   remplacée par son repli au moment de la capture.
 * — `pixelRatio: 2` double la définition, pour rester net sur les écrans à haute
 *   densité et sur les aperçus de lien qui ré-échantillonnent.
 *
 * Pas de `cacheBust` : il ajoute un paramètre de requête aux URL de ressources,
 * ce qui casse les réponses mises en cache de Google Fonts sans rien apporter
 * ici, puisque les polices sont déjà inlinées.
 *
 * `html-to-image` est chargé à la demande, au premier export : la bibliothèque
 * ne sert que dans l'onglet Brand board, il n'y a aucune raison de la faire
 * télécharger à tout le monde au premier affichage.
 */

export type FormatBoard = {
  cle: string
  titre: string
  largeur: number
  hauteur: number
  /** Ce à quoi le format sert, dit en clair dans l'interface. */
  usage: string
}

export const FORMATS: readonly FormatBoard[] = [
  {
    cle: 'paysage',
    titre: '1200 × 630',
    largeur: 1200,
    hauteur: 630,
    usage: 'Aperçu de lien, bannière, image de partage.',
  },
  {
    cle: 'portrait',
    titre: '1080 × 1350',
    largeur: 1080,
    hauteur: 1350,
    usage: 'Post LinkedIn et Instagram, au format 4:5.',
  },
]

export const DEFINITION = 2

/** Produit l'image et renvoie son data-URI, sans la télécharger. */
export async function genererPng(
  noeud: HTMLElement,
  options: { largeur: number; hauteur: number; polices: { family: string; weights: number[] }[] },
): Promise<string> {
  const [{ toPng }, fontEmbedCSS] = await Promise.all([
    import('html-to-image'),
    cssPolicesEmbarquees(options.polices),
  ])

  if (document.fonts?.ready) {
    await document.fonts.ready
  }

  return toPng(noeud, {
    pixelRatio: DEFINITION,
    width: options.largeur,
    height: options.hauteur,
    fontEmbedCSS,
    // Le nœud peut être réduit par transformation CSS à l'affichage, ou placé
    // hors écran : on neutralise l'un et l'autre le temps de la capture.
    style: { transform: 'none', transformOrigin: 'top left', margin: '0', position: 'static' },
  })
}

/** Produit l'image et déclenche son téléchargement. */
export async function exporterPng(
  noeud: HTMLElement,
  nomFichier: string,
  options: { largeur: number; hauteur: number; polices: { family: string; weights: number[] }[] },
): Promise<void> {
  telecharger(await genererPng(noeud, options), nomFichier)
}

/** Déclenche le téléchargement d'une URL, data-URI comprise. */
export function telecharger(url: string, nomFichier: string): void {
  const lien = document.createElement('a')
  lien.download = nomFichier
  lien.href = url
  lien.rel = 'noopener'
  document.body.appendChild(lien)
  lien.click()
  lien.remove()
}

/** Déclenche le téléchargement d'un contenu texte, sans passer par un serveur. */
export function telechargerTexte(contenu: string, nomFichier: string, typeMime: string): void {
  const blob = new Blob([contenu], { type: `${typeMime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  telecharger(url, nomFichier)
  // Laisser au navigateur le temps d'ouvrir le flux avant de libérer l'objet.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
