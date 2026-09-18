import { forwardRef } from 'react'
import { pileCss } from '../../hooks/useGoogleFont'
import { attenuer, contrastRatio, evaluatePair, suggestAccessible, swatchAt, type Charte, type ColorScale } from '../../lib'

export type Orientation = 'paysage' | 'portrait'

/** Choisit entre deux encres celle qui contraste le plus avec le fond. */
function encreSur(fond: string, claire: string, sombre: string): string {
  return contrastRatio(sombre, fond) >= contrastRatio(claire, fond) ? sombre : claire
}

/**
 * La teinte demandée si elle est lisible sur ce fond, sinon la nuance la plus
 * proche qui passe AA.
 *
 * Le brand board applique à lui-même la règle que l'outil enseigne : un visuel
 * produit par un outil d'accessibilité n'a pas le droit d'afficher un titre
 * illisible. Les couleurs exactes restent visibles dans la bande de palette.
 */
function teinteLisible(scale: ColorScale, fond: string, taille: 'normal' | 'grand'): string {
  const e = evaluatePair(scale.source.hex, fond)
  if (taille === 'grand' ? e.grand.aa : e.normal.aa) return scale.source.hex
  return suggestAccessible(scale, scale.anchor, fond, { taille })?.hex ?? encreSur(fond, '#faf9f6', '#14130f')
}

function palier(charte: Charte, i: number, step: number, defaut: string): string {
  const c = charte.colors[i]
  if (!c) return defaut
  return swatchAt(c.scale, step)?.hex ?? defaut
}

/** Les proportions changent avec le format, pas la composition. */
const MESURES = {
  paysage: {
    largeur: 1200,
    hauteur: 630,
    marge: '58px 64px',
    nom: 96,
    surtitre: 13,
    meta: 13,
    metaTitre: 19,
    corpsEnColonne: false,
    carte: 310,
    carteTitre: 30,
    bande: 46,
    ecart: 34,
  },
  portrait: {
    largeur: 1080,
    hauteur: 1350,
    marge: '76px 76px 68px',
    nom: 132,
    surtitre: 15,
    meta: 17,
    metaTitre: 25,
    corpsEnColonne: true,
    carte: 0,
    carteTitre: 38,
    // Les bandes de palette portent la moitie basse du visuel : en 4:5 elles
    // doivent occuper la hauteur, sinon le bas de l'image sonne creux.
    bande: 62,
    ecart: 34,
  },
} as const

/**
 * Le visuel de synthèse.
 *
 * Deux formats : 1200 × 630, le ratio qu'attendent les aperçus de lien, et
 * 1080 × 1350, le 4:5 qui occupe le plus de hauteur dans un fil LinkedIn.
 *
 * Le nœud est rendu à taille réelle puis réduit par transformation CSS à
 * l'affichage ; l'export capture le nœud non réduit, si bien que ce que l'on
 * voit est exactement ce que l'on télécharge.
 */
export const BrandBoard = forwardRef<HTMLDivElement, { charte: Charte; format?: Orientation }>(
  function BrandBoard({ charte, format = 'paysage' }, ref) {
    const m = MESURES[format]
    const { config } = charte
    const nom = config.name.trim() === '' ? 'Sans titre' : config.name

    const principale = charte.colors[0]
    const accent = charte.colors[1] ?? charte.colors[0]

    const fond = palier(charte, 3, 50, '#faf9f6')
    const encre = palier(charte, 0, 950, '#14130f')
    const texte = encreSur(fond, '#faf9f6', encre)
    const teinteAccent = accent ? teinteLisible(accent.scale, fond, 'grand') : encre

    // Le bouton porte la couleur de marque elle-même, pas un palier dérivé :
    // c'est elle que le lecteur doit reconnaître.
    const boutonFond = principale?.scale.source.hex ?? encre
    const boutonTexte = encreSur(boutonFond, '#ffffff', '#000000')

    const carteFond = palier(charte, 3, 100, '#f2f0ea')
    const carteTexte = encreSur(carteFond, '#faf9f6', encre)

    /*
     * Les libelles secondaires etaient rendus par `opacity`, ce qui faisait
     * tomber leur contraste jusqu'a 3,1:1 sans qu'on le voie venir. On melange
     * desormais vers le fond en s'arretant au dernier point qui tient AA : meme
     * effet d'attenuation, contraste garanti. Un visuel produit par un outil
     * d'accessibilite doit passer ses propres criteres.
     */
    const texteEfface = attenuer(texte, fond, 4.6)
    const carteEffacee = attenuer(carteTexte, carteFond, 4.6)

    const titre = pileCss(config.heading.family)
    const courant = pileCss(config.body.family)
    const tailleTitreSection = Math.round(charte.type.base * charte.type.ratio ** (format === 'portrait' ? 4 : 3))

    const metaPolices = (
      <div
        style={{
          textAlign: m.corpsEnColonne ? 'left' : 'right',
          fontSize: m.meta,
          lineHeight: 1.7,
          color: texteEfface,
          whiteSpace: 'nowrap',
        }}
      >
        <p style={{ margin: 0, fontFamily: titre, fontSize: m.metaTitre }}>{config.heading.family}</p>
        <p style={{ margin: 0 }}>{config.body.family}</p>
        <p style={{ margin: '6px 0 0' }}>
          {charte.type.base} px · ratio {charte.type.ratio}
        </p>
      </div>
    )

    const carte = (
      <div
        style={{
          width: m.corpsEnColonne ? '100%' : m.carte,
          backgroundColor: carteFond,
          color: carteTexte,
          borderRadius: 4,
          padding: m.corpsEnColonne ? '40px 42px' : '26px 28px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxSizing: 'border-box',
        }}
      >
        <p
          style={{
            fontSize: 11,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: carteEffacee,
            margin: 0,
          }}
        >
          Carte
        </p>
        <p
          style={{
            fontFamily: titre,
            fontWeight: config.heading.weight,
            fontSize: m.carteTitre,
            lineHeight: 1.22,
            margin: '10px 0 0',
          }}
        >
          Une accroche courte
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.5, margin: '10px 0 0', color: carteEffacee }}>
          Trois lignes suffisent à juger une hiérarchie.
        </p>
      </div>
    )

    return (
      <div
        ref={ref}
        data-format={format}
        style={{
          width: m.largeur,
          height: m.hauteur,
          backgroundColor: fond,
          color: texte,
          fontFamily: courant,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: m.marge,
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* En-tête : le nom de marque, en grand, dans la police de titrage. */}
        <div
          style={{
            display: 'flex',
            flexDirection: m.corpsEnColonne ? 'column' : 'row',
            alignItems: m.corpsEnColonne ? 'stretch' : 'flex-start',
            justifyContent: 'space-between',
            gap: m.corpsEnColonne ? 26 : 40,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontFamily: courant,
                fontSize: m.surtitre,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: texteEfface,
                margin: 0,
              }}
            >
              Mini charte graphique
            </p>
            <h1
              style={{
                fontFamily: titre,
                fontWeight: config.heading.weight,
                fontSize: m.nom,
                lineHeight: 1.04,
                letterSpacing: '-0.02em',
                margin: '10px 0 0',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {nom}
            </h1>
          </div>
          {metaPolices}
        </div>

        {/* Corps : un échantillon de texte, un bouton, une carte. */}
        <div
          style={{
            display: 'flex',
            flexDirection: m.corpsEnColonne ? 'column' : 'row',
            gap: m.ecart,
            alignItems: 'stretch',
          }}
        >
          <div style={{ flex: '1 1 0', minWidth: 0 }}>
            <h2
              style={{
                fontFamily: titre,
                fontWeight: config.heading.weight,
                fontSize: tailleTitreSection,
                lineHeight: 1.18,
                margin: 0,
                color: teinteAccent,
              }}
            >
              Un titre de section
            </h2>
            <p
              style={{
                fontSize: charte.type.base,
                lineHeight: 1.55,
                margin: '14px 0 0',
                color: texteEfface,
                maxWidth: m.corpsEnColonne ? 760 : 440,
              }}
            >
              Le texte courant se lit à {charte.type.base} pixels, avec un interlignage de 1,55. Chaque paire de
              couleurs de cette charte a été vérifiée au regard des critères WCAG.
            </p>
            <div
              style={{
                marginTop: 24,
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: boutonFond,
                color: boutonTexte,
                fontSize: 15,
                fontWeight: 600,
                padding: '13px 26px',
                borderRadius: 3,
              }}
            >
              Action principale
            </div>
          </div>
          {carte}
        </div>

        {/* Pied : la palette complète, en bandes. */}
        <div>
          <div
            style={{
              display: 'flex',
              flexDirection: m.corpsEnColonne ? 'column' : 'row',
              gap: m.corpsEnColonne ? 12 : 10,
            }}
          >
            {charte.colors.map((c) => (
              <div key={c.slug} style={{ flex: '1 1 0' }}>
                {/*
                  Filet insere : quand un palier clair coincide avec le fond du
                  board, la bande semble amputee de son extremite. Le filet la
                  delimite sans ajouter de bordure visible.
                */}
                <div
                  style={{
                    display: 'flex',
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
                  }}
                >
                  {c.scale.swatches.map((s) => (
                    <div key={s.step} style={{ flex: '1 1 0', height: m.bande, backgroundColor: s.hex }} />
                  ))}
                </div>
                {m.corpsEnColonne ? (
                  <p
                    style={{
                      margin: '9px 0 0',
                      fontSize: 13,
                      letterSpacing: '0.04em',
                      color: texteEfface,
                      textTransform: 'uppercase',
                    }}
                  >
                    {c.scale.source.hex}
                  </p>
                ) : null}
              </div>
            ))}
          </div>

          {m.corpsEnColonne ? null : (
            <div style={{ display: 'flex', gap: 10, marginTop: 9 }}>
              {charte.colors.map((c) => (
                <p
                  key={c.slug}
                  style={{
                    flex: '1 1 0',
                    margin: 0,
                    fontSize: 11,
                    letterSpacing: '0.04em',
                    color: texteEfface,
                    textTransform: 'uppercase',
                  }}
                >
                  {c.scale.source.hex}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  },
)
