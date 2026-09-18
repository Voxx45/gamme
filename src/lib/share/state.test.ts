import { describe, expect, it } from 'vitest'
import type { BrandConfig } from '../types'
import { CONFIG_DEFAUT, CONFIG_NORVA, decodeState, encodeState, shareUrl } from './state'

describe('encodeState / decodeState — aller-retour', () => {
  it('conserve la configuration NORVA à l identique', () => {
    const { config } = decodeState(encodeState(CONFIG_NORVA))
    expect(config.name).toBe('NØRVA')
    expect(config.colors).toEqual(CONFIG_NORVA.colors)
    expect(config.heading.family).toBe('Cormorant Garamond')
    expect(config.heading.weight).toBe(600)
    expect(config.body.family).toBe('Manrope')
    expect(config.body.weight).toBe(400)
    expect(config.baseSize).toBe(16)
    expect(config.ratio).toBe(1.25)
  })

  it('ne signale aucune correction sur une URL propre', () => {
    expect(decodeState(encodeState(CONFIG_NORVA)).issues).toEqual([])
    expect(decodeState(encodeState(CONFIG_DEFAUT)).issues).toEqual([])
  })

  it('est stable : ré-encoder ce qui a été décodé redonne la même chaîne', () => {
    for (const c of [CONFIG_NORVA, CONFIG_DEFAUT]) {
      const une = encodeState(c)
      expect(encodeState(decodeState(une).config)).toBe(une)
    }
  })

  it('survit aux caractères accentués et aux espaces', () => {
    const c: BrandConfig = {
      ...CONFIG_NORVA,
      name: 'Éditions Lumière & Cie',
    }
    expect(decodeState(encodeState(c)).config.name).toBe('Éditions Lumière & Cie')
  })

  it('porte le numéro de version', () => {
    expect(encodeState(CONFIG_NORVA)).toContain('v=1')
  })

  it('omet le nom quand il est vide', () => {
    expect(encodeState({ ...CONFIG_NORVA, name: '' })).not.toContain('n=')
  })
})

describe('decodeState — formes d entrée acceptées', () => {
  const attendu = encodeState(CONFIG_NORVA)

  it('accepte une chaîne de paramètres nue', () => {
    expect(encodeState(decodeState(attendu).config)).toBe(attendu)
  })

  it('accepte un fragment avec son dièse', () => {
    expect(encodeState(decodeState(`#${attendu}`).config)).toBe(attendu)
  })

  it('accepte une URL complète collée depuis la barre d adresse', () => {
    const url = `https://exemple.fr/outil/#${attendu}`
    expect(encodeState(decodeState(url).config)).toBe(attendu)
  })

  it('accepte une chaîne de requête', () => {
    expect(encodeState(decodeState(`?${attendu}`).config)).toBe(attendu)
  })
})

describe('decodeState — résistance aux valeurs invalides', () => {
  it('rend la configuration par défaut pour une entrée vide ou absurde', () => {
    for (const e of ['', '   ', '#', '???', 'n importe quoi']) {
      expect(decodeState(e).config.colors.length).toBeGreaterThan(0)
    }
  })

  it('ne lève jamais d exception, quoi qu on lui donne', () => {
    const entrees: unknown[] = [
      null,
      undefined,
      42,
      {},
      [],
      '#c=',
      '#c=,,,',
      '#c=%%%',
      '#s=abc&r=xyz&hw=nope',
      '#'.repeat(10000),
      '#n=' + 'a'.repeat(50000),
      '#%E0%A4%A',
      '#c=zzzzzz&h=<script>&b=../../etc/passwd',
    ]
    for (const e of entrees) {
      expect(() => decodeState(e), `entrée ${String(e).slice(0, 40)}`).not.toThrow()
      const r = decodeState(e)
      expect(r.config.colors.length).toBeGreaterThan(0)
      expect(r.config.baseSize).toBeGreaterThan(0)
      expect(r.config.ratio).toBeGreaterThan(1)
    }
  })

  it('écarte les couleurs illisibles et garde les bonnes', () => {
    const r = decodeState('#c=1b2a41,pasunecouleur,c9a227')
    expect(r.config.colors).toEqual(['#1b2a41', '#c9a227'])
    expect(r.issues.length).toBeGreaterThan(0)
  })

  it('retombe sur la palette par défaut si aucune couleur n est exploitable', () => {
    const r = decodeState('#c=zzz,yyy')
    expect(r.config.colors).toEqual(CONFIG_DEFAUT.colors)
    expect(r.issues.length).toBeGreaterThan(0)
  })

  it('déplie les hexadécimaux à 3 chiffres', () => {
    expect(decodeState('#c=f0a').config.colors).toEqual(['#ff00aa'])
  })

  it('ne garde que les quatre premières couleurs', () => {
    const r = decodeState('#c=111111,222222,333333,444444,555555,666666')
    expect(r.config.colors).toHaveLength(4)
    expect(r.issues.length).toBeGreaterThan(0)
  })

  it('ramène une taille de base hors bornes dans les bornes', () => {
    expect(decodeState('#s=999').config.baseSize).toBe(24)
    expect(decodeState('#s=1').config.baseSize).toBe(12)
    expect(decodeState('#s=-40').config.baseSize).toBe(12)
  })

  it('remplace une taille illisible par la valeur par défaut', () => {
    expect(decodeState('#s=grand').config.baseSize).toBe(CONFIG_DEFAUT.baseSize)
  })

  it('ramène un ratio hors bornes dans les bornes', () => {
    expect(decodeState('#r=50').config.ratio).toBe(2)
    expect(decodeState('#r=0').config.ratio).toBe(1.05)
  })

  it('cale une graisse sur le multiple de cent le plus proche', () => {
    expect(decodeState('#hw=750').config.heading.weight).toBe(800)
    expect(decodeState('#hw=99999').config.heading.weight).toBe(900)
    expect(decodeState('#hw=0').config.heading.weight).toBe(100)
    expect(decodeState('#hw=gras').config.heading.weight).toBe(CONFIG_DEFAUT.heading.weight)
  })

  it('tronque un nom de marque démesuré', () => {
    const r = decodeState('#n=' + encodeURIComponent('M'.repeat(200)))
    expect(r.config.name).toHaveLength(32)
    expect(r.issues.length).toBeGreaterThan(0)
  })

  it('retire les caractères de contrôle du nom', () => {
    const r = decodeState('#n=' + encodeURIComponent('NOR' + String.fromCharCode(0) + 'VA' + String.fromCharCode(27)))
    expect(r.config.name).toBe('NORVA')
  })

  it('signale une version de format inconnue sans refuser de lire', () => {
    const r = decodeState('#v=99&c=1b2a41')
    expect(r.config.colors).toEqual(['#1b2a41'])
    expect(r.issues.some((i) => i.includes('99'))).toBe(true)
  })

  it('ignore les clés inconnues, pour ne pas casser les liens futurs', () => {
    const r = decodeState('#v=1&c=1b2a41&inconnu=1&autre=xyz')
    expect(r.config.colors).toEqual(['#1b2a41'])
    expect(r.issues).toEqual([])
  })
})

describe('decodeState — barrière sur les polices', () => {
  it('refuse une famille contenant autre chose que lettres, chiffres et espaces', () => {
    for (const mauvais of ['<script>', 'Inter";x', 'a/b', 'Inter\nEvil', 'M'.repeat(80)]) {
      const r = decodeState(`#h=${encodeURIComponent(mauvais)}`)
      expect(r.config.heading.family).toBe(CONFIG_DEFAUT.heading.family)
      expect(r.issues.length).toBeGreaterThan(0)
    }
  })

  it('refuse une famille absente du catalogue quand on le lui fournit', () => {
    const catalogue = ['Manrope', 'Cormorant Garamond']
    const r = decodeState('#h=Comic Sans MS&b=Manrope', { knownFonts: catalogue })
    expect(r.config.heading.family).toBe(CONFIG_DEFAUT.heading.family)
    expect(r.config.body.family).toBe('Manrope')
  })

  it('accepte une famille du catalogue', () => {
    const r = decodeState(encodeState(CONFIG_NORVA), {
      knownFonts: ['Manrope', 'Cormorant Garamond'],
    })
    expect(r.config.heading.family).toBe('Cormorant Garamond')
    expect(r.issues).toEqual([])
  })
})

describe('shareUrl', () => {
  it('assemble une URL avec la configuration dans le fragment', () => {
    const url = shareUrl(CONFIG_NORVA, 'https://exemple.fr')
    expect(url.startsWith('https://exemple.fr/#v=1')).toBe(true)
    expect(encodeState(decodeState(url).config)).toBe(encodeState(CONFIG_NORVA))
  })

  it('remplace un fragment déjà présent au lieu de l empiler', () => {
    const url = shareUrl(CONFIG_NORVA, 'https://exemple.fr/#v=1&c=000000')
    expect(url.split('#')).toHaveLength(2)
  })

  it('ne double pas la barre oblique', () => {
    expect(shareUrl(CONFIG_NORVA, 'https://exemple.fr/')).toContain('exemple.fr/#')
  })
})
