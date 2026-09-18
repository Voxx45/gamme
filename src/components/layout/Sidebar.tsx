import { useId } from 'react'
import { trouverFont } from '../../data/fonts'
import { RATIOS } from '../../lib'
import { useCharte } from '../../state/charte-context'
import { ColorList } from '../inputs/ColorList'
import { FontPicker } from '../inputs/FontPicker'
import { CLASSES_SAISIE, classes } from '../ui/classes'

function BlocPolice({ role, titre }: { role: 'heading' | 'body'; titre: string }) {
  const { config, envoyer } = useCharte()
  const choix = config[role]
  const idPolice = useId()
  const idGraisse = useId()
  const graisses = trouverFont(choix.family)?.weights ?? [400]

  return (
    <div className="flex flex-col gap-2">
      <span id={`${idPolice}-label`} className="surtitre">
        {titre}
      </span>
      <FontPicker
        id={idPolice}
        labelId={`${idPolice}-label`}
        valeur={choix.family}
        onChange={(famille) => envoyer({ type: 'definirPolice', role, famille })}
      />
      <div className="flex items-center gap-2">
        <label htmlFor={idGraisse} className="text-[12px] text-ink-muted">
          Graisse
        </label>
        <select
          id={idGraisse}
          value={choix.weight}
          onChange={(e) => envoyer({ type: 'definirGraisse', role, graisse: Number(e.target.value) })}
          className={classes(CLASSES_SAISIE, 'tabulaire h-8 flex-1')}
        >
          {graisses.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

function ReglagesTypo() {
  const { config, envoyer } = useCharte()
  const idBase = useId()
  const idRatio = useId()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <label htmlFor={idBase} className="surtitre">
            Taille de base
          </label>
          <output htmlFor={idBase} className="tabulaire text-[12px] text-ink">
            {config.baseSize} px
          </output>
        </div>
        <input
          id={idBase}
          type="range"
          min={12}
          max={24}
          step={1}
          value={config.baseSize}
          onChange={(e) => envoyer({ type: 'definirBase', taille: Number(e.target.value) })}
          className="h-9 w-full accent-[var(--color-accent)]"
        />
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend id={idRatio} className="surtitre mb-1.5">
          Ratio
        </legend>
        <div role="radiogroup" aria-labelledby={idRatio} className="grid grid-cols-4 gap-1">
          {RATIOS.map((r) => {
            const choisi = Math.abs(config.ratio - r) < 0.0005
            return (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={choisi}
                onClick={() => envoyer({ type: 'definirRatio', ratio: r })}
                className={classes(
                  'tabulaire h-8 rounded-[2px] border text-[12px] transition-colors',
                  choisi
                    ? 'border-ink bg-ink text-paper'
                    : 'border-rule-strong bg-paper text-ink-soft hover:bg-surface',
                )}
              >
                {r}
              </button>
            )
          })}
        </div>
      </fieldset>
    </div>
  )
}

export function Sidebar() {
  const { config, envoyer } = useCharte()
  const idNom = useId()

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={idNom} className="surtitre">
          Nom de la marque
        </label>
        <input
          id={idNom}
          type="text"
          value={config.name}
          maxLength={32}
          autoComplete="off"
          placeholder="Sans titre"
          onChange={(e) => envoyer({ type: 'definirNom', nom: e.target.value })}
          className={CLASSES_SAISIE}
        />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-[13px] font-semibold text-ink">Couleurs</h2>
        <ColorList />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-[13px] font-semibold text-ink">Polices</h2>
        <BlocPolice role="heading" titre="Titres" />
        <BlocPolice role="body" titre="Texte" />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-[13px] font-semibold text-ink">Typographie</h2>
        <ReglagesTypo />
      </div>
    </div>
  )
}
