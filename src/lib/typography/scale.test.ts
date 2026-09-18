import { describe, expect, it } from 'vitest'
import { BORNES, interligneConseille, NIVEAUX, RATIOS, typeScale } from './scale'

describe('typeScale — structure', () => {
  it('produit un niveau par entrée de l échelle', () => {
    const s = typeScale(16, 1.25)
    expect(s.levels).toHaveLength(NIVEAUX.length)
    expect(s.levels.map((n) => n.name)).toEqual(NIVEAUX.map((n) => n.name))
  })

  it('place la taille de base au niveau base', () => {
    for (const base of [12, 14, 16, 18, 20]) {
      const s = typeScale(base, 1.25)
      expect(s.levels.find((n) => n.name === 'base')!.px).toBe(base)
    }
  })
})

describe('typeScale — progression', () => {
  it('applique le ratio entre deux niveaux consécutifs', () => {
    for (const ratio of RATIOS) {
      const s = typeScale(16, ratio)
      for (let i = 1; i < s.levels.length; i++) {
        expect(s.levels[i]!.px / s.levels[i - 1]!.px).toBeCloseTo(ratio, 2)
      }
    }
  })

  it('donne les valeurs attendues pour 16 px et un ratio de 1.25', () => {
    const s = typeScale(16, 1.25)
    const px = Object.fromEntries(s.levels.map((n) => [n.name, n.px]))
    expect(px.xs).toBe(10.24)
    expect(px.sm).toBe(12.8)
    expect(px.base).toBe(16)
    expect(px.lg).toBe(20)
    expect(px.xl).toBe(25)
    expect(px['2xl']).toBe(31.25)
    expect(px['3xl']).toBe(39.06)
  })

  it('est strictement croissante', () => {
    const s = typeScale(16, 1.2)
    for (let i = 1; i < s.levels.length; i++) {
      expect(s.levels[i]!.px).toBeGreaterThan(s.levels[i - 1]!.px)
    }
  })
})

describe('typeScale — rem', () => {
  it('exprime les rem par rapport à la racine du document, pas à la taille de base', () => {
    // C est la condition pour que le réglage de taille de texte du navigateur
    // continue d agir : 18 px de base sur une racine à 16 font 1.125rem.
    const s = typeScale(18, 1.25)
    expect(s.levels.find((n) => n.name === 'base')!.rem).toBeCloseTo(1.125, 4)
  })

  it('accepte une autre racine', () => {
    const s = typeScale(20, 1.25, 20)
    expect(s.levels.find((n) => n.name === 'base')!.rem).toBeCloseTo(1, 4)
  })
})

describe('interligneConseille', () => {
  it('se resserre quand la taille augmente', () => {
    const tailles = [10, 12, 16, 20, 25, 31, 39, 49, 61, 76]
    for (let i = 1; i < tailles.length; i++) {
      expect(interligneConseille(tailles[i]!)).toBeLessThanOrEqual(interligneConseille(tailles[i - 1]!))
    }
  })

  it('reste dans des valeurs lisibles', () => {
    for (let px = 6; px <= 200; px++) {
      const lh = interligneConseille(px)
      expect(lh).toBeGreaterThanOrEqual(1.05)
      expect(lh).toBeLessThanOrEqual(1.6)
    }
  })

  it('donne un interlignage généreux au texte courant', () => {
    expect(interligneConseille(16)).toBeCloseTo(1.55, 2)
  })

  it('donne un interlignage serré aux grands titres', () => {
    expect(interligneConseille(64)).toBeLessThan(1.15)
  })

  it('accorde le multiple et sa valeur en pixels', () => {
    for (const n of typeScale(16, 1.333).levels) {
      expect(n.lineHeightPx).toBeCloseTo(n.px * n.lineHeight, 2)
    }
  })
})

describe('typeScale — valeurs hors bornes', () => {
  it('ramène une base trop petite ou trop grande dans les bornes', () => {
    expect(typeScale(2, 1.25).base).toBe(BORNES.base.min)
    expect(typeScale(400, 1.25).base).toBe(BORNES.base.max)
  })

  it('ramène un ratio absurde dans les bornes', () => {
    expect(typeScale(16, 0).ratio).toBe(BORNES.ratio.min)
    expect(typeScale(16, -3).ratio).toBe(BORNES.ratio.min)
    expect(typeScale(16, 99).ratio).toBe(BORNES.ratio.max)
  })

  it('refuse ce qui n est pas un nombre fini', () => {
    expect(() => typeScale(NaN, 1.25)).toThrow()
    expect(() => typeScale(16, Infinity)).toThrow()
    expect(() => typeScale(16, 1.25, NaN)).toThrow()
  })
})
