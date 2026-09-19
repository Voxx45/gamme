import { describe, expect, it } from 'vitest'
import { CONFIG_NORVA } from '../lib'
import { ETAT_INITIAL, reducteur, type Action, type EtatCharte } from './charte-reducer'

function jouer(actions: Action[], depart: EtatCharte = ETAT_INITIAL): EtatCharte {
  return actions.reduce(reducteur, depart)
}

const AVEC_COULEURS: EtatCharte = {
  ...ETAT_INITIAL,
  config: { ...CONFIG_NORVA, colors: [...CONFIG_NORVA.colors] },
}

describe('reducteur — historique', () => {
  it('ne propose rien à annuler au départ', () => {
    expect(ETAT_INITIAL.passe).toHaveLength(0)
    expect(ETAT_INITIAL.futur).toHaveLength(0)
    expect(reducteur(ETAT_INITIAL, { type: 'annuler' })).toBe(ETAT_INITIAL)
  })

  it('annule une modification de couleur', () => {
    const apres = jouer([{ type: 'modifierCouleur', index: 0, hex: '#2f6b45' }], AVEC_COULEURS)
    expect(apres.config.colors[0]).toBe('#2f6b45')
    const annule = reducteur(apres, { type: 'annuler' })
    expect(annule.config.colors[0]).toBe(CONFIG_NORVA.colors[0])
  })

  it('rétablit ce qui vient d être annulé', () => {
    const etat = jouer(
      [{ type: 'modifierCouleur', index: 0, hex: '#2f6b45' }, { type: 'annuler' }, { type: 'retablir' }],
      AVEC_COULEURS,
    )
    expect(etat.config.colors[0]).toBe('#2f6b45')
  })

  it('remonte plusieurs pas d affilée', () => {
    const etat = jouer(
      [
        { type: 'modifierCouleur', index: 0, hex: '#111111' },
        { type: 'modifierCouleur', index: 1, hex: '#222222' },
        { type: 'definirNom', nom: 'Essai' },
        { type: 'annuler' },
        { type: 'annuler' },
        { type: 'annuler' },
      ],
      AVEC_COULEURS,
    )
    expect(etat.config.colors).toEqual(CONFIG_NORVA.colors)
    expect(etat.config.name).toBe(CONFIG_NORVA.name)
  })

  it('n empile rien quand l action ne change rien', () => {
    // Retaper la même couleur ne doit pas coûter une annulation.
    const etat = jouer(
      [
        { type: 'modifierCouleur', index: 0, hex: CONFIG_NORVA.colors[0]! },
        { type: 'definirRatio', ratio: CONFIG_NORVA.ratio },
      ],
      AVEC_COULEURS,
    )
    expect(etat.passe).toHaveLength(0)
    expect(etat).toBe(AVEC_COULEURS)
  })

  it('une action neuve coupe la branche de rétablissement', () => {
    const etat = jouer(
      [
        { type: 'definirNom', nom: 'A' },
        { type: 'annuler' },
        { type: 'definirNom', nom: 'B' },
      ],
      AVEC_COULEURS,
    )
    expect(etat.config.name).toBe('B')
    expect(etat.futur).toHaveLength(0)
  })

  it('borne l historique à vingt pas', () => {
    const actions: Action[] = Array.from({ length: 40 }, (_, i) => ({
      type: 'definirNom' as const,
      nom: `Essai ${i}`,
    }))
    const etat = jouer(actions, AVEC_COULEURS)
    expect(etat.passe.length).toBeLessThanOrEqual(20)
  })

  it('ne perd jamais la configuration courante en annulant trop', () => {
    const actions: Action[] = [
      { type: 'definirNom', nom: 'A' },
      ...Array.from({ length: 10 }, () => ({ type: 'annuler' as const })),
    ]
    const etat = jouer(actions, AVEC_COULEURS)
    expect(etat.config.colors).toEqual(CONFIG_NORVA.colors)
  })
})
