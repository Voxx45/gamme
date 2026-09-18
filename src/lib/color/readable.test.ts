import { describe, expect, it } from 'vitest'
import { contrastRatio } from './contrast'
import { generateScale } from './scale'
import { encreLisible } from './readable'

/** Le pire cas théorique : la clarté où noir et blanc se valent. */
const PIRE_CAS = 4.58

describe('encreLisible', () => {
  it('garantit AA sur n importe quelle couleur sRGB', () => {
    // Balayage du cube sRGB par pas de 17, soit 4 096 couleurs.
    let minimum = Infinity
    let pire = ''
    for (let r = 0; r < 256; r += 17) {
      for (let v = 0; v < 256; v += 17) {
        for (let b = 0; b < 256; b += 17) {
          const hex = `#${[r, v, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`
          const ratio = contrastRatio(encreLisible(hex), hex)
          if (ratio < minimum) {
            minimum = ratio
            pire = hex
          }
        }
      }
    }
    expect(minimum, `pire couleur : ${pire}`).toBeGreaterThanOrEqual(4.5)
    expect(minimum).toBeLessThan(PIRE_CAS + 0.01)
  })

  it('garantit AA sur toutes les nuances produites par l outil', () => {
    for (const couleur of ['#1b2a41', '#c9a227', '#7c9eb2', '#f4f1ea', '#3d8155', '#2563eb', '#ff0000']) {
      for (const s of generateScale(couleur).swatches) {
        expect(contrastRatio(encreLisible(s.hex), s.hex), `${couleur} palier ${s.step}`).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  it('met du blanc sur le foncé et du noir sur le clair', () => {
    expect(encreLisible('#000000')).toBe('#ffffff')
    expect(encreLisible('#1b2a41')).toBe('#ffffff')
    expect(encreLisible('#ffffff')).toBe('#000000')
    expect(encreLisible('#f4f1ea')).toBe('#000000')
  })

  it('ne renvoie jamais autre chose que du noir ou du blanc pur', () => {
    for (const c of ['#3d8155', '#808080', '#c9a227']) {
      expect(['#000000', '#ffffff']).toContain(encreLisible(c))
    }
  })
})
