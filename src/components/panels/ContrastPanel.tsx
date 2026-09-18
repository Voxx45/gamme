import { useId, useMemo, useState } from 'react'
import { useAnnonce, useAnnonceDifferee } from '../../hooks/annonce-context'
import { evaluatePair, suggestAccessible, type ColorScale, type PairEvaluation } from '../../lib'
import { useCharte } from '../../state/charte-context'
import { Bouton, Pastille, Section } from '../ui/Base'
import { classes } from '../ui/classes'

const NOMS_POSITION = ['Primaire', 'Secondaire', 'Accent', 'Neutre']

type Jeton = {
  nom: string
  hex: string
  /** Index dans la configuration, ou `null` pour le blanc et le noir. */
  index: number | null
  scale: ColorScale | null
}

type Cellule = {
  texte: Jeton
  fond: Jeton
  evaluation: PairEvaluation
}

export function ContrastPanel() {
  const { charte, envoyer } = useCharte()
  const annoncer = useAnnonce()
  const [seulementValides, setSeulementValides] = useState(false)
  const idFiltre = useId()

  const jetons = useMemo<Jeton[]>(
    () => [
      ...charte.colors.map((c, i) => ({
        nom: NOMS_POSITION[i] ?? c.slug,
        hex: c.scale.source.hex,
        index: i,
        scale: c.scale,
      })),
      { nom: 'Blanc', hex: '#ffffff', index: null, scale: null },
      { nom: 'Noir', hex: '#000000', index: null, scale: null },
    ],
    [charte],
  )

  const cellules = useMemo<Cellule[][]>(
    () => jetons.map((texte) => jetons.map((fond) => ({ texte, fond, evaluation: evaluatePair(texte.hex, fond.hex) }))),
    [jetons],
  )

  /**
   * Les paires à corriger : celles qui échouent en texte courant, hors diagonale.
   * La diagonale est une couleur sur elle-même — un ratio de 1 qui n'apprend rien.
   */
  const corrections = useMemo(() => {
    const liste: {
      cle: string
      texte: Jeton
      fond: Jeton
      ratio: number
      suggestion: ReturnType<typeof suggestAccessible>
    }[] = []
    for (const ligne of cellules) {
      for (const c of ligne) {
        if (c.texte.hex === c.fond.hex) continue
        if (c.evaluation.normal.aa) continue
        if (!c.texte.scale || c.texte.index === null) continue
        liste.push({
          cle: `${c.texte.nom}-${c.fond.nom}`,
          texte: c.texte,
          fond: c.fond,
          ratio: c.evaluation.ratio,
          suggestion: suggestAccessible(c.texte.scale, c.texte.scale.anchor, c.fond.hex),
        })
      }
    }
    return liste
  }, [cellules])

  const totalPaires = jetons.length * (jetons.length - 1)
  const reussies = cellules.flat().filter((c) => c.texte.hex !== c.fond.hex && c.evaluation.normal.aa).length

  useAnnonceDifferee(
    `Matrice de contrastes mise à jour. ${reussies} paires sur ${totalPaires} atteignent AA en texte courant.`,
  )

  return (
    <Section
      titre="Contrastes"
      description="Chaque couleur en texte sur chaque couleur en fond, plus le blanc et le noir. Ratio WCAG 2.1, verdict pour le texte courant (Aa) et pour le grand texte (AA, à partir de 24 px)."
      actions={
        <label
          htmlFor={idFiltre}
          className="flex cursor-pointer items-center gap-2 text-[13px] text-ink-soft select-none"
        >
          <input
            id={idFiltre}
            type="checkbox"
            checked={seulementValides}
            onChange={(e) => {
              setSeulementValides(e.target.checked)
              annoncer(e.target.checked ? 'Seules les paires valides sont affichées.' : 'Toutes les paires sont affichées.')
            }}
            className="h-3.5 w-3.5 accent-[var(--color-accent)]"
          />
          Seulement les paires valides
        </label>
      }
    >
      <div className="-mt-1 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <p className="tabulaire text-[12px] text-ink-muted">
          {reussies}/{totalPaires} paires atteignent AA en texte courant.
        </p>
        <p className="flex items-center gap-1.5 text-[11px] text-ink-muted">
          <Pastille prefixe="Aa" verdict="AA" /> texte courant
          <Pastille prefixe="AA" verdict="AA" /> grand texte
        </p>
      </div>

      <div
        className="defilement-fin overflow-x-auto"
        tabIndex={0}
        role="region"
        aria-label="Matrice de contrastes, defilement horizontal"
      >
        <table className="w-full min-w-[640px] border-collapse">
          <caption className="visuellement-masque">
            Matrice de contrastes. Chaque ligne est une couleur de texte, chaque colonne une couleur de fond.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="surtitre w-24 border-b border-rule pb-2 pr-2 text-left align-bottom">
                Texte / fond
              </th>
              {jetons.map((j) => (
                <th key={j.hex + j.nom} scope="col" className="border-b border-rule px-1 pb-2 align-bottom">
                  <span className="flex flex-col items-center gap-1">
                    <span
                      aria-hidden="true"
                      style={{ backgroundColor: j.hex }}
                      className="h-3 w-full rounded-[1px] border border-ink/12"
                    />
                    <span className="text-[11px] font-medium text-ink-soft">{j.nom}</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cellules.map((ligne, i) => (
              <tr key={jetons[i]!.nom}>
                <th scope="row" className="border-b border-rule py-1.5 pr-2 text-left">
                  <span className="flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      style={{ backgroundColor: jetons[i]!.hex }}
                      className="h-3 w-3 shrink-0 rounded-[1px] border border-ink/12"
                    />
                    <span className="text-[11px] font-medium text-ink-soft">{jetons[i]!.nom}</span>
                  </span>
                </th>
                {ligne.map((c, j) => {
                  const identique = c.texte.hex === c.fond.hex
                  const echoue = !c.evaluation.normal.aa
                  const estompe = seulementValides && echoue

                  return (
                    <td
                      key={j}
                      className={classes(
                        'border-b border-l border-rule p-1 text-center align-middle transition-opacity',
                        estompe && 'opacity-15',
                      )}
                    >
                      {identique ? (
                        <span aria-hidden="true" className="text-[11px] text-ink-muted">
                          ·
                        </span>
                      ) : (
                        <span className="flex flex-col items-center gap-0.5">
                          <span
                            className={classes(
                              'tabulaire text-[12px] leading-none',
                              echoue ? 'text-ink-muted' : 'text-ink',
                            )}
                          >
                            {c.evaluation.ratio.toFixed(2)}
                          </span>
                          <span className="flex gap-0.5">
                            <Pastille
                              prefixe="Aa"
                              verdict={c.evaluation.normal.verdict}
                              titre={`Texte courant : ${c.evaluation.normal.verdict}`}
                            />
                            <Pastille
                              prefixe="AA"
                              verdict={c.evaluation.grand.verdict}
                              titre={`Grand texte : ${c.evaluation.grand.verdict}`}
                            />
                          </span>
                          <span className="visuellement-masque">
                            {c.texte.nom} sur {c.fond.nom} : {c.evaluation.ratio.toFixed(2)} pour 1. Texte courant :{' '}
                            {c.evaluation.normal.verdict}. Grand texte : {c.evaluation.grand.verdict}.
                          </span>
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {corrections.length > 0 ? (
        <div className="flex flex-col gap-3 border-t border-rule pt-5">
          <div>
            <h3 className="text-[14px] font-semibold text-ink">Corrections proposées</h3>
            <p className="mt-0.5 text-[13px] text-ink-muted">
              La nuance la plus proche, de la même teinte, qui atteint AA en texte courant. Un clic remplace la couleur
              dans votre charte.
            </p>
          </div>

          <ul className="flex flex-col divide-y divide-rule border-y border-rule">
            {corrections.map((c) => (
              <li key={c.cle} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5">
                <span className="flex min-w-[190px] flex-1 items-center gap-2">
                  <span
                    aria-hidden="true"
                    title={`${c.texte.nom} sur ${c.fond.nom}`}
                    className="flex h-7 w-7 shrink-0 overflow-hidden rounded-[2px] border border-ink/12"
                  >
                    {/*
                      Deux aplats côte à côte plutôt qu'un « Aa » dans la vraie
                      paire. Rendre volontairement du texte illisible dans une
                      interface qui reproche l'illisibilité serait un contresens
                      — et c'est une violation de contraste bien réelle, pas un
                      faux positif de l'audit. Le ratio et le verdict, juste à
                      côté, disent le reste.
                    */}
                    <span style={{ backgroundColor: c.fond.hex }} className="h-full w-1/2" />
                    <span style={{ backgroundColor: c.texte.hex }} className="h-full w-1/2" />
                  </span>
                  <span className="text-[13px] text-ink-soft">
                    <span className="font-medium text-ink">{c.texte.nom}</span> sur {c.fond.nom}
                    <span className="tabulaire text-ink-muted"> · {c.ratio.toFixed(2)}</span>
                  </span>
                </span>

                {c.suggestion ? (
                  <Bouton
                    variante="secondaire"
                    taille="petite"
                    className="gap-2"
                    onClick={() => {
                      if (c.texte.index === null || !c.suggestion) return
                      envoyer({ type: 'modifierCouleur', index: c.texte.index, hex: c.suggestion.hex })
                      annoncer(
                        `${c.texte.nom} remplacée par ${c.suggestion.hex}, palier ${c.suggestion.step}. Contraste ${c.suggestion.ratio.toFixed(2)} sur ${c.fond.nom}.`,
                        'immediate',
                      )
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{ backgroundColor: c.suggestion.hex }}
                      className="h-3.5 w-3.5 rounded-[1px] border border-ink/15"
                    />
                    <span className="tabulaire">{c.suggestion.hex}</span>
                    <span className="text-ink-muted">
                      palier {c.suggestion.step} · {c.suggestion.ratio.toFixed(2)}
                    </span>
                  </Bouton>
                ) : (
                  <span className="text-[12px] text-ink-muted">
                    Aucune nuance de cette teinte ne passe. Changez plutôt le fond.
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="border-t border-rule pt-5 text-[13px] text-pass">
          Toutes les paires atteignent AA en texte courant.
        </p>
      )}
    </Section>
  )
}
