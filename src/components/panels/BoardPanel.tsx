import { useEffect, useRef, useState } from 'react'
import { useAnnonce } from '../../hooks/annonce-context'
import { exporterPng, nomDeFichier } from '../../lib/export/png'
import { useCharte } from '../../state/charte-context'
import { BrandBoard, HAUTEUR_BOARD, LARGEUR_BOARD } from '../board/BrandBoard'
import { Bouton, Section } from '../ui/Base'

export function BoardPanel() {
  const { charte, config } = useCharte()
  const annoncer = useAnnonce()
  const boardRef = useRef<HTMLDivElement>(null)
  const cadreRef = useRef<HTMLDivElement>(null)
  const [echelle, setEchelle] = useState(1)
  const [enCours, setEnCours] = useState(false)

  /**
   * Le board est rendu à 1200 × 630 puis réduit pour tenir dans la colonne.
   * On mesure le cadre plutôt que de deviner : la largeur disponible dépend de
   * la fenêtre, de la barre latérale et de la barre de défilement.
   */
  useEffect(() => {
    const cadre = cadreRef.current
    if (!cadre) return
    const observateur = new ResizeObserver(([entree]) => {
      const largeur = entree?.contentRect.width ?? LARGEUR_BOARD
      setEchelle(Math.min(1, largeur / LARGEUR_BOARD))
    })
    observateur.observe(cadre)
    return () => observateur.disconnect()
  }, [])

  async function telecharger() {
    const noeud = boardRef.current
    if (!noeud || enCours) return
    setEnCours(true)
    annoncer('Génération de l’image en cours.', 'immediate')
    try {
      await exporterPng(noeud, nomDeFichier(config.name), {
        largeur: LARGEUR_BOARD,
        hauteur: HAUTEUR_BOARD,
      })
      annoncer('Image PNG téléchargée.', 'immediate')
    } catch {
      annoncer('L’export de l’image a échoué. Réessayez.', 'immediate')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <Section
      titre="Brand board"
      description="Le visuel de synthèse, au format 1200 × 630 — le ratio attendu par LinkedIn et par les aperçus de lien."
      actions={
        <Bouton variante="principal" onClick={() => void telecharger()} disabled={enCours}>
          {enCours ? 'Génération…' : 'Télécharger le PNG'}
        </Bouton>
      }
    >
      <div ref={cadreRef} className="w-full">
        <div
          className="overflow-hidden rounded-[2px] border border-rule"
          style={{ height: HAUTEUR_BOARD * echelle }}
          role="img"
          aria-label={`Brand board de ${config.name.trim() === '' ? 'la charte sans titre' : config.name}, montrant le nom de marque, un titre, un bouton, une carte et la palette complète.`}
        >
          <div
            style={{
              transform: `scale(${echelle})`,
              transformOrigin: 'top left',
              width: LARGEUR_BOARD,
              height: HAUTEUR_BOARD,
            }}
          >
            <BrandBoard ref={boardRef} charte={charte} />
          </div>
        </div>
      </div>

      <p className="text-[12px] text-ink-muted">
        L’image est exportée à 2400 × 1260, soit deux fois le format d’affichage, pour rester nette sur les écrans à
        haute densité.
      </p>
    </Section>
  )
}
