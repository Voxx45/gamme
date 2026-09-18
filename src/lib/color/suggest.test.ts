import { describe, expect, it } from 'vitest'
import { contrastRatio, evaluatePair } from './contrast'
import { generateScale } from './scale'
import { suggestAccessible } from './suggest'

const BLANC = '#ffffff'

describe('suggestAccessible — corrige une paire qui échoue', () => {
  it('trouve une nuance de laiton lisible sur blanc', () => {
    const laiton = generateScale('#c9a227')
    // La couleur telle quelle échoue : c est le cas que l outil doit rattraper.
    expect(evaluatePair('#c9a227', BLANC).normal.aa).toBe(false)

    const s = suggestAccessible(laiton, laiton.anchor, BLANC)
    expect(s).not.toBeNull()
    expect(contrastRatio(s!.hex, BLANC)).toBeGreaterThanOrEqual(4.5)
  })

  it('propose toujours une nuance qui atteint réellement le seuil', () => {
    for (const couleur of ['#c9a227', '#7c9eb2', '#2563eb', '#ff0000', '#10b981']) {
      const echelle = generateScale(couleur)
      for (const depuis of echelle.swatches.map((w) => w.step)) {
        const s = suggestAccessible(echelle, depuis, BLANC)
        if (s) expect(contrastRatio(s.hex, BLANC)).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  it('ne propose jamais le palier dont on part', () => {
    const echelle = generateScale('#7c9eb2')
    for (const depuis of echelle.swatches.map((w) => w.step)) {
      expect(suggestAccessible(echelle, depuis, BLANC)?.step).not.toBe(depuis)
    }
  })

  it('choisit la nuance la plus proche, et pas seulement une nuance qui passe', () => {
    const echelle = generateScale('#c9a227')
    const s = suggestAccessible(echelle, echelle.anchor, BLANC)
    expect(s).not.toBeNull()

    const iDepuis = echelle.swatches.findIndex((w) => w.step === echelle.anchor)
    const iPropose = echelle.swatches.findIndex((w) => w.step === s!.step)

    // Aucun palier strictement plus proche ne doit passer le seuil.
    for (let i = 0; i < echelle.swatches.length; i++) {
      if (i === iDepuis) continue
      if (Math.abs(i - iDepuis) < Math.abs(iPropose - iDepuis)) {
        expect(contrastRatio(echelle.swatches[i]!.hex, BLANC)).toBeLessThan(4.5)
      }
    }
  })

  it('renseigne un écart en paliers, signé', () => {
    const echelle = generateScale('#c9a227')
    const s = suggestAccessible(echelle, echelle.anchor, BLANC)
    expect(s!.depuis).toBe(echelle.anchor)
    // Sur fond blanc, la correction va vers le foncé.
    expect(s!.ecart).toBeGreaterThan(0)
  })
})

describe('suggestAccessible — niveaux et tailles', () => {
  it('le grand texte est plus facile à satisfaire que le texte courant', () => {
    const echelle = generateScale('#7c9eb2')
    const normal = suggestAccessible(echelle, echelle.anchor, BLANC, { taille: 'normal' })
    const grand = suggestAccessible(echelle, echelle.anchor, BLANC, { taille: 'grand' })
    expect(normal).not.toBeNull()
    expect(grand).not.toBeNull()
    expect(Math.abs(grand!.ecart)).toBeLessThanOrEqual(Math.abs(normal!.ecart))
  })

  it('AAA exige une correction au moins aussi forte que AA', () => {
    const echelle = generateScale('#7c9eb2')
    const aa = suggestAccessible(echelle, echelle.anchor, BLANC, { niveau: 'AA' })
    const aaa = suggestAccessible(echelle, echelle.anchor, BLANC, { niveau: 'AAA' })
    if (aa && aaa) expect(Math.abs(aaa.ecart)).toBeGreaterThanOrEqual(Math.abs(aa.ecart))
  })
})

describe('suggestAccessible — quand il n y a rien à proposer', () => {
  it('renvoie null plutôt qu un pis-aller quand aucune nuance ne passe', () => {
    // Sur un gris moyen, le meilleur contraste atteignable est 5.32:1 avec du
    // noir : AAA en texte courant est hors d atteinte, quelle que soit la nuance.
    const echelle = generateScale('#2563eb')
    for (const depuis of echelle.swatches.map((w) => w.step)) {
      expect(suggestAccessible(echelle, depuis, '#808080', { niveau: 'AAA' })).toBeNull()
    }
  })

  it('renvoie null si le palier de départ n existe pas', () => {
    expect(suggestAccessible(generateScale('#c9a227'), 42, BLANC)).toBeNull()
  })
})
