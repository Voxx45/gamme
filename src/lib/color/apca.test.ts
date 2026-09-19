import { describe, expect, it } from 'vitest'
import { apca, niveauApca } from './apca'
import { contrastRatio } from './contrast'

describe('apca — valeurs de référence de la spécification', () => {
  it('noir sur blanc vaut environ Lc 106', () => {
    expect(apca('#000000', '#ffffff')).toBeCloseTo(106.04, 1)
  })

  it('blanc sur noir vaut environ Lc -108', () => {
    expect(apca('#ffffff', '#000000')).toBeCloseTo(-107.88, 1)
  })

  it('n est pas symétrique, contrairement à WCAG 2', () => {
    // C'est la différence de fond entre les deux calculs : l'oeil ne perçoit
    // pas de la même façon du clair sur sombre et du sombre sur clair.
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(contrastRatio('#ffffff', '#000000'), 10)
    expect(Math.abs(apca('#000000', '#ffffff'))).not.toBeCloseTo(Math.abs(apca('#ffffff', '#000000')), 1)
  })

  it('le signe indique la polarité', () => {
    expect(apca('#1b2a41', '#f4f1ea')).toBeGreaterThan(0)
    expect(apca('#f4f1ea', '#1b2a41')).toBeLessThan(0)
  })

  it('rend zéro quand les deux couleurs sont trop proches', () => {
    expect(apca('#808080', '#808080')).toBe(0)
    expect(Math.abs(apca('#808080', '#818181'))).toBeLessThan(6)
  })

  it('reste dans les bornes de l échelle', () => {
    const couleurs = ['#000000', '#ffffff', '#1b2a41', '#c9a227', '#7c9eb2', '#f4f1ea', '#808080']
    for (const a of couleurs) {
      for (const b of couleurs) {
        const lc = apca(a, b)
        expect(lc).toBeGreaterThanOrEqual(-110)
        expect(lc).toBeLessThanOrEqual(110)
      }
    }
  })
})

describe('niveauApca', () => {
  it('décrit un usage pour chaque palier', () => {
    for (const [texte, fond] of [
      ['#000000', '#ffffff'],
      ['#767676', '#ffffff'],
      ['#c9a227', '#ffffff'],
      ['#f4f1ea', '#ffffff'],
    ]) {
      const n = niveauApca(texte!, fond!)
      expect(n.usage.length).toBeGreaterThan(0)
      expect(n.force).toBe(Math.abs(n.lc))
    }
  })

  it('autorise le texte courant à partir de Lc 60', () => {
    expect(niveauApca('#000000', '#ffffff').texteCourant).toBe(true)
    expect(niveauApca('#f4f1ea', '#ffffff').texteCourant).toBe(false)
  })

  it('diverge de WCAG 2 sur les tons sombres, ce qui est son intérêt', () => {
    /*
     * Un gris moyen sur fond noir : WCAG 2 le déclare conforme AA en texte
     * courant, APCA le juge insuffisant. C'est le désaccord documenté qui
     * justifie d'afficher les deux.
     */
    const ratio = contrastRatio('#757575', '#000000')
    const lc = Math.abs(apca('#757575', '#000000'))
    expect(ratio).toBeGreaterThanOrEqual(4.5)
    expect(lc).toBeLessThan(60)
  })
})
