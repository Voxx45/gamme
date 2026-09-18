import { pileCss } from '../../hooks/useGoogleFont'
import { useCharte } from '../../state/charte-context'
import { Section } from '../ui/Base'

const SPECIMEN = 'Le vif renard brun saute par-dessus le chien'

/** Au dessus de ce niveau, l'échelle bascule sur la police de titrage. */
const SEUIL_TITRE = 2

export function TypePanel() {
  const { charte, config } = useCharte()
  const { levels, base, ratio } = charte.type

  return (
    <Section
      titre="Typographie"
      description={`Échelle modulaire de base ${base} px, ratio ${ratio}. L'interlignage conseillé se resserre à mesure que la taille augmente : un titre de 48 px avec l'interlignage d'un paragraphe se désagrège en lignes flottantes.`}
    >
      <div className="flex flex-col divide-y divide-rule border-y border-rule">
        {[...levels].reverse().map((n) => {
          const titrage = n.step >= SEUIL_TITRE
          const choix = titrage ? config.heading : config.body
          return (
            <div key={n.name} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-baseline sm:gap-6">
              <dl className="flex shrink-0 gap-4 sm:w-56 sm:flex-col sm:gap-0.5">
                <div className="flex items-baseline gap-1.5">
                  <dt className="surtitre">{n.name}</dt>
                  <dd className="tabulaire text-[12px] text-ink">{n.px} px</dd>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <dt className="visuellement-masque">Taille en rem</dt>
                  <dd className="tabulaire text-[11px] text-ink-muted">{n.rem}rem</dd>
                  <dt className="visuellement-masque">Interlignage conseillé</dt>
                  <dd className="tabulaire text-[11px] text-ink-muted">
                    · interligne {n.lineHeight} ({n.lineHeightPx} px)
                  </dd>
                </div>
              </dl>

              <p
                className="min-w-0 flex-1 truncate text-ink"
                style={{
                  fontFamily: pileCss(choix.family),
                  fontWeight: choix.weight,
                  fontSize: `${n.px}px`,
                  lineHeight: n.lineHeight,
                }}
              >
                {SPECIMEN}
              </p>
            </div>
          )
        })}
      </div>

      <p className="text-[12px] text-ink-muted">
        Les niveaux <span className="tabulaire">xl</span> et au dessus sont rendus en {config.heading.family}{' '}
        {config.heading.weight}, les autres en {config.body.family} {config.body.weight}.
      </p>
    </Section>
  )
}
