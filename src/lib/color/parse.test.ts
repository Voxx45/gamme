import { describe, expect, it } from 'vitest'
import { parseColor } from './parse'

/** Raccourci : extrait la valeur ou fait échouer le test avec le message d'erreur. */
function ok(saisie: string) {
  const r = parseColor(saisie)
  if (!r.ok) throw new Error(`parseColor(${saisie}) a échoué : ${r.error}`)
  return r.value
}

describe('parseColor — syntaxes acceptées', () => {
  it('lit un hexadécimal à 6 chiffres', () => {
    expect(ok('#1b2a41').hex).toBe('#1b2a41')
    expect(ok('#1b2a41').format).toBe('hex')
  })

  it('lit un hexadécimal sans dièse', () => {
    expect(ok('1b2a41').hex).toBe('#1b2a41')
  })

  it('normalise la casse', () => {
    expect(ok('#1B2A41').hex).toBe('#1b2a41')
  })

  it('déplie un hexadécimal à 3 chiffres', () => {
    expect(ok('#f0a').hex).toBe('#ff00aa')
    expect(ok('fff').hex).toBe('#ffffff')
  })

  it('lit rgb() dans les deux syntaxes', () => {
    expect(ok('rgb(27, 42, 65)').hex).toBe('#1b2a41')
    expect(ok('rgb(27 42 65)').hex).toBe('#1b2a41')
    expect(ok('rgb(27 42 65)').format).toBe('rgb')
  })

  it('lit hsl()', () => {
    const r = ok('hsl(0 100% 50%)')
    expect(r.hex).toBe('#ff0000')
    expect(r.format).toBe('hsl')
  })

  it('lit oklch()', () => {
    const r = ok('oklch(62.8% 0.2577 29.23)')
    expect(r.format).toBe('oklch')
    expect(r.hex).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('ignore les espaces autour de la saisie', () => {
    expect(ok('  #1b2a41  ').hex).toBe('#1b2a41')
  })
})

describe('parseColor — cohérence de la sortie', () => {
  it('produit toujours un hexadécimal à 6 chiffres en minuscules', () => {
    for (const c of ['#f0a', 'rgb(1 2 3)', 'hsl(210 50% 40%)', 'oklch(50% 0.1 200)']) {
      expect(ok(c).hex).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  it('renvoie un OKLCH qui décrit exactement la couleur hexadécimale produite', () => {
    // hex et oklch doivent parler de la même couleur, sinon l'export ment.
    for (const c of ['#1b2a41', '#c9a227', '#7c9eb2', '#f4f1ea', '#ffffff', '#000000']) {
      const { hex, oklch } = ok(c)
      const relu = ok(hex)
      expect(relu.oklch.l).toBeCloseTo(oklch.l, 6)
      expect(relu.oklch.c).toBeCloseTo(oklch.c, 6)
    }
  })

  it('donne une teinte de 0 aux couleurs grises plutôt que NaN', () => {
    for (const gris of ['#000000', '#808080', '#ffffff']) {
      const { oklch } = ok(gris)
      expect(Number.isFinite(oklch.h)).toBe(true)
      expect(oklch.c).toBeCloseTo(0, 3)
    }
  })

  it('signale et corrige une couleur hors du gamut sRGB', () => {
    const r = ok('oklch(90% 0.4 150)')
    expect(r.clamped).toBe(true)
    expect(r.hex).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('ne signale pas de correction pour une couleur déjà dans le gamut', () => {
    expect(ok('#1b2a41').clamped).toBe(false)
  })
})

describe('parseColor — refus', () => {
  const refus = [
    '',
    '   ',
    'bleu',
    'red',
    '#12345',
    '#gggggg',
    'lab(50% 20 -30)',
    'color(display-p3 1 0 0)',
    '{{ injection }}',
    'javascript:alert(1)',
  ]

  for (const saisie of refus) {
    it(`refuse ${JSON.stringify(saisie)}`, () => {
      const r = parseColor(saisie)
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.error.length).toBeGreaterThan(0)
    })
  }

  it('refuse la transparence, et le dit', () => {
    for (const saisie of ['#11223344', 'rgb(0 0 0 / 50%)', 'rgba(0, 0, 0, 0.5)']) {
      const r = parseColor(saisie)
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.error).toMatch(/transparen/i)
    }
  })

  it('ne lève jamais d exception, quoi qu on lui donne', () => {
    const entrees: unknown[] = [null, undefined, 42, {}, [], '#'.repeat(5000)]
    for (const e of entrees) {
      expect(() => parseColor(e as string)).not.toThrow()
    }
  })
})
