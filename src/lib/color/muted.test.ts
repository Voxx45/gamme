import { describe, expect, it } from 'vitest'
import { contrastRatio } from './contrast'
import { attenuer } from './muted'

const PAIRES: [string, string][] = [
  ['#14130f', '#faf9f6'],
  ['#1b2a41', '#f4f1ea'],
  ['#faf9f6', '#1b2a41'],
  ['#000000', '#ffffff'],
  ['#ffffff', '#000000'],
  ['#2f6b45', '#f4f1ea'],
]

describe('attenuer', () => {
  it('ne descend jamais sous le ratio demandé quand celui-ci est atteignable', () => {
    for (const [texte, fond] of PAIRES) {
      for (const cible of [3, 4.5, 7]) {
        const depart = contrastRatio(texte, fond)
        const attenue = attenuer(texte, fond, cible)
        const obtenu = contrastRatio(attenue, fond)
        if (depart >= cible) {
          expect(obtenu, `${texte} sur ${fond} à ${cible}`).toBeGreaterThanOrEqual(cible)
        } else {
          // Seuil hors d'atteinte : la couleur est rendue telle quelle,
          // l'atténuer ne ferait qu'aggraver les choses.
          expect(obtenu, `${texte} sur ${fond} à ${cible}`).toBeCloseTo(depart, 6)
        }
      }
    }
  })

  it('atténue réellement : le résultat contraste moins que la couleur de départ', () => {
    for (const [texte, fond] of PAIRES) {
      const avant = contrastRatio(texte, fond)
      if (avant < 4.5) continue
      const apres = contrastRatio(attenuer(texte, fond, 4.5), fond)
      expect(apres).toBeLessThan(avant)
    }
  })

  it('va au plus près du seuil, sans le franchir', () => {
    // Une atténuation trop timide gâcherait la hiérarchie visuelle.
    for (const [texte, fond] of PAIRES) {
      if (contrastRatio(texte, fond) < 4.5) continue
      const ratio = contrastRatio(attenuer(texte, fond, 4.5), fond)
      expect(ratio).toBeLessThan(4.7)
    }
  })

  it('rend une couleur plus effacée quand on demande un seuil plus bas', () => {
    for (const [texte, fond] of PAIRES) {
      if (contrastRatio(texte, fond) < 7) continue
      const a3 = contrastRatio(attenuer(texte, fond, 3), fond)
      const a7 = contrastRatio(attenuer(texte, fond, 7), fond)
      expect(a3).toBeLessThan(a7)
    }
  })

  it('renvoie la couleur telle quelle si elle n atteint déjà pas le seuil', () => {
    // L atténuer ne ferait qu aggraver les choses.
    expect(attenuer('#c9a227', '#ffffff', 4.5)).toBe('#c9a227')
    expect(attenuer('#f4f1ea', '#ffffff', 4.5)).toBe('#f4f1ea')
  })

  it('produit toujours un hexadécimal valide', () => {
    for (const [texte, fond] of PAIRES) {
      expect(attenuer(texte, fond, 4.5)).toMatch(/^#[0-9a-f]{6}$/)
    }
  })
})
