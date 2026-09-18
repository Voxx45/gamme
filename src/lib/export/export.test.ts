import { describe, expect, it } from 'vitest'
import { buildCharte, slugify } from '../charte'
import { CONFIG_NORVA } from '../share/state'
import { toCss } from './css'
import { toDtcg, toDtcgObject } from './dtcg'
import { toTailwind } from './tailwind'

const charte = buildCharte(CONFIG_NORVA)

describe('buildCharte', () => {
  it('produit une échelle par couleur', () => {
    expect(charte.colors).toHaveLength(4)
    expect(charte.colors.map((c) => c.slug)).toEqual(['primary', 'secondary', 'accent', 'neutral'])
  })

  it('donne à chaque échelle ses onze paliers', () => {
    for (const { scale } of charte.colors) {
      expect(scale.swatches).toHaveLength(11)
    }
  })

  it('désambiguïse deux couleurs qui porteraient le même nom', () => {
    const c = buildCharte({ ...CONFIG_NORVA, colors: ['#111111', '#222222'] }, ['encre', 'encre'])
    expect(c.colors.map((x) => x.slug)).toEqual(['encre', 'encre-2'])
  })

  it('écarte une couleur illisible sans emporter toute la charte', () => {
    const c = buildCharte({ ...CONFIG_NORVA, colors: ['#1b2a41', 'pas une couleur'] })
    expect(c.colors).toHaveLength(1)
  })
})

describe('slugify', () => {
  it('réduit une chaîne à un identifiant sûr', () => {
    expect(slugify('Bleu Nuit')).toBe('bleu-nuit')
    expect(slugify('Éclat doré')).toBe('eclat-dore')
    expect(slugify('  --Accent!!  ')).toBe('accent')
  })

  it('ne rend jamais une chaîne vide', () => {
    expect(slugify('!!!')).toBe('color')
    expect(slugify('')).toBe('color')
  })
})

describe('toCss', () => {
  const css = toCss(charte)

  it('déclare les couleurs dans :root', () => {
    expect(css).toContain(':root {')
    expect(css.trim().endsWith('}')).toBe(true)
  })

  it('expose les onze paliers de chaque couleur', () => {
    for (const { slug } of charte.colors) {
      for (const step of [50, 100, 500, 900, 950]) {
        expect(css).toContain(`--color-${slug}-${step}:`)
      }
    }
  })

  it('restitue la couleur saisie telle quelle dans l export', () => {
    for (const hex of CONFIG_NORVA.colors) {
      expect(css).toContain(hex)
    }
  })

  it('emploie l hexadécimal, format passe-partout', () => {
    expect(css).toMatch(/--color-primary-500: #[0-9a-f]{6};/)
  })

  it('déclare les polices avec leur pile de repli', () => {
    expect(css).toContain('--font-heading: "Cormorant Garamond", serif;')
    expect(css).toContain('--font-body: Manrope, sans-serif;')
    expect(css).toContain('--font-weight-heading: 600;')
  })

  it('déclare l échelle typographique et son interlignage', () => {
    expect(css).toContain('--text-base: 1rem;')
    expect(css).toContain('--leading-base: 1.55;')
  })

  it('reste valide sans nom de marque', () => {
    expect(toCss(buildCharte({ ...CONFIG_NORVA, name: '' }))).toContain(':root {')
  })
})

describe('toTailwind', () => {
  const tw = toTailwind(charte)

  it('produit un bloc @theme importable tel quel', () => {
    expect(tw).toContain('@import "tailwindcss";')
    expect(tw).toContain('@theme {')
  })

  it('emploie oklch(), comme la palette native de Tailwind v4', () => {
    expect(tw).toMatch(/--color-primary-500: oklch\([\d.]+% [\d.]+ [\d.]+\);/)
  })

  it('rappelle l hexadécimal en commentaire, pour rester lisible', () => {
    expect(tw).toMatch(/oklch\([^)]+\); \/\* #[0-9a-f]{6} \*\//)
  })

  it('emploie la syntaxe v4 pour l interlignage', () => {
    expect(tw).toContain('--text-base: 1rem;')
    expect(tw).toContain('--text-base--line-height: 1.55;')
  })

  it('déclare un niveau de texte par niveau de l échelle', () => {
    for (const n of charte.type.levels) {
      expect(tw).toContain(`--text-${n.name}:`)
      expect(tw).toContain(`--text-${n.name}--line-height:`)
    }
  })
})

describe('toDtcg', () => {
  const json = toDtcg(charte)
  const obj = toDtcgObject(charte)

  it('produit un JSON valide', () => {
    expect(() => JSON.parse(json)).not.toThrow()
    expect(JSON.parse(json)).toEqual(obj)
  })

  it('déclare le type sur les groupes, comme le veut le format', () => {
    expect(obj.color).toMatchObject({ $type: 'color' })
    expect(obj.fontFamily).toMatchObject({ $type: 'fontFamily' })
    expect(obj.fontWeight).toMatchObject({ $type: 'fontWeight' })
    expect(obj.fontSize).toMatchObject({ $type: 'dimension' })
    expect(obj.typography).toMatchObject({ $type: 'typography' })
  })

  it('range chaque palier sous sa couleur', () => {
    const lu = JSON.parse(json)
    for (const { slug, scale } of charte.colors) {
      for (const s of scale.swatches) {
        expect(lu.color[slug][String(s.step)].$value).toBe(s.hex)
      }
    }
  })

  it('référence les autres tokens par alias plutôt que de recopier les valeurs', () => {
    const lu = JSON.parse(json)
    expect(lu.typography.body.$value).toEqual({
      fontFamily: '{fontFamily.body}',
      fontSize: '{fontSize.base}',
      fontWeight: '{fontWeight.body}',
      lineHeight: '{lineHeight.base}',
    })
  })

  it('donne la famille avec sa pile de repli', () => {
    const lu = JSON.parse(json)
    expect(lu.fontFamily.heading.$value).toEqual(['Cormorant Garamond', 'serif'])
    expect(lu.fontFamily.body.$value).toEqual(['Manrope', 'sans-serif'])
  })

  it('exprime les tailles en rem', () => {
    const lu = JSON.parse(json)
    expect(lu.fontSize.base.$value).toBe('1rem')
    expect(lu.lineHeight.base.$value).toBe(1.55)
  })
})
