import { useCopie } from '../../hooks/annonce-context'
import { contrastRatio, type ColorScale } from '../../lib'
import { useCharte } from '../../state/charte-context'
import { Section } from '../ui/Base'
import { classes } from '../ui/classes'

const NOMS_POSITION = ['Primaire', 'Secondaire', 'Accent', 'Neutre']

/**
 * Le texte posé sur une pastille doit rester lisible quelle que soit la nuance.
 * On choisit donc entre encre et papier selon ce qui contraste le plus — et on
 * ne devine pas : on calcule, avec la même fonction que la matrice.
 */
function encreLisible(fond: string): string {
  return contrastRatio('#14130f', fond) >= contrastRatio('#faf9f6', fond) ? '#14130f' : '#faf9f6'
}

function Echelle({ nom, scale }: { nom: string; scale: ColorScale }) {
  const { copier, copie } = useCopie()

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3 border-b border-rule pb-1.5">
        <h3 className="text-[13px] font-semibold text-ink">{nom}</h3>
        <p className="tabulaire text-[11px] text-ink-muted">
          {scale.source.hex} · ancrée au palier {scale.anchor}
        </p>
      </div>

      {/*
        Onze colonnes et six caracteres d'hexadecimal ne tiennent pas dans
        390 px : sous cette largeur la rampe defile au lieu de se chevaucher.
      */}
      <div className="defilement-fin -mx-px overflow-x-auto px-px">
      <ul className="grid min-w-[616px] grid-cols-11 overflow-hidden rounded-[2px] border border-rule">
        {scale.swatches.map((s) => {
          const identifiant = `${nom}-${s.step}`
          const encre = encreLisible(s.hex)
          return (
            <li key={s.step} className="relative">
              <button
                type="button"
                onClick={() => void copier(s.hex, identifiant, `${nom} ${s.step}, ${s.hex},`)}
                style={{ backgroundColor: s.hex, color: encre }}
                className={classes(
                  'flex h-[74px] w-full flex-col items-center justify-between py-1.5 transition-opacity hover:opacity-90',
                  s.isSource ? 'ring-1 ring-inset ring-ink/35' : '',
                )}
                title={`Copier ${s.hex}`}
              >
                <span className="tabulaire text-[9px] opacity-70">{s.step}</span>
                <span className="tabulaire text-[9px] font-medium">
                  {copie === identifiant ? 'copié' : s.hex.slice(1)}
                </span>
              </button>
              {s.isSource ? (
                <span className="visuellement-masque">Palier du choix d’origine.</span>
              ) : null}
            </li>
          )
        })}
      </ul>
      </div>
    </div>
  )
}

export function PalettePanel() {
  const { charte } = useCharte()

  return (
    <Section
      titre="Palette"
      description="Onze nuances par couleur, calculées en OKLCH. La couleur saisie est restituée telle quelle sur le palier encadré. Cliquez une nuance pour la copier."
    >
      <div className="flex flex-col gap-7">
        {charte.colors.map((c, i) => (
          <Echelle key={c.slug} nom={NOMS_POSITION[i] ?? c.slug} scale={c.scale} />
        ))}
      </div>
    </Section>
  )
}
