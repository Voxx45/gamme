import { useCallback, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react'
import { FAMILLES } from '../data/fonts'
import { chargerPolice } from '../hooks/useGoogleFont'
import { buildCharte, CONFIG_NORVA, decodeState, encodeState } from '../lib'
import type { BrandConfig } from '../lib/types'
import { ContexteCharte, type ValeurCharte } from './charte-context'
import { avecPolicesDuCatalogue, CONFIG_VIDE, ETAT_INITIAL, reducteur, type EtatCharte } from './charte-reducer'

/** Lit la configuration portée par l'URL au premier rendu. */
function configInitiale(): BrandConfig {
  if (typeof window === 'undefined') return CONFIG_VIDE
  const fragment = window.location.hash.replace(/^#/, '')
  if (fragment.trim() === '') return CONFIG_VIDE
  return avecPolicesDuCatalogue(decodeState(fragment, { knownFonts: FAMILLES }).config)
}

function etatInitial(): EtatCharte {
  return { ...ETAT_INITIAL, config: configInitiale() }
}

export function FournisseurCharte({ children }: { children: ReactNode }) {
  const [etat, envoyer] = useReducer(reducteur, undefined, etatInitial)
  const { config } = etat
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

  const annuler = useCallback(() => envoyer({ type: 'annuler' }), [])
  const retablir = useCallback(() => envoyer({ type: 'retablir' }), [])

  /*
   * Ctrl+Z et Ctrl+Maj+Z, comme partout ailleurs. On laisse passer les frappes
   * qui visent un champ de saisie : dans un champ de texte, Ctrl+Z doit annuler
   * la frappe, pas la charte.
   */
  useEffect(() => {
    function surTouche(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z') return
      const cible = e.target as HTMLElement | null
      const balise = cible?.tagName
      if (balise === 'INPUT' || balise === 'TEXTAREA' || cible?.isContentEditable) return
      e.preventDefault()
      envoyer({ type: e.shiftKey ? 'retablir' : 'annuler' })
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [])

  const reinitialiser = useCallback(() => {
    derniereEcrite.current = ''
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
    envoyer({ type: 'remplacerConfig', config: CONFIG_VIDE })
  }, [])

  const valeur = useMemo<ValeurCharte>(
    () => ({
      config,
      charte,
      vide,
      envoyer,
      chargerExemple,
      reinitialiser,
      peutAnnuler: etat.passe.length > 0,
      peutRetablir: etat.futur.length > 0,
      annuler,
      retablir,
    }),
    [config, charte, vide, chargerExemple, reinitialiser, etat.passe.length, etat.futur.length, annuler, retablir],
  )

  return <ContexteCharte.Provider value={valeur}>{children}</ContexteCharte.Provider>
}
