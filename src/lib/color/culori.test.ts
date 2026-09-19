import { describe, expect, it } from 'vitest'
import { converter, parse } from './culori'

/**
 * Garde-fou sur les espaces colorimétriques enregistrés.
 *
 * `culori/fn` n'embarque que ce qu'on lui demande. Un espace oublié ne casse
 * rien à la compilation : la conversion renvoie simplement `undefined`, et le
 * défaut ne se voit qu'à l'usage. C'est arrivé avec `hsl`, dont l'oubli a rendu
 * toute une syntaxe de saisie inutilisable tout en laissant le build vert.
 */
describe('espaces colorimétriques enregistrés', () => {
  const REQUIS: [string, string][] = [
    ['rgb', '#1b2a41'],
    ['rgb', 'rgb(27 42 65)'],
    ['hsl', 'hsl(210 50% 40%)'],
    ['hsl', 'hsl(0, 100%, 50%)'],
    ['oklch', 'oklch(50% 0.1 200)'],
    ['oklab', 'oklab(0.5 0.1 -0.1)'],
  ]

  for (const [espace, valeur] of REQUIS) {
    it(`sait lire ${valeur} (${espace})`, () => {
      expect(parse(valeur), `${valeur} n'est pas reconnu`).toBeDefined()
    })
  }

  it('sait convertir vers les espaces dont l outil se sert', () => {
    for (const espace of ['rgb', 'oklch', 'oklab'] as const) {
      expect(converter(espace)('#1b2a41'), espace).toBeDefined()
    }
  })
})
