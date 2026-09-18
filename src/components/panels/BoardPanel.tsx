import { useEffect, useRef, useState } from 'react'
import { useAnnonce } from '../../hooks/annonce-context'
import { baseNomFichier, DEFINITION, exporterPng, FORMATS } from '../../lib/export/png'
import { useCharte } from '../../state/charte-context'
import { BrandBoard, type Orientation } from '../board/BrandBoard'
import { Bouton, Section } from '../ui/Base'
import { classes } from '../ui/classes'

export function BoardPanel() {
  const { charte, config } = useCharte()
  const annoncer = useAnnonce()

  const refs = useRef<Record<string, HTMLDivElement | null>>({})
  const cadreRef = useRef<HTMLDivElement>(null)
  const [apercu, setApercu] = useState<Orientation>('paysage')
  const [enCours, setEnCours] = useState<string | null>(null)

  const formatApercu = FORMATS.find((f) => f.cle === apercu) ?? FORMATS[0]!

  /**
   * Le board est rendu à sa taille réelle puis réduit pour tenir dans la
   * colonne. On mesure le cadre plutôt que de deviner : la largeur disponible
   * dépend de la fenêtre, de la barre latérale et de la barre de défilement.
   */
  const [largeurCadre, setLargeurCadre] = useState(0)
  useEffect(() => {
    const cadre = cadreRef.current
    if (!cadre) return
    const observateur = new ResizeObserver(([entree]) => setLargeurCadre(entree?.contentRect.width ?? 0))
    observateur.observe(cadre)
    return () => observateur.disconnect()
  }, [])

  const echelle = largeurCadre === 0 ? 0 : Math.min(1, largeurCadre / formatApercu.largeur)

  const polices = [
    { family: config.heading.family, weights: [config.heading.weight] },
    { family: config.body.family, weights: [config.body.weight, 600] },
  ]

  async function telecharger(cle: string) {
    const format = FORMATS.find((f) => f.cle === cle)
    const noeud = refs.current[cle]
    if (!format || !noeud || enCours) return

    setEnCours(cle)
    annoncer(`Génération de l’image ${format.titre} en cours.`, 'immediate')
    try {
      await exporterPng(noeud, `${baseNomFichier(config.name)}-brand-board-${format.largeur}x${format.hauteur}.png`, {
        largeur: format.largeur,
        hauteur: format.hauteur,
        polices,
      })
      annoncer(`Image ${format.titre} téléchargée.`, 'immediate')
    } catch {
      annoncer('L’export de l’image a échoué. Réessayez.', 'immediate')
    } finally {
      setEnCours(null)
    }
  }

  return (
    <Section
      titre="Brand board"
      description="Le visuel de synthèse, dans les deux formats qui servent vraiment : l’aperçu de lien et le post."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {FORMATS.map((f) => (
            <Bouton
              key={f.cle}
              variante={f.cle === 'paysage' ? 'principal' : 'secondaire'}
              disabled={enCours !== null}
              data-test={`telecharger-${f.cle}`}
              onClick={() => void telecharger(f.cle)}
            >
              {enCours === f.cle ? 'Génération…' : `PNG ${f.titre}`}
            </Bouton>
          ))}
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <div role="radiogroup" aria-label="Format prévisualisé" className="flex rounded-[2px] border border-rule-strong">
          {FORMATS.map((f, i) => (
            <button
              key={f.cle}
              type="button"
              role="radio"
              aria-checked={f.cle === apercu}
              onClick={() => setApercu(f.cle as Orientation)}
              className={classes(
                'tabulaire h-7 px-2.5 text-[11px] font-medium transition-colors',
                i > 0 && 'border-l border-rule-strong',
                f.cle === apercu ? 'bg-ink text-paper' : 'bg-paper text-ink-soft hover:bg-surface',
              )}
            >
              {f.titre}
            </button>
          ))}
        </div>
        <p className="text-[12px] text-ink-muted">{formatApercu.usage}</p>
      </div>

      <div ref={cadreRef} className="w-full">
        <div
          className="mx-auto overflow-hidden rounded-[2px] border border-rule"
          style={{ height: formatApercu.hauteur * echelle, width: formatApercu.largeur * echelle }}
          role="img"
          aria-label={`Brand board de ${config.name.trim() === '' ? 'la charte sans titre' : config.name} au format ${formatApercu.titre}, montrant le nom de marque, un titre, un bouton, une carte et la palette complète.`}
        >
          <div
            style={{
              transform: `scale(${echelle})`,
              transformOrigin: 'top left',
              width: formatApercu.largeur,
              height: formatApercu.hauteur,
            }}
          >
            <BrandBoard
              ref={(n) => {
                refs.current[formatApercu.cle] = n
              }}
              charte={charte}
              format={formatApercu.cle as Orientation}
            />
          </div>
        </div>
      </div>

      {/*
        L'autre format est rendu hors écran plutôt que masqué : `html-to-image`
        a besoin d'un nœud réellement mis en page pour le mesurer. `display:none`
        donnerait une image vide.

        Un conteneur de taille nulle à `overflow: hidden`, et non un simple
        décalage à gauche : un nœud de 1080 px de large posé hors du cadre
        gonflait le `scrollWidth` de la page, ce qui se voyait à 320 px. Ici
        l'enfant garde sa mise en page réelle mais ne participe à aucun calcul
        de défilement.
      */}
      <div aria-hidden="true" className="pointer-events-none fixed left-0 top-0 h-0 w-0 overflow-hidden">
        <div className="absolute left-0 top-0" style={{ opacity: 0 }}>
          {FORMATS.filter((f) => f.cle !== formatApercu.cle).map((f) => (
            <BrandBoard
              key={f.cle}
              ref={(n) => {
                refs.current[f.cle] = n
              }}
              charte={charte}
              format={f.cle as Orientation}
            />
          ))}
        </div>
      </div>

      <p className="text-[12px] text-ink-muted">
        Les images sortent à {DEFINITION} fois le format nominal, soit{' '}
        <span className="tabulaire">
          {FORMATS.map((f) => `${f.largeur * DEFINITION} × ${f.hauteur * DEFINITION}`).join(' et ')}
        </span>
        . Les polices sont inlinées dans le fichier : l’image rend les vraies fontes, pas leur repli.
      </p>
    </Section>
  )
}
