import { differenceEuclidean } from './culori'
import { describe, expect, it } from 'vitest'
import { contrastRatio } from './contrast'
import { versOklch } from './parse'

/** Écart perceptuel dans OKLab : la distance que l'oeil juge, pas la luminance. */
const ecart = differenceEuclidean('oklab')
import { DEFICIENCES, simuler, type Deficience } from './vision'

const AUTRES: Deficience[] = ['deuteranopie', 'protanopie', 'tritanopie']

describe('simuler', () => {
  it('laisse les couleurs intactes en vision courante', () => {
    for (const c of ['#1b2a41', '#c9a227', '#7c9eb2', '#f4f1ea', '#ff0000']) {
      expect(simuler(c, 'normale')).toBe(c)
    }
  })

  it('produit toujours un hexadécimal valide', () => {
    for (const d of AUTRES) {
      for (const c of ['#1b2a41', '#c9a227', '#7c9eb2', '#f4f1ea', '#ff0000', '#00ff00', '#0000ff']) {
        expect(simuler(c, d), `${c} en ${d}`).toMatch(/^#[0-9a-f]{6}$/)
      }
    }
  })

  it('laisse les gris inchangés, ou presque', () => {
    // Un gris n'a pas de teinte à perdre : une simulation qui le déplacerait
    // beaucoup serait le signe d'une erreur de transformation.
    for (const d of AUTRES) {
      for (const gris of ['#000000', '#808080', '#ffffff']) {
        const simule = simuler(gris, d)
        expect(contrastRatio(simule, gris), `${gris} en ${d}`).toBeLessThan(1.15)
      }
    }
  })

  it('la deutéranopie effondre la distinction entre un rouge et un vert', () => {
    /*
     * C'est la confusion caractéristique, et la raison d'être de la
     * fonctionnalité : un vert de validation et un rouge d'erreur qui ne se
     * distinguent que par la teinte deviennent le même objet.
     *
     * On mesure un écart perceptuel dans OKLab, et non un ratio de contraste :
     * le ratio est affaire de luminance, et deux couleurs peuvent garder leur
     * écart de luminance tout en perdant tout écart de teinte.
     */
    const paires: [string, string][] = [
      ['#c81e1e', '#1e8f3c'],
      ['#d94f4f', '#4fa85f'],
    ]
    for (const [rouge, vert] of paires) {
      const normal = ecart(rouge, vert)
      const apres = ecart(simuler(rouge, 'deuteranopie'), simuler(vert, 'deuteranopie'))
      expect(apres, `${normal.toFixed(3)} -> ${apres.toFixed(3)}`).toBeLessThan(normal * 0.5)
    }
  })

  it('la protanopie assombrit nettement les rouges', () => {
    /*
     * Son effet propre n'est pas de rapprocher le rouge du vert dans OKLab —
     * mesuré ainsi, l'écart peut même croître, car la chute de clarté en creuse
     * un nouveau. C'est cette chute qui compte : un rouge d'alerte peut devenir
     * plus sombre que le fond sur lequel on l'avait posé.
     */
    const clarte = (hex: string) => versOklch(hex)!.l
    for (const rouge of ['#ff0000', '#c81e1e', '#e5484d']) {
      const avant = clarte(rouge)
      const apres = clarte(simuler(rouge, 'protanopie'))
      expect(apres, `${rouge} : ${avant.toFixed(3)} -> ${apres.toFixed(3)}`).toBeLessThan(avant * 0.85)
    }
  })

  it('chaque déficience transforme réellement une couleur saturée', () => {
    for (const d of AUTRES) {
      const avant = '#c9a227'
      expect(simuler(avant, d), d).not.toBe(avant)
    }
  })

  it('le catalogue couvre la vision courante et les trois déficiences', () => {
    expect(DEFICIENCES).toHaveLength(4)
    expect(DEFICIENCES[0]!.cle).toBe('normale')
    for (const d of DEFICIENCES) {
      expect(d.nom.length).toBeGreaterThan(0)
      expect(d.detail.length).toBeGreaterThan(0)
    }
  })
})
