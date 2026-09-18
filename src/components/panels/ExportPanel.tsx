import { useId, useMemo, useState } from 'react'
import { useAnnonce } from '../../hooks/annonce-context'
import { encodeState, shareUrl, toCss, toDtcg, toTailwind } from '../../lib'
import { baseNomFichier, telechargerTexte } from '../../lib/export/png'
import { useCharte } from '../../state/charte-context'
import { Bouton, BoutonCopier, Section } from '../ui/Base'
import { classes } from '../ui/classes'

type Format = {
  cle: string
  titre: string
  /** Nom du fichier tel qu'il arrivera dans le dossier de téléchargement. */
  fichier: string
  typeMime: string
  note: string
  contenu: string
}

export function ExportPanel() {
  const { charte, config } = useCharte()
  const annoncer = useAnnonce()
  const [actif, setActif] = useState('css')
  const idOnglets = useId()
  const base = baseNomFichier(config.name)

  const formats = useMemo<Format[]>(
    () => [
      {
        cle: 'css',
        titre: 'Variables CSS',
        fichier: `${base}-variables.css`,
        typeMime: 'text/css',
        note: 'Hexadécimal : l’export passe-partout, lisible par n’importe quel projet.',
        contenu: toCss(charte),
      },
      {
        cle: 'tailwind',
        titre: 'Tailwind v4',
        fichier: `${base}-theme.css`,
        typeMime: 'text/css',
        note: 'Bloc @theme en oklch(), comme la palette native de Tailwind v4. Chaque variable engendre ses classes utilitaires.',
        contenu: toTailwind(charte),
      },
      {
        cle: 'dtcg',
        titre: 'Tokens JSON',
        fichier: `${base}-tokens.json`,
        typeMime: 'application/json',
        note: 'Format W3C Design Tokens. Les tokens composites se référencent par alias plutôt que de recopier les valeurs.',
        contenu: toDtcg(charte),
      },
    ],
    [charte, base],
  )

  const courant = formats.find((f) => f.cle === actif) ?? formats[0]!
  const lien = typeof window === 'undefined' ? '' : shareUrl(config, window.location.origin + window.location.pathname)

  return (
    <Section
      titre="Export"
      description="Tout est calculé dans votre navigateur. Rien n’est envoyé nulle part, y compris le lien de partage : un fragment d’URL ne quitte jamais la machine."
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div role="tablist" aria-label="Formats d’export" className="flex rounded-[2px] border border-rule-strong">
            {formats.map((f, i) => (
              <button
                key={f.cle}
                type="button"
                role="tab"
                id={`${idOnglets}-onglet-${f.cle}`}
                aria-selected={f.cle === actif}
                aria-controls={`${idOnglets}-volet-${f.cle}`}
                tabIndex={f.cle === actif ? 0 : -1}
                onClick={() => setActif(f.cle)}
                onKeyDown={(e) => {
                  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
                  e.preventDefault()
                  const pas = e.key === 'ArrowRight' ? 1 : -1
                  const suivant = formats[(i + pas + formats.length) % formats.length]!
                  setActif(suivant.cle)
                  document.getElementById(`${idOnglets}-onglet-${suivant.cle}`)?.focus()
                }}
                className={classes(
                  'h-8 px-3 text-[12px] font-medium transition-colors',
                  i > 0 && 'border-l border-rule-strong',
                  f.cle === actif ? 'bg-ink text-paper' : 'bg-paper text-ink-soft hover:bg-surface',
                )}
              >
                {f.titre}
              </button>
            ))}
          </div>

          <BoutonCopier
            variante="principal"
            taille="normale"
            texte={courant.contenu}
            identifiant={`export-${courant.cle}`}
            libelle="Copier"
            enonce={courant.titre}
          />
          <Bouton
            variante="secondaire"
            data-test={`telecharger-${courant.cle}`}
            onClick={() => {
              telechargerTexte(courant.contenu, courant.fichier, courant.typeMime)
              annoncer(`${courant.fichier} téléchargé.`, 'immediate')
            }}
          >
            Télécharger
          </Bouton>
          <span className="tabulaire text-[11px] text-ink-muted">
            {courant.contenu.split('\n').length} lignes · {courant.fichier}
          </span>
        </div>

        <p className="text-[12px] text-ink-muted">{courant.note}</p>

        <div
          role="tabpanel"
          id={`${idOnglets}-volet-${courant.cle}`}
          aria-labelledby={`${idOnglets}-onglet-${courant.cle}`}
          tabIndex={0}
          className="defilement-fin max-h-[420px] overflow-auto rounded-[2px] border border-rule bg-surface"
        >
          <pre className="tabulaire p-4 text-[11.5px] leading-[1.7] text-ink-soft">
            <code>{courant.contenu}</code>
          </pre>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-rule pt-5">
        <h3 className="text-[14px] font-semibold text-ink">Lien de partage</h3>
        <p className="text-[13px] text-ink-muted">
          Toute la configuration tient dans le fragment de l’URL, après le dièse. Un fragment n’est jamais transmis au
          serveur : même l’hébergeur ne voit pas votre charte.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            readOnly
            value={lien}
            aria-label="Lien de partage de cette charte"
            onFocus={(e) => e.currentTarget.select()}
            className="tabulaire h-9 min-w-[240px] flex-1 rounded-[2px] border border-rule-strong bg-surface px-2.5 text-[11.5px] text-ink-soft"
          />
          <BoutonCopier
            variante="secondaire"
            taille="normale"
            texte={lien}
            identifiant="lien-partage"
            libelle="Copier le lien"
            enonce="Le lien de partage"
          />
        </div>
        <p className="tabulaire text-[11px] text-ink-muted">{encodeState(config).length} caractères de configuration.</p>
      </div>
    </Section>
  )
}
