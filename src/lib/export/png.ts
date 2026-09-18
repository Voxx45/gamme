import { toPng } from 'html-to-image'

/**
 * Le seul module de `src/lib/` qui touche au DOM.
 *
 * `html-to-image` sérialise le nœud dans un SVG à objet étranger, puis le rend
 * dans un canevas. Deux précautions :
 *
 * — `pixelRatio: 2` produit une image à 2400 × 1260, nette sur les écrans à
 *   haute densité et sur les aperçus de lien qui ré-échantillonnent.
 * — La bibliothèque va chercher les feuilles de style pour y inliner les polices.
 *   Celle de Google Fonts est servie avec les en-têtes CORS qu'il faut ; on
 *   attend tout de même `document.fonts.ready`, sans quoi une police encore en
 *   vol serait remplacée par son repli dans l'image exportée.
 */
export async function exporterPng(
  noeud: HTMLElement,
  nomFichier: string,
  options: { largeur: number; hauteur: number },
): Promise<void> {
  if (document.fonts?.ready) {
    await document.fonts.ready
  }

  const url = await toPng(noeud, {
    pixelRatio: 2,
    width: options.largeur,
    height: options.hauteur,
    cacheBust: true,
    // Le nœud est réduit par transformation CSS à l'affichage : on neutralise
    // la transformation le temps de la capture, pour exporter à taille réelle.
    style: { transform: 'none', transformOrigin: 'top left', margin: '0' },
  })

  const lien = document.createElement('a')
  lien.download = nomFichier
  lien.href = url
  lien.click()
}

/** Réduit un nom de marque à un nom de fichier sûr. */
export function nomDeFichier(nom: string): string {
  const base = nom
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  return `${base === '' ? 'charte' : base}-brand-board.png`
}
