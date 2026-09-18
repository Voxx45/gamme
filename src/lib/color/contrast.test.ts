import { describe, expect, it } from 'vitest'
import { contrastRatio, evaluatePair, relativeLuminance } from './contrast'

const BLANC = '#ffffff'
const NOIR = '#000000'

describe('relativeLuminance — valeurs de référence WCAG', () => {
  it('vaut 1 pour le blanc et 0 pour le noir', () => {
    expect(relativeLuminance(BLANC)).toBeCloseTo(1, 10)
    expect(relativeLuminance(NOIR)).toBeCloseTo(0, 10)
  })

  it('applique la pondération des canaux', () => {
    // Coefficients WCAG : 0.2126 R, 0.7152 G, 0.0722 B.
    expect(relativeLuminance('#ff0000')).toBeCloseTo(0.2126, 4)
    expect(relativeLuminance('#00ff00')).toBeCloseTo(0.7152, 4)
    expect(relativeLuminance('#0000ff')).toBeCloseTo(0.0722, 4)
  })
})

describe('contrastRatio — valeurs de référence connues', () => {
  it('noir sur blanc vaut exactement 21:1', () => {
    expect(contrastRatio(NOIR, BLANC)).toBeCloseTo(21, 10)
  })

  it('une couleur sur elle-même vaut 1:1', () => {
    for (const c of [BLANC, NOIR, '#767676', '#c9a227']) {
      expect(contrastRatio(c, c)).toBeCloseTo(1, 10)
    }
  })

  it('#767676 sur blanc vaut environ 4.54:1', () => {
    expect(contrastRatio('#767676', BLANC)).toBeCloseTo(4.54, 2)
  })

  it('#595959 sur blanc vaut environ 7:1, la limite AAA', () => {
    expect(contrastRatio('#595959', BLANC)).toBeCloseTo(7.0, 1)
  })

  it('#949494 sur blanc vaut environ 3:1, la limite du grand texte', () => {
    expect(contrastRatio('#949494', BLANC)).toBeCloseTo(3.03, 2)
  })

  it('est symétrique : l ordre des arguments ne change rien', () => {
    expect(contrastRatio('#1b2a41', '#c9a227')).toBeCloseTo(contrastRatio('#c9a227', '#1b2a41'), 12)
  })

  it('reste borné entre 1 et 21', () => {
    const couleurs = ['#ffffff', '#000000', '#1b2a41', '#c9a227', '#7c9eb2', '#f4f1ea']
    for (const a of couleurs) {
      for (const b of couleurs) {
        const r = contrastRatio(a, b)
        expect(r).toBeGreaterThanOrEqual(1)
        expect(r).toBeLessThanOrEqual(21)
      }
    }
  })
})

describe('evaluatePair — verdicts', () => {
  it('#767676 sur blanc passe AA en texte courant, mais pas AAA', () => {
    const e = evaluatePair('#767676', BLANC)
    expect(e.ratio).toBe(4.54)
    expect(e.normal.aa).toBe(true)
    expect(e.normal.aaa).toBe(false)
    expect(e.normal.verdict).toBe('AA')
  })

  it('#777777 sur blanc échoue de peu en texte courant et passe en grand texte', () => {
    const e = evaluatePair('#777777', BLANC)
    expect(e.normal.verdict).toBe('échec')
    expect(e.grand.verdict).toBe('AA')
  })

  it('noir sur blanc est AAA partout', () => {
    const e = evaluatePair(NOIR, BLANC)
    expect(e.ratio).toBe(21)
    expect(e.normal.verdict).toBe('AAA')
    expect(e.grand.verdict).toBe('AAA')
    expect(e.interface.pass).toBe(true)
  })

  it('une couleur sur elle-même échoue partout', () => {
    const e = evaluatePair('#c9a227', '#c9a227')
    expect(e.normal.verdict).toBe('échec')
    expect(e.grand.verdict).toBe('échec')
    expect(e.interface.pass).toBe(false)
  })

  it('applique les seuils du grand texte : 3 pour AA, 4.5 pour AAA', () => {
    const e = evaluatePair('#949494', BLANC)
    expect(e.grand.seuilAA).toBe(3)
    expect(e.grand.seuilAAA).toBe(4.5)
    expect(e.grand.aa).toBe(true)
    expect(e.grand.aaa).toBe(false)
  })
})

describe('evaluatePair — le ratio affiché ne contredit jamais le verdict', () => {
  it('tronque au lieu d arrondir', () => {
    const e = evaluatePair('#767676', BLANC)
    expect(e.ratio).toBeLessThanOrEqual(e.ratioBrut)
    expect(e.ratioBrut - e.ratio).toBeLessThan(0.01)
  })

  it('un ratio affiché >= 4.5 correspond toujours à un succès AA', () => {
    // Le cas qui ferait passer l outil pour bogué : afficher 4.50 et dire echec.
    for (let v = 0; v < 256; v++) {
      const hex = `#${v.toString(16).padStart(2, '0').repeat(3)}`
      const e = evaluatePair(hex, BLANC)
      expect(e.ratio >= 4.5).toBe(e.normal.aa)
      expect(e.ratio >= 7).toBe(e.normal.aaa)
      expect(e.ratio >= 3).toBe(e.grand.aa)
    }
  })
})
