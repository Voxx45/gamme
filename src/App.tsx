import { useEffect, useId, useRef, useState } from 'react'
import { BoardPanel } from './components/panels/BoardPanel'
import { ContrastPanel } from './components/panels/ContrastPanel'
import { ExportPanel } from './components/panels/ExportPanel'
import { PalettePanel } from './components/panels/PalettePanel'
import { TypePanel } from './components/panels/TypePanel'
import { ChoixTheme } from './components/layout/Reglages'
import { Sidebar } from './components/layout/Sidebar'
import { Bouton, BoutonCopier } from './components/ui/Base'
import { classes } from './components/ui/classes'
import { useAnnonce } from './hooks/annonce-context'
import { GRAND_ECRAN, useMediaQuery } from './hooks/useMediaQuery'
import { FournisseurAnnonces } from './hooks/useAnnonce'
import { EXEMPLES } from './data/exemples'
import { GardeFou } from './components/GardeFou'
import { APropos } from './components/pages/APropos'
import { ACCROCHE, AUTEUR, DEPOT, NOM_OUTIL, SITE } from './config'
import { encodeState, shareUrl } from './lib'
import { Lien } from './routage-lien'
import { useChemin } from './routage'
import { FournisseurPreferences } from './state/FournisseurPreferences'
import { FournisseurCharte } from './state/BrandContext'
import { useCharte } from './state/charte-context'

const VOLETS = [
  { cle: 'palette', titre: 'Palette', rendu: () => <PalettePanel /> },
  { cle: 'contrastes', titre: 'Contrastes', rendu: () => <ContrastPanel /> },
  { cle: 'typographie', titre: 'Typographie', rendu: () => <TypePanel /> },
  { cle: 'board', titre: 'Brand board', rendu: () => <BoardPanel /> },
  { cle: 'export', titre: 'Export', rendu: () => <ExportPanel /> },
] as const

function BoutonIcone({
  libelle,
  raccourci,
  desactive,
  chemin,
  onClick,
  className,
}: {
  libelle: string
  raccourci: string
  desactive: boolean
  chemin: string
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      disabled={desactive}
      aria-label={libelle}
      title={`${libelle} (${raccourci})`}
      onClick={onClick}
      className={classes(
        'flex h-9 w-9 shrink-0 items-center justify-center text-ink-muted transition-colors',
        'hover:bg-surface hover:text-ink disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent',
        className,
      )}
    >
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
        <path d={chemin} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

function Entete({
  simplifiee = false,
  titrePrincipal = false,
}: {
  simplifiee?: boolean
  /*
   * Une page doit porter un `h1` et un seul. Sur l'atelier, c'est le nom de
   * l'outil dans l'en-tête ; sur l'état vide et sur « à propos », c'est le
   * titre de la page, et l'en-tête redevient un simple lien.
   */
  titrePrincipal?: boolean
}) {
  const { vide, config, chargerExemple, reinitialiser, peutAnnuler, peutRetablir, annuler, retablir } = useCharte()
  const annoncer = useAnnonce()

  // L'URL courante porte déjà la charte ; on la reconstruit depuis la
  // configuration plutôt que de lire `location.hash`, qui peut avoir jusqu'à
  // 200 ms de retard sur l'état à cause du délai d'écriture.
  const lien =
    typeof window === 'undefined' ? '' : shareUrl(config, window.location.origin + window.location.pathname)

  return (
    <header className="border-b border-rule bg-paper">
      <div className="mx-auto flex max-w-[1560px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4 sm:px-8">
        <div className="flex items-baseline gap-3">
          {titrePrincipal ? (
            <h1 className="text-[16px] font-semibold tracking-[-0.01em] text-ink">
              <Lien href="/">{NOM_OUTIL}</Lien>
            </h1>
          ) : (
            <Lien href="/" className="text-[16px] font-semibold tracking-[-0.01em] text-ink">
              {NOM_OUTIL}
            </Lien>
          )}
          <p className="hidden text-[13px] text-ink-muted sm:block">{ACCROCHE}</p>
        </div>

        {simplifiee ? (
          <div className="flex items-center gap-2">
            <ChoixTheme />
            <Lien
              href="/"
              className="inline-flex h-9 items-center rounded-[2px] border border-rule-strong px-3 text-[13px] font-medium text-ink transition-colors hover:bg-surface"
            >
              Ouvrir l’outil
            </Lien>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="hidden text-[12px] text-ink-muted xl:block">
              Gratuit · sans compte · tout se calcule dans votre navigateur
            </p>

            {vide ? null : (
              <div className="flex shrink-0 overflow-hidden rounded-[2px] border border-rule-strong">
                <BoutonIcone
                  libelle="Annuler la dernière modification"
                  raccourci="Ctrl+Z"
                  desactive={!peutAnnuler}
                  chemin="M2.5 6.5h7a3 3 0 0 1 0 6H6M2.5 6.5 5 4M2.5 6.5 5 9"
                  onClick={() => {
                    annuler()
                    annoncer('Modification annulée.', 'immediate')
                  }}
                />
                <BoutonIcone
                  libelle="Rétablir la modification annulée"
                  raccourci="Ctrl+Maj+Z"
                  desactive={!peutRetablir}
                  chemin="M12.5 6.5h-7a3 3 0 0 0 0 6H9M12.5 6.5 10 4M12.5 6.5 10 9"
                  className="border-l border-rule-strong"
                  onClick={() => {
                    retablir()
                    annoncer('Modification rétablie.', 'immediate')
                  }}
                />
              </div>
            )}

            <ChoixTheme />

            {vide ? null : (
              <>
                <Bouton
                  variante="discret"
                  onClick={() => {
                    reinitialiser()
                    annoncer('Charte réinitialisée.', 'immediate')
                  }}
                >
                  Recommencer
                </Bouton>
                <BoutonCopier
                  variante="secondaire"
                  taille="normale"
                  texte={lien}
                  identifiant="lien-entete"
                  libelle="Copier le lien de ma charte"
                  enonce="Le lien de votre charte"
                  className="max-sm:hidden"
                />
                <BoutonCopier
                  variante="secondaire"
                  taille="normale"
                  texte={lien}
                  identifiant="lien-entete-court"
                  libelle="Copier le lien"
                  enonce="Le lien de votre charte"
                  className="sm:hidden"
                />
              </>
            )}

            <Bouton
              variante={vide ? 'principal' : 'secondaire'}
              onClick={() => {
                chargerExemple()
                annoncer('Exemple NØRVA chargé.', 'immediate')
              }}
            >
              Exemple
            </Bouton>
          </div>
        )}
      </div>
    </header>
  )
}

function PiedDePage() {
  return (
    <footer className="mt-auto border-t border-rule">
      <div className="mx-auto flex max-w-[1560px] flex-col gap-2 px-5 py-6 text-[12.5px] text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>
          Conçu et développé par{' '}
          <a
            href={SITE}
            className="text-ink underline decoration-rule-strong underline-offset-[3px] hover:decoration-accent"
          >
            {AUTEUR}
          </a>
          , designer en recherche d’alternance.
        </p>
        <p className="flex items-center gap-4">
          <Lien
            href="/a-propos"
            className="underline decoration-rule-strong underline-offset-[3px] hover:text-ink hover:decoration-accent"
          >
            À propos
          </Lien>
          <a
            href={DEPOT}
            className="underline decoration-rule-strong underline-offset-[3px] hover:text-ink hover:decoration-accent"
          >
            Code source
          </a>
          <span>
            Polices servies par Google Fonts. Aucun cookie, aucun suivi.
          </span>
        </p>
      </div>
    </footer>
  )
}

function EtatVide() {
  const { chargerExemple, envoyer } = useCharte()
  const annoncer = useAnnonce()

  return (
    <div className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="max-w-[640px]">
        <p className="surtitre">Commencer</p>
        <h1 className="mt-3 text-[30px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">
          Quatre couleurs, deux polices.
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
          Vous obtenez onze nuances par couleur calculées en OKLCH, la matrice de contrastes WCAG de toutes les paires
          avec une correction proposée pour chacune de celles qui échouent, une échelle typographique, un brand board
          partageable et les exports CSS, Tailwind v4 et tokens JSON.
        </p>

        <div className="mt-7 flex flex-wrap gap-2">
          <Bouton
            variante="principal"
            onClick={() => {
              envoyer({ type: 'ajouterCouleur', hex: '#1b2a41' })
              annoncer('Première couleur ajoutée.', 'immediate')
            }}
          >
            Ajouter ma première couleur
          </Bouton>
          <Bouton
            variante="secondaire"
            onClick={() => {
              chargerExemple()
              annoncer('Exemple NØRVA chargé.', 'immediate')
            }}
          >
            Voir l’exemple NØRVA
          </Bouton>
        </div>

        <div className="mt-11 border-t border-rule pt-7">
          <p className="surtitre">Ou partir d’une charte existante</p>
          {/*
            Chaque carte est un simple lien vers une URL : la galerie n'a aucun
            mécanisme propre, elle prouve au passage que tout tient dans
            l'adresse. Les cinq exemples couvrent des cas différents — une
            palette qui passe partout, une qui échoue beaucoup, des teintes qui
            se frôlent — plutôt que cinq variations agréables.
          */}
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {EXEMPLES.map((ex) => (
              <li key={ex.config.name}>
                <a
                  href={`#${encodeState(ex.config)}`}
                  className="flex h-full items-start gap-3 rounded-[2px] border border-rule p-3 transition-colors hover:border-rule-strong hover:bg-surface"
                >
                  <span aria-hidden="true" className="mt-0.5 flex shrink-0 overflow-hidden rounded-[2px]">
                    {ex.config.colors.map((c) => (
                      <span key={c} style={{ backgroundColor: c }} className="h-8 w-3.5" />
                    ))}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-medium text-ink">{ex.config.name}</span>
                    <span className="block text-[12.5px] leading-snug text-ink-muted">{ex.propos}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <dl className="mt-9 grid grid-cols-2 gap-x-8 gap-y-3 border-t border-rule pt-6 text-[13px]">
          {[
            ['Sans compte', 'Rien à créer, rien à confirmer.'],
            ['Sans serveur', 'Tout le calcul a lieu dans cet onglet.'],
            ['Sans suivi', 'Aucun cookie, aucune mesure d’audience.'],
            ['Partageable', 'Toute la charte tient dans une URL.'],
          ].map(([titre, detail]) => (
            <div key={titre}>
              <dt className="font-medium text-ink">{titre}</dt>
              <dd className="text-ink-muted">{detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}

function Resultats() {
  const [actif, setActif] = useState<string>(VOLETS[0].cle)
  const idOnglets = useId()
  const refsOnglets = useRef<Record<string, HTMLButtonElement | null>>({})
  const grandEcran = useMediaQuery(GRAND_ECRAN)

  const volet = VOLETS.find((v) => v.cle === actif) ?? VOLETS[0]

  function surTouche(e: React.KeyboardEvent, index: number) {
    const touches: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: VOLETS.length - 1,
    }
    const cible = touches[e.key]
    if (cible === undefined) return
    e.preventDefault()
    const suivant = VOLETS[(cible + VOLETS.length) % VOLETS.length]!
    setActif(suivant.cle)
    refsOnglets.current[suivant.cle]?.focus()
  }

  /*
   * Onglets sur grand ecran, sections empilees sur mobile : sur un ecran
   * etroit, faire defiler est plus rapide que viser un onglet, et l'on garde la
   * vue d'ensemble que la charte est censee donner.
   *
   * Une seule des deux dispositions est montee. Les afficher toutes les deux et
   * en masquer une en CSS etait plus simple, mais montait chaque panneau en
   * double : deux fois le calcul, et des `id` en double qui font pointer un
   * onglet vers le mauvais volet pour un lecteur d'ecran.
   */
  if (!grandEcran) {
    return (
      <div className="flex flex-col gap-12">
        {VOLETS.map((v) => (
          <div key={v.cle}>{v.rendu()}</div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        aria-label="Résultats"
        className="sticky top-0 z-20 -mx-5 flex overflow-x-auto border-b border-rule bg-paper/95 px-5 backdrop-blur-[2px] sm:-mx-8 sm:px-8"
      >
        {VOLETS.map((v, i) => (
          <button
            key={v.cle}
            ref={(n) => {
              refsOnglets.current[v.cle] = n
            }}
            type="button"
            role="tab"
            id={`${idOnglets}-${v.cle}`}
            aria-selected={v.cle === actif}
            aria-controls={`${idOnglets}-volet-${v.cle}`}
            tabIndex={v.cle === actif ? 0 : -1}
            onClick={() => setActif(v.cle)}
            onKeyDown={(e) => surTouche(e, i)}
            className={classes(
              'relative shrink-0 px-3.5 py-3 text-[13px] font-medium transition-colors first:pl-0',
              v.cle === actif ? 'text-ink' : 'text-ink-muted hover:text-ink-soft',
            )}
          >
            {v.titre}
            {v.cle === actif ? (
              <span aria-hidden="true" className="absolute inset-x-3.5 -bottom-px h-[2px] bg-accent first:left-0" />
            ) : null}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`${idOnglets}-volet-${volet.cle}`}
        aria-labelledby={`${idOnglets}-${volet.cle}`}
        tabIndex={-1}
      >
        {volet.rendu()}
      </div>
    </div>
  )
}

function Atelier() {
  const { vide, config } = useCharte()

  // Le titre de l'onglet suit le nom de marque : un onglet parmi vingt doit
  // dire ce qu'il contient.
  useEffect(() => {
    const nom = config.name.trim()
    document.title = nom === '' ? `${NOM_OUTIL} — ${ACCROCHE.toLowerCase()}` : `${nom} — ${NOM_OUTIL}`
  }, [config.name])

  if (vide) {
    return (
      <>
        <Entete />
        <main id="contenu" className="flex flex-1 flex-col">
          <EtatVide />
        </main>
        <PiedDePage />
      </>
    )
  }

  return (
    <>
      <Entete titrePrincipal />
      <main id="contenu" className="mx-auto w-full max-w-[1560px] flex-1 px-5 py-7 sm:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[292px_minmax(0,1fr)] lg:gap-12">
          <aside aria-label="Réglages de la charte" className="lg:sticky lg:top-7 lg:self-start">
            <div className="lg:max-h-[calc(100vh-88px)] lg:overflow-y-auto lg:pr-3 defilement-fin">
              <Sidebar />
            </div>
          </aside>
          <div className="min-w-0">
            <Resultats />
          </div>
        </div>
      </main>
      <PiedDePage />
    </>
  )
}

function Pages() {
  const chemin = useChemin()
  if (chemin === '/a-propos') {
    return (
      <>
        <Entete simplifiee />
        <APropos />
        <PiedDePage />
      </>
    )
  }
  return <Atelier />
}

export default function App() {
  return (
    <GardeFou>
      <FournisseurPreferences>
        <FournisseurAnnonces>
          <FournisseurCharte>
            <a
              href="#contenu"
              className="visuellement-masque focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:h-auto focus:w-auto focus:rounded-[2px] focus:bg-ink focus:px-3 focus:py-2 focus:text-[13px] focus:text-paper focus:[clip-path:none]"
            >
              Aller au contenu
            </a>
            <div className="flex min-h-screen flex-col">
              <Pages />
            </div>
          </FournisseurCharte>
        </FournisseurAnnonces>
      </FournisseurPreferences>
    </GardeFou>
  )
}
