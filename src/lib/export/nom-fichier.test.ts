import { describe, expect, it } from 'vitest'
import { baseNomFichier } from './nom-fichier'

describe('baseNomFichier', () => {
  it('réduit un nom courant à un fragment sûr', () => {
    expect(baseNomFichier('Atelier Rivage')).toBe('atelier-rivage')
    expect(baseNomFichier('  Studio 21  ')).toBe('studio-21')
  })

  it('translittère les lettres accentuées', () => {
    expect(baseNomFichier('Éditions Lumière')).toBe('editions-lumiere')
    expect(baseNomFichier('Çà et Là')).toBe('ca-et-la')
  })

  it('translittère les lettres que NFD ne décompose pas', () => {
    // Ø, Æ, ß ou Ð ne sont pas des lettres accentuées mais des lettres à part
    // entière : la décomposition Unicode les laisse intactes.
    expect(baseNomFichier('NØRVA')).toBe('norva')
    expect(baseNomFichier('Ærø')).toBe('aero')
    expect(baseNomFichier('Straße')).toBe('strasse')
    expect(baseNomFichier('Łódź')).toBe('lodz')
  })

  it('ne laisse jamais de tiret en tête ni en queue', () => {
    for (const nom of ['— Studio —', '!!!Marque!!!', '///a///']) {
      const base = baseNomFichier(nom)
      expect(base.startsWith('-')).toBe(false)
      expect(base.endsWith('-')).toBe(false)
    }
  })

  it('retombe sur un nom générique quand il ne reste rien', () => {
    expect(baseNomFichier('')).toBe('charte')
    expect(baseNomFichier('   ')).toBe('charte')
    expect(baseNomFichier('!!!')).toBe('charte')
  })

  it('ne produit que des caractères sûrs pour un système de fichiers', () => {
    for (const nom of ['a/b', 'C:' + String.fromCharCode(92) + 'chemin', 'nom "avec" guillemets', '../../etc', 'a*b?c']) {
      expect(baseNomFichier(nom)).toMatch(/^[a-z0-9-]+$/)
    }
  })
})
