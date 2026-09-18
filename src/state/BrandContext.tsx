import { useCallback, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react'
import { FAMILLES } from '../data/fonts'
import { chargerPolice } from '../hooks/useGoogleFont'
import { buildCharte, CONFIG_NORVA, decodeState, encodeState } from '../lib'
import type { BrandConfig } from '../lib/types'
import { ContexteCharte, type ValeurCharte } from './charte-context'
import { avecPolicesDuCatalogue, CONFIG_VIDE, reducteur } from './charte-reducer'

/** Lit la configuration portée par l'URL au premier rendu. */
function configInitiale(): BrandConfig {
  if (typeof window === 'undefined') return CONFIG_VIDE
  const fragment = window.location.hash.replace(/^#/, '')
  if (fragment.trim() === '') return CONFIG_VIDE
  return avecPolicesDuCatalogue(decodeState(fragment, { knownFonts: FAMILLES }).config)
}

export function FournisseurCharte({ children }: { children: ReactNode }) {
  const [config, envoyer] = useReducer(reducteur, undefined, configInitiale)
  const vide = config.colors.length === 0

  /**
   * L'URL est une sérialisation de l'état, jamais un second état.
   *
   * Écriture par `replaceState` : faire glisser un curseur ne doit pas empiler
   * cinquante entrées dans l'historique et rendre le bouton retour inutilisable.
   */
  const derniereEcrite = useRef('')
  useEffect(() => {
    if (vide) return
    const fragment = encodeState(config)
    const t = setTimeout(() => {
      derniereEcrite.current = fragment
      if (window.location.hash.replace(/^#/, '') !== fragment) {
        window.history.replaceState(null, '', `#${fragment}`)
      }
    }, 200)
    return () => clearTimeout(t)
  }, [config, vide])

  /** Le bouton retour du navigateur, et les liens collés dans la barre d'adresse. */
  useEffect(() => {
    function surChangement() {
      const fragment = window.location.hash.replace(/^#/, '')
      if (fragment === derniereEcrite.current) return
      derniereEcrite.current = fragment
      envoyer({
        type: 'remplacerConfig',
        config:
          fragment.trim() === ''
            ? CONFIG_VIDE
            : avecPolicesDuCatalogue(decodeState(fragment, { knownFonts: FAMILLES }).config),
      })
    }
    window.addEventListener('hashchange', surChangement)
    return () => window.removeEventListener('hashchange', surChangement)
  }, [])

  /** Les polices choisies sont chargées à la demande, jamais toutes d'avance. */
  useEffect(() => {
    chargerPolice(config.heading.family, [config.heading.weight, 400])
    chargerPolice(config.body.family, [config.body.weight, 400, 600])
  }, [config.heading.family, config.heading.weight, config.body.family, config.body.weight])

  const charte = useMemo(() => buildCharte(config), [config])

  const chargerExemple = useCallback(() => {
    envoyer({ type: 'remplacerConfig', config: { ...CONFIG_NORVA, colors: [...CONFIG_NORVA.colors] } })
  }, [])

  const reinitialiser = useCallback(() => {
    derniereEcrite.current = ''
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
    envoyer({ type: 'remplacerConfig', config: CONFIG_VIDE })
  }, [])

  const valeur = useMemo<ValeurCharte>(
    () => ({ config, charte, vide, envoyer, chargerExemple, reinitialiser }),
    [config, charte, vide, chargerExemple, reinitialiser],
  )

  return <ContexteCharte.Provider value={valeur}>{children}</ContexteCharte.Provider>
}
