import { pileCss } from '../../hooks/useGoogleFont'
import { useCharte } from '../../state/charte-context'
import { Section } from '../ui/Base'

const SPECIMEN = 'Le vif renard brun saute par-dessus le chien qui dort au soleil'

/** Au dessus de ce niveau, l'échelle bascule sur la police de titrage. */
const SEUIL_TITRE = 2

/** Arrondit sans traîner de décimales qui ne veulent rien dire. */
function rem(valeur: number): string {
  return `${Number(valeur.toFixed(3))}rem`
}

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
            <div key={n.name} className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-baseline sm:gap-6">
              {/*
                Grille à colonnes fixes plutôt qu'une largeur unique : « interligne
                1.12 (68.36 px) » débordait et laissait « px) » orphelin à la ligne.
              */}
              <dl className="grid shrink-0 grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 sm:w-[228px]">
                <dt className="surtitre self-center">{n.name}</dt>
                <dd className="tabulaire text-[13px] text-ink">
                  {n.px} px <span className="text-ink-muted">· {rem(n.rem)}</span>
                </dd>
                <dt className="surtitre self-center">int.</dt>
                <dd className="tabulaire text-[11px] text-ink-muted">
                  {n.lineHeight} · {n.lineHeightPx} px
                </dd>
              </dl>

              {/*
                Deux lignes plutôt qu'une seule tronquée. Le panneau conseille un
                interlignage : le rendre sur une ligne unique le rendait invisible,
                et la troncature coupait en plein mot.
              */}
              <p
                className="line-clamp-2 min-w-0 flex-1 text-ink"
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
        {config.heading.weight}, les autres en {config.body.family} {config.body.weight}. Les rem sont relatifs à la
        racine du document, seize pixels par défaut : c'est ce qui permet au réglage de taille de texte du navigateur
        de continuer à agir.
      </p>
    </Section>
  )
}
