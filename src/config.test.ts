import { describe, expect, it } from 'vitest'
import { DEPOT, EMAIL, LINKEDIN, SITE, URL_PUBLIQUE } from './config'

/*
 * Ces constantes partent directement dans des attributs `href`. Une adresse
 * sans schéma — « www.linkedin.com/in/… » — n'est pas une erreur pour le
 * navigateur : c'est un chemin *relatif*. Il la résout contre la page courante
 * et sert l'application elle-même, sans rien signaler. Le lien a l'air correct
 * dans le code, il ne va nulle part.
 */
describe('les adresses du projet', () => {
  const liens = { URL_PUBLIQUE, SITE, DEPOT, LINKEDIN }

  for (const [nom, valeur] of Object.entries(liens)) {
    it(`${nom} est une adresse absolue en https`, () => {
      // Une chaîne vide est permise : elle masque la ligne au lieu de la casser.
      if (valeur === '') return
      expect(() => new URL(valeur)).not.toThrow()
      expect(new URL(valeur).protocol).toBe('https:')
    })
  }

  it('aucune adresse ne se termine par une barre oblique superflue', () => {
    for (const [nom, valeur] of Object.entries(liens)) {
      expect(valeur.endsWith('/'), nom).toBe(false)
    }
  })

  it('EMAIL est une adresse plausible', () => {
    expect(EMAIL).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  })
})
