import { useCopie } from '../../hooks/annonce-context'
import { encreLisible, simuler, type ColorScale, type Deficience } from '../../lib'
import { usePreferences } from '../../state/preferences'
import { ChoixVision } from '../layout/Reglages'
import { useCharte } from '../../state/charte-context'
import { Section } from '../ui/Base'
import { classes } from '../ui/classes'

const NOMS_POSITION = ['Primaire', 'Secondaire', 'Accent', 'Neutre']

/** Le nom donné par l'utilisateur, sinon le nom de position. */
function nomCouleur(config: { colorNames: string[] }, i: number, repli: string): string {
  const saisi = (config.colorNames[i] ?? '').trim()
  if (saisi !== '') return saisi
  return NOMS_POSITION[i] ?? repli
}

function Echelle({ nom, scale, deficience }: { nom: string; scale: ColorScale; deficience: Deficience }) {
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
      {/*
        `tabIndex` sur une zone a defilement : sans lui, une personne au clavier
        ne peut pas atteindre les nuances qui debordent. C'est ce que releve la
        regle axe `scrollable-region-focusable`.
      */}
      <div
        className="defilement-fin -mx-px overflow-x-auto px-px"
        tabIndex={0}
        role="group"
        aria-label={`Nuances de ${nom}`}
      >
      <ul className="grid min-w-[616px] grid-cols-11 overflow-hidden rounded-[2px] border border-rule">
        {scale.swatches.map((s) => {
          const identifiant = `${nom}-${s.step}`
          /*
           * La pastille montre la couleur telle qu'elle est perçue, mais le
           * libellé comme la valeur copiée restent la vraie couleur : on simule
           * un regard, on ne réécrit pas la charte.
           */
          const affichee = simuler(s.hex, deficience)
          const encre = encreLisible(affichee)
          return (
            <li key={s.step} className="relative">
              <button
                type="button"
                onClick={() => void copier(s.hex, identifiant, `${nom} ${s.step}, ${s.hex},`)}
                style={{ backgroundColor: affichee, color: encre }}
                className={classes(
                  'flex h-[78px] w-full flex-col items-center justify-between py-2 transition-opacity hover:opacity-90',
                  s.isSource ? 'ring-1 ring-inset ring-ink/35' : '',
                )}
                title={`Copier ${s.hex}`}
              >
                <span className="tabulaire text-[10px]">{s.step}</span>
                <span className="tabulaire text-[10px] font-medium">
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
  const { deficience } = usePreferences()

  return (
    <Section
      titre="Palette"
      description="Onze nuances par couleur, calculées en OKLCH. La couleur saisie est restituée telle quelle sur le palier encadré. Cliquez une nuance pour la copier."
      actions={<ChoixVision />}
    >
      <div className="flex flex-col gap-7">
        {charte.colors.map((c, i) => (
          <Echelle key={c.slug} nom={nomCouleur(charte.config, i, c.slug)} scale={c.scale} deficience={deficience} />
        ))}
      </div>
    </Section>
  )
}
