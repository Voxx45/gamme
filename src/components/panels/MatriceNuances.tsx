import { useId, useMemo, useState } from 'react'
import { contrastRatio, evaluatePair, simuler, SEUILS, type Charte } from '../../lib'
import { usePreferences } from '../../state/preferences'
import { CLASSES_SAISIE, classes } from '../ui/classes'

type Niveau = 'normal' | 'grand' | 'interface'

const NIVEAUX: { cle: Niveau; nom: string; seuil: number; detail: string }[] = [
  { cle: 'normal', nom: 'Texte courant', seuil: SEUILS.normal.aa, detail: 'AA, 4,5:1' },
  { cle: 'grand', nom: 'Grand texte', seuil: SEUILS.grand.aa, detail: 'AA, 3:1 — à partir de 24 px' },
  { cle: 'interface', nom: 'Éléments d’interface', seuil: SEUILS.interface, detail: '3:1 — bordures, icônes, focus' },
]

/**
 * La matrice de toutes les nuances de deux échelles, l'une contre l'autre.
 *
 * La matrice principale compare quatre couleurs de base. Mais la question que
 * se pose réellement quelqu'un qui intègre une charte n'est pas « ma primaire
 * passe-t-elle sur ma neutre » : c'est « est-ce que `primaire-600` passe sur
 * `neutre-50` ». L'outil calcule ces quarante-quatre nuances et ne les
 * confrontait jamais entre elles.
 *
 * Cent vingt et une cases, donc, et un seul seuil à la fois : afficher quatre
 * verdicts par case rendrait la grille illisible. On choisit ce que l'on
 * cherche, et la grille répond par oui ou par non.
 */
export function MatriceNuances({ charte, noms }: { charte: Charte; noms: string[] }) {
  const { deficience } = usePreferences()
  const idTexte = useId()
  const idFond = useId()
  const idNiveau = useId()

  const [iTexte, setITexte] = useState(0)
  const [iFond, setIFond] = useState(() => (charte.colors.length > 1 ? charte.colors.length - 1 : 0))
  const [niveau, setNiveau] = useState<Niveau>('normal')

  // Les index survivent à la suppression d'une couleur sans jamais sortir du tableau.
  const texte = charte.colors[Math.min(iTexte, charte.colors.length - 1)]
  const fond = charte.colors[Math.min(iFond, charte.colors.length - 1)]
  const seuil = NIVEAUX.find((n) => n.cle === niveau)?.seuil ?? SEUILS.normal.aa

  const grille = useMemo(() => {
    if (!texte || !fond) return []
    return texte.scale.swatches.map((t) =>
      fond.scale.swatches.map((f) => {
        const ratio = contrastRatio(t.hex, f.hex)
        return { texte: t, fond: f, ratio, passe: ratio >= seuil }
      }),
    )
  }, [texte, fond, seuil])

  if (!texte || !fond) return null

  const valides = grille.flat().filter((c) => c.passe).length
  const total = grille.flat().length

  return (
    <div className="flex flex-col gap-4 border-t border-rule pt-5">
      <div>
        <h3 className="text-[14px] font-semibold text-ink">Nuance par nuance</h3>
        <p className="mt-0.5 max-w-prose text-[13px] text-ink-muted">
          Les onze paliers d’une échelle contre les onze de l’autre. C’est la grille qu’on consulte au moment
          d’intégrer : elle répond à « est-ce que le palier 600 passe sur le palier 50 ».
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor={idTexte} className="surtitre">
            Texte
          </label>
          <select
            id={idTexte}
            value={iTexte}
            onChange={(e) => setITexte(Number(e.target.value))}
            className={classes(CLASSES_SAISIE, 'h-8 w-auto pr-8')}
          >
            {charte.colors.map((c, i) => (
              <option key={c.slug} value={i}>
                {noms[i] ?? c.slug}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={idFond} className="surtitre">
            Fond
          </label>
          <select
            id={idFond}
            value={iFond}
            onChange={(e) => setIFond(Number(e.target.value))}
            className={classes(CLASSES_SAISIE, 'h-8 w-auto pr-8')}
          >
            {charte.colors.map((c, i) => (
              <option key={c.slug} value={i}>
                {noms[i] ?? c.slug}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={idNiveau} className="surtitre">
            Seuil visé
          </label>
          <select
            id={idNiveau}
            value={niveau}
            onChange={(e) => setNiveau(e.target.value as Niveau)}
            className={classes(CLASSES_SAISIE, 'h-8 w-auto pr-8')}
          >
            {NIVEAUX.map((n) => (
              <option key={n.cle} value={n.cle}>
                {n.nom} — {n.detail}
              </option>
            ))}
          </select>
        </div>

        <p className="tabulaire pb-1.5 text-[12px] text-ink-muted">
          {valides}/{total} paires
        </p>
      </div>

      <div
        className="defilement-fin overflow-x-auto"
        tabIndex={0}
        role="region"
        aria-label="Grille nuance par nuance, défilement horizontal"
      >
        <table className="w-full min-w-[620px] border-collapse">
          <caption className="visuellement-masque">
            Chaque ligne est un palier de {noms[iTexte]} en texte, chaque colonne un palier de {noms[iFond]} en fond.
            Une case pleine indique que la paire atteint le seuil visé.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="surtitre w-12 pb-1.5 pr-2 text-right align-bottom">
                ↓ sur →
              </th>
              {fond.scale.swatches.map((f) => (
                <th key={f.step} scope="col" className="pb-1.5 align-bottom">
                  <span className="tabulaire block text-[10px] text-ink-muted">{f.step}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grille.map((ligne, i) => (
              <tr key={texte.scale.swatches[i]!.step}>
                <th scope="row" className="tabulaire pr-2 text-right text-[10px] font-normal text-ink-muted">
                  {texte.scale.swatches[i]!.step}
                </th>
                {ligne.map((c) => {
                  /*
                   * Chaque case est peinte avec la vraie paire : c'est la seule
                   * façon de juger. Les cases qui échouent sont estompées pour
                   * que la zone utilisable saute aux yeux — le motif se lit
                   * donc aussi sans percevoir la couleur.
                   */
                  const fondVu = simuler(c.fond.hex, deficience)
                  const texteVu = simuler(c.texte.hex, deficience)
                  const e = evaluatePair(c.texte.hex, c.fond.hex)
                  return (
                    <td key={c.fond.step} className="p-[1px]">
                      <span
                        title={`${noms[iTexte]} ${c.texte.step} sur ${noms[iFond]} ${c.fond.step} : ${e.ratio.toFixed(2)}`}
                        style={
                          c.passe
                            ? { backgroundColor: fondVu, color: texteVu }
                            : { backgroundColor: 'transparent', color: 'var(--color-ink-muted)' }
                        }
                        /*
                          Pas d'`opacity` sur ces chiffres : elle ferait tomber
                          leur contraste à 2,5:1 — la faute même que l'outil
                          reproche. Le cadre pointillé et le fond neutre
                          suffisent à distinguer une case en échec.
                        */
                        className={classes(
                          'tabulaire flex h-7 items-center justify-center rounded-[1px] text-[10px]',
                          c.passe ? 'font-medium' : 'border border-dashed border-rule',
                        )}
                      >
                        {e.ratio.toFixed(1)}
                        <span className="visuellement-masque">
                          {noms[iTexte]} {c.texte.step} sur {noms[iFond]} {c.fond.step} :{' '}
                          {e.ratio.toFixed(2)} pour 1, {c.passe ? 'atteint le seuil' : 'insuffisant'}.
                        </span>
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-4 w-6 rounded-[1px] bg-rule" />
          case pleine : la paire atteint le seuil
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-4 w-6 rounded-[1px] border border-dashed border-rule" />
          case vide : insuffisante
        </span>
      </p>
    </div>
  )
}
