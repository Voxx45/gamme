import { useId } from 'react'
import { DEFICIENCES } from '../../lib'
import type { Deficience } from '../../lib'
import { usePreferences, type Theme } from '../../state/preferences'
import { classes } from '../ui/classes'

const THEMES: { cle: Theme; nom: string; icone: string }[] = [
  { cle: 'clair', nom: 'Clair', icone: 'M8 1.5v1.6M8 12.9v1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M1.5 8h1.6M12.9 8h1.6M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1' },
  { cle: 'sombre', nom: 'Sombre', icone: 'M13 9.6A5.6 5.6 0 0 1 6.4 3a5.7 5.7 0 1 0 6.6 6.6Z' },
  { cle: 'systeme', nom: 'Système', icone: 'M2.5 3.5h11v7h-11zM6 13h4M8 10.5V13' },
]

/** Choix du thème, en groupe de boutons radio. */
export function ChoixTheme() {
  const { theme, definirTheme } = usePreferences()
  const idGroupe = useId()

  return (
    <div
      role="radiogroup"
      aria-labelledby={idGroupe}
      className="flex rounded-[2px] border border-rule-strong"
    >
      <span id={idGroupe} className="visuellement-masque">
        Thème de l’interface
      </span>
      {THEMES.map((t, i) => (
        <button
          key={t.cle}
          type="button"
          role="radio"
          aria-checked={theme === t.cle}
          title={t.nom}
          onClick={() => definirTheme(t.cle)}
          className={classes(
            // `shrink-0` : sans lui, le conteneur souple comprimait ces boutons
            // à 23,6 px de large, sous le minimum de 24 px du critère 2.5.8.
            'flex h-9 w-9 shrink-0 items-center justify-center transition-colors',
            i > 0 && 'border-l border-rule-strong',
            theme === t.cle ? 'bg-ink text-paper' : 'bg-paper text-ink-muted hover:bg-surface hover:text-ink',
          )}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d={t.icone}
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={t.cle === 'sombre' ? 'currentColor' : 'none'}
            />
            {t.cle === 'clair' ? <circle cx="8" cy="8" r="2.8" stroke="currentColor" strokeWidth="1.3" /> : null}
          </svg>
          <span className="visuellement-masque">{t.nom}</span>
        </button>
      ))}
    </div>
  )
}

/**
 * Sélecteur de simulation de la vision des couleurs.
 *
 * Il ne modifie pas la charte : il change la façon de la regarder. C'est
 * pourquoi il vit à côté des résultats et non dans le panneau de saisie, et
 * pourquoi il ne part pas dans l'URL partagée.
 */
export function ChoixVision() {
  const { deficience, definirDeficience } = usePreferences()
  const idGroupe = useId()
  const courante = DEFICIENCES.find((d) => d.cle === deficience) ?? DEFICIENCES[0]!

  return (
    <div className="flex flex-col gap-1.5">
      <div role="radiogroup" aria-labelledby={idGroupe} className="flex flex-wrap rounded-[2px] border border-rule-strong">
        <span id={idGroupe} className="visuellement-masque">
          Simuler une déficience de la vision des couleurs
        </span>
        {DEFICIENCES.map((d, i) => (
          <button
            key={d.cle}
            type="button"
            role="radio"
            aria-checked={deficience === d.cle}
            onClick={() => definirDeficience(d.cle as Deficience)}
            className={classes(
              'h-8 px-2.5 text-[12px] font-medium transition-colors',
              i > 0 && 'border-l border-rule-strong',
              deficience === d.cle ? 'bg-ink text-paper' : 'bg-paper text-ink-soft hover:bg-surface',
            )}
          >
            {d.cle === 'normale' ? 'Vision courante' : d.nom}
          </button>
        ))}
      </div>
      <p className="text-[12px] text-ink-muted">{courante.detail}</p>
    </div>
  )
}
