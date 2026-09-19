import { describe, expect, it } from 'vitest'
import { SCALE_STEPS } from '../types'
import { parseColor } from './parse'
import { generateScale, swatchAt } from './scale'

const ECHANTILLONS = [
  '#1b2a41', // encre, très foncée
  '#c9a227', // laiton, moyenne
  '#7c9eb2', // givre, claire
  '#f4f1ea', // os, quasi blanche
  '#2563eb', // bleu vif
  '#ff0000', // rouge saturé
  '#808080', // gris pur, chroma nul
  '#000000', // noir
  '#ffffff', // blanc
]

describe('generateScale — forme de l échelle', () => {
  it('produit les onze paliers, dans l ordre', () => {
    const s = generateScale('#2563eb')
    expect(s.swatches).toHaveLength(11)
    expect(s.swatches.map((w) => w.step)).toEqual([...SCALE_STEPS])
  })

  it('produit des hexadécimaux valides à chaque palier', () => {
    for (const c of ECHANTILLONS) {
      for (const w of generateScale(c).swatches) {
        expect(w.hex).toMatch(/^#[0-9a-f]{6}$/)
      }
    }
  })

  it('produit une notation oklch() lisible', () => {
    const s = generateScale('#2563eb')
    for (const w of s.swatches) {
      expect(w.css).toMatch(/^oklch\([\d.]+% [\d.]+ [\d.]+\)$/)
    }
  })
})

describe('generateScale — la couleur saisie est restituée telle quelle', () => {
  it('place la couleur d origine sur un palier, sans la modifier', () => {
    for (const c of ECHANTILLONS) {
      const s = generateScale(c)
      const ancre = swatchAt(s, s.anchor)
      expect(ancre, `palier d ancrage introuvable pour ${c}`).toBeDefined()
      expect(ancre!.hex, `${c} altéré à l ancrage`).toBe(c)
      expect(ancre!.isSource).toBe(true)
    }
  })

  it('marque un seul palier comme source', () => {
    for (const c of ECHANTILLONS) {
      expect(generateScale(c).swatches.filter((w) => w.isSource)).toHaveLength(1)
    }
  })

  it('ancre une couleur très claire vers le haut de l échelle', () => {
    expect(generateScale('#f4f1ea').anchor).toBeLessThanOrEqual(100)
  })

  it('ancre une couleur très foncée vers le bas de l échelle', () => {
    expect(generateScale('#1b2a41').anchor).toBeGreaterThanOrEqual(900)
  })
})

describe('generateScale — aucune nuance ne sort du gamut sRGB', () => {
  it('produit des couleurs toutes représentables, donc stables par aller-retour', () => {
    for (const c of ECHANTILLONS) {
      for (const w of generateScale(c).swatches) {
        const relu = parseColor(w.hex)
        expect(relu.ok).toBe(true)
        if (relu.ok) {
          // Hors gamut, l aller-retour hex -> oklch -> hex ne serait pas stable.
          expect(relu.value.hex).toBe(w.hex)
          expect(relu.value.clamped).toBe(false)
        }
      }
    }
  })

  it('ramène dans le gamut une couleur saisie en dehors', () => {
    const s = generateScale('oklch(75% 0.38 145)')
    for (const w of s.swatches) {
      expect(w.hex).toMatch(/^#[0-9a-f]{6}$/)
    }
  })
})

describe('generateScale — progression', () => {
  it('va du plus clair au plus foncé, sans inversion', () => {
    for (const c of ECHANTILLONS) {
      const clartes = generateScale(c).swatches.map((w) => w.oklch.l)
      for (let i = 1; i < clartes.length; i++) {
        expect(clartes[i]!, `inversion au palier ${SCALE_STEPS[i]} pour ${c}`).toBeLessThanOrEqual(
          clartes[i - 1]!,
        )
      }
    }
  })

  it('conserve la teinte partout où le chroma la rend significative', () => {
    // La teinte est mal conditionnée près de l axe achromatique : à chroma 0.02,
    // un pas de quantification 8 bits la déplace de 25 degrés, à chroma 0.15 de
    // 0.1 degré. Le test ne porte donc que sur les paliers réellement colorés —
    // sur les autres, la teinte ne veut rien dire, ni pour l oeil ni pour le calcul.
    for (const couleur of ['#2563eb', '#c9a227', '#ff0000', '#10b981']) {
      const s = generateScale(couleur)
      const teinteSource = s.source.oklch.h
      for (const w of s.swatches.filter((w) => w.oklch.c >= 0.1)) {
        const ecart = Math.abs(((w.oklch.h - teinteSource + 540) % 360) - 180)
        expect(ecart, `${couleur} palier ${w.step}`).toBeLessThan(5)
      }
    }
  })

  it('restitue exactement la teinte au palier d ancrage', () => {
    for (const couleur of ['#2563eb', '#c9a227', '#7c9eb2', '#10b981']) {
      const s = generateScale(couleur)
      const ancre = s.swatches.find((w) => w.isSource)!
      const ecart = Math.abs(((ancre.oklch.h - s.source.oklch.h + 540) % 360) - 180)
      expect(ecart, couleur).toBeLessThan(0.5)
    }
  })

  it('garde une échelle grise pour une couleur grise', () => {
    for (const w of generateScale('#808080').swatches) {
      expect(w.oklch.c).toBeLessThan(0.01)
    }
  })

  it('module le chroma en cloche : le milieu est plus vif que les extrémités', () => {
    const s = generateScale('#2563eb')
    const c = s.swatches.map((w) => w.oklch.c)
    expect(c[5]!).toBeGreaterThan(c[0]!)
    expect(c[5]!).toBeGreaterThan(c[10]!)
  })
})

describe('generateScale — cas limites', () => {
  it('accepte une couleur déjà analysée', () => {
    const r = parseColor('#c9a227')
    if (!r.ok) throw new Error(r.error)
    expect(generateScale(r.value).source.hex).toBe('#c9a227')
  })

  it('rejette une couleur illisible plutôt que d inventer une échelle', () => {
    expect(() => generateScale('pas une couleur')).toThrow()
  })
})

describe('generateScale — le plafond de chroma', () => {
  it('ne laisse aucun palier dépasser 1,6 fois le chroma de la couleur saisie', () => {
    // Sans plafond, une couleur ancrée à une extrémité voyait le milieu de son
    // échelle amplifié jusqu'à cinq fois : la rampe changeait de couleur.
    for (const couleur of ECHANTILLONS) {
      const s = generateScale(couleur)
      const source = s.source.oklch.c
      if (source < 0.01) continue // une couleur grise n'a rien à amplifier
      for (const w of s.swatches) {
        expect(w.oklch.c / source, `${couleur} palier ${w.step}`).toBeLessThanOrEqual(1.65)
      }
    }
  })

  it('garde une amplification utile : le milieu reste plus vif que la source foncée', () => {
    // Le plafond ne doit pas aplatir l'échelle au point de la rendre inutile.
    const s = generateScale('#1b2a41')
    const source = s.source.oklch.c
    const milieu = s.swatches.find((w) => w.step === 500)!
    expect(milieu.oklch.c).toBeGreaterThan(source)
  })
})
