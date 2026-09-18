import { pileDeRepli, type Charte } from '../charte'

/**
 * Tokens au format W3C Design Tokens (DTCG).
 *
 * Deux choix d'interopérabilité, assumés :
 *
 * — Les couleurs sortent en chaîne hexadécimale et les dimensions en chaîne
 *   `"1rem"`, plutôt que dans les formes objet de la dernière rédaction du
 *   brouillon. Ce sont les formes que lisent aujourd'hui Style Dictionary,
 *   Tokens Studio et Figma. Un export que personne ne peut importer ne sert à rien.
 *
 * — Les tokens composites `typography` référencent les autres par alias `{…}`
 *   plutôt que de recopier les valeurs : changer la base met tout à jour.
 */

export type DtcgToken = {
  $value: string | number | string[] | Record<string, string | number>
  $type?: string
  $description?: string
}

export type DtcgGroupe = {
  [cle: string]: DtcgToken | DtcgGroupe | string | undefined
  $type?: string
  $description?: string
}

/** Construit l'objet DTCG. Séparé de la sérialisation, pour pouvoir le tester. */
export function toDtcgObject(charte: Charte): DtcgGroupe {
  const { heading, body } = charte.config
  const nom = charte.config.name.trim()

  const couleurs: DtcgGroupe = { $type: 'color' }
  for (const { slug, scale } of charte.colors) {
    const echelle: DtcgGroupe = {
      $description: `Échelle dérivée de ${scale.source.hex}, ancrée au palier ${scale.anchor}.`,
    }
    for (const s of scale.swatches) {
      echelle[String(s.step)] = {
        $value: s.hex,
        $description: s.isSource ? 'Couleur saisie, restituée telle quelle.' : s.css,
      }
    }
    couleurs[slug] = echelle
  }

  const tailles: DtcgGroupe = { $type: 'dimension' }
  const interlignes: DtcgGroupe = { $type: 'number' }
  for (const n of charte.type.levels) {
    tailles[n.name] = { $value: `${n.rem}rem`, $description: `${n.px} px` }
    interlignes[n.name] = { $value: n.lineHeight }
  }

  return {
    $description:
      nom === ''
        ? 'Mini charte graphique.'
        : `Mini charte graphique — ${nom}. Base ${charte.type.base} px, ratio ${charte.type.ratio}.`,
    color: couleurs,
    fontFamily: {
      $type: 'fontFamily',
      heading: { $value: [heading.family, pileDeRepli(heading.category)] },
      body: { $value: [body.family, pileDeRepli(body.category)] },
    },
    fontWeight: {
      $type: 'fontWeight',
      heading: { $value: heading.weight },
      body: { $value: body.weight },
    },
    fontSize: tailles,
    lineHeight: interlignes,
    typography: {
      $type: 'typography',
      body: {
        $value: {
          fontFamily: '{fontFamily.body}',
          fontSize: '{fontSize.base}',
          fontWeight: '{fontWeight.body}',
          lineHeight: '{lineHeight.base}',
        },
        $description: 'Texte courant.',
      },
      heading: {
        $value: {
          fontFamily: '{fontFamily.heading}',
          fontSize: '{fontSize.3xl}',
          fontWeight: '{fontWeight.heading}',
          lineHeight: '{lineHeight.3xl}',
        },
        $description: 'Titre de premier niveau.',
      },
    },
  }
}

/** Sérialise les tokens DTCG, indentés à deux espaces. */
export function toDtcg(charte: Charte): string {
  return JSON.stringify(toDtcgObject(charte), null, 2)
}
