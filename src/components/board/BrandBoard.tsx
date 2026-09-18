import { forwardRef } from 'react'
import { pileCss } from '../../hooks/useGoogleFont'
import { contrastRatio, evaluatePair, suggestAccessible, swatchAt, type Charte, type ColorScale } from '../../lib'

export const LARGEUR_BOARD = 1200
export const HAUTEUR_BOARD = 630

/** Choisit entre deux encres celle qui contraste le plus avec le fond. */
function encreSur(fond: string, claire: string, sombre: string): string {
  return contrastRatio(sombre, fond) >= contrastRatio(claire, fond) ? sombre : claire
}

/**
 * La teinte demandee si elle est lisible sur ce fond, sinon la nuance la plus
 * proche qui passe AA.
 *
 * Le brand board applique a lui-meme la regle que l'outil enseigne : un visuel
 * produit par un outil d'accessibilite n'a pas le droit d'afficher un titre
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

/**
 * Le visuel de synthèse, au format 1200 × 630 — le ratio qu'attendent LinkedIn,
 * X et les aperçus de lien. C'est l'image que les gens partageront, donc elle
 * doit tenir debout seule, sans l'interface autour.
 *
 * Elle est rendue à taille réelle et réduite par transformation CSS à
 * l'affichage : l'export PNG capture le nœud non réduit, ce qui garantit que ce
 * que l'on voit est exactement ce que l'on télécharge.
 */
export const BrandBoard = forwardRef<HTMLDivElement, { charte: Charte }>(function BrandBoard({ charte }, ref) {
  const { config } = charte
  const nom = config.name.trim() === '' ? 'Sans titre' : config.name

  const principale = charte.colors[0]
  const accent = charte.colors[1] ?? charte.colors[0]

  const fond = palier(charte, 3, 50, '#faf9f6')
  const encre = palier(charte, 0, 950, '#14130f')
  const texte = encreSur(fond, '#faf9f6', encre)
  const teinteAccent = accent ? teinteLisible(accent.scale, fond, 'grand') : encre

  // Le bouton porte la couleur de marque elle-meme, pas un palier derive :
  // c'est elle que le lecteur doit reconnaitre.
  const boutonFond = principale?.scale.source.hex ?? encre
  const boutonTexte = encreSur(boutonFond, '#ffffff', '#000000')

  const carteFond = palier(charte, 3, 100, '#f2f0ea')
  const carteTexte = encreSur(carteFond, '#faf9f6', encre)

  const titre = pileCss(config.heading.family)
  const courant = pileCss(config.body.family)

  return (
    <div
      ref={ref}
      style={{
        width: LARGEUR_BOARD,
        height: HAUTEUR_BOARD,
        backgroundColor: fond,
        color: texte,
        fontFamily: courant,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '58px 64px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* En-tête : le nom de marque, en grand, dans la police de titrage. */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 40 }}>
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              fontFamily: courant,
              fontSize: 13,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              opacity: 0.55,
              margin: 0,
            }}
          >
            Mini charte graphique
          </p>
          <h1
            style={{
              fontFamily: titre,
              fontWeight: config.heading.weight,
              fontSize: 96,
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

        <div style={{ textAlign: 'right', fontSize: 13, lineHeight: 1.7, opacity: 0.75, whiteSpace: 'nowrap' }}>
          <p style={{ margin: 0, fontFamily: titre, fontSize: 19 }}>{config.heading.family}</p>
          <p style={{ margin: 0 }}>{config.body.family}</p>
          <p style={{ margin: '6px 0 0', opacity: 0.7 }}>
            {charte.type.base} px · ratio {charte.type.ratio}
          </p>
        </div>
      </div>

      {/* Corps : un échantillon de texte, un bouton, une carte. */}
      <div style={{ display: 'flex', gap: 34, alignItems: 'stretch' }}>
        <div style={{ flex: '1 1 0', minWidth: 0 }}>
          <h2
            style={{
              fontFamily: titre,
              fontWeight: config.heading.weight,
              fontSize: Math.round(charte.type.base * charte.type.ratio ** 3),
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
              opacity: 0.82,
              maxWidth: 440,
            }}
          >
            Le texte courant se lit à {charte.type.base} pixels, avec un interlignage de 1,55. Chaque paire de couleurs
            de cette charte a été vérifiée au regard des critères WCAG.
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

        <div
          style={{
            width: 310,
            backgroundColor: carteFond,
            color: carteTexte,
            borderRadius: 4,
            padding: '26px 28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <p
            style={{
              fontSize: 11,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              opacity: 0.6,
              margin: 0,
            }}
          >
            Carte
          </p>
          <p
            style={{
              fontFamily: titre,
              fontWeight: config.heading.weight,
              fontSize: 30,
              lineHeight: 1.22,
              margin: '10px 0 0',
            }}
          >
            Une accroche courte
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.5, margin: '10px 0 0', opacity: 0.75 }}>
            Trois lignes suffisent à juger une hiérarchie.
          </p>
        </div>
      </div>

      {/* Pied : la palette complète, en bandes. */}
      <div>
        <div style={{ display: 'flex', gap: 10 }}>
          {charte.colors.map((c) => (
            <div key={c.slug} style={{ flex: '1 1 0', display: 'flex', borderRadius: 3, overflow: 'hidden' }}>
              {c.scale.swatches.map((s) => (
                <div key={s.step} style={{ flex: '1 1 0', height: 46, backgroundColor: s.hex }} />
              ))}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 9 }}>
          {charte.colors.map((c) => (
            <p
              key={c.slug}
              style={{
                flex: '1 1 0',
                margin: 0,
                fontSize: 11,
                letterSpacing: '0.04em',
                opacity: 0.6,
                textTransform: 'uppercase',
              }}
            >
              {c.scale.source.hex}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
})
