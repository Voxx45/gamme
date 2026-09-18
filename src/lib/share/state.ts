import { BORNES } from '../typography/scale'
import type { BrandConfig, FontChoice } from '../types'

/** Version du format d'URL. À incrémenter si la signification d'une clé change. */
export const VERSION_URL = '1'

/** Configuration de départ, servie quand l'URL est vide ou illisible. */
export const CONFIG_DEFAUT: BrandConfig = {
  name: '',
  colors: ['#2563eb', '#f97316', '#10b981', '#1e293b'],
  heading: { family: 'Inter', weight: 700, category: 'sans-serif' },
  body: { family: 'Inter', weight: 400, category: 'sans-serif' },
  baseSize: 16,
  ratio: 1.25,
}

/**
 * L'exemple de démonstration.
 *
 * La palette est choisie pour que l'outil se montre lui-même : elle produit à la
 * fois des paires AAA (l'encre sur l'os), une paire AA mais pas AAA (le laiton
 * sur l'encre) et deux échecs francs sur fond blanc (le laiton et le givre) —
 * donc des suggestions de correction visibles dès l'ouverture.
 *
 * Cormorant Garamond aux titres et Manrope au texte, et non l'inverse :
 * Cormorant est un caractère à fort contraste de graisse, taillé pour les
 * grandes tailles. L'employer en texte courant serait un contresens sur un outil
 * qui parle de lisibilité.
 */
export const CONFIG_NORVA: BrandConfig = {
  name: 'NØRVA',
  colors: ['#1b2a41', '#c9a227', '#7c9eb2', '#f4f1ea'],
  heading: { family: 'Cormorant Garamond', weight: 600, category: 'serif' },
  body: { family: 'Manrope', weight: 400, category: 'sans-serif' },
  baseSize: 16,
  ratio: 1.25,
}

export type DecodeResult = {
  config: BrandConfig
  /**
   * Ce qui a dû être corrigé pendant la lecture. Vide si l'URL était propre.
   * Sert au débogage et pourrait alimenter un message discret dans l'interface.
   */
  issues: string[]
}

export type DecodeOptions = {
  /**
   * Liste des familles autorisées. Si elle est fournie, toute famille absente de
   * la liste est refusée. C'est la barrière qui empêche une URL partagée de
   * faire construire à l'outil une requête Google Fonts arbitraire.
   */
  knownFonts?: readonly string[]
}

const HEX3 = /^[0-9a-f]{3}$/i
const HEX6 = /^[0-9a-f]{6}$/i
/** Les familles Google Fonts ne contiennent que lettres, chiffres et espaces. */
const FAMILLE = /^[A-Za-z0-9 ]{1,60}$/
/*
 * Cibler les caractères de contrôle est précisément l'intention : un nom de
 * marque venu d'une URL partagée ne doit pas pouvoir glisser de retour chariot
 * ni de caractère invisible dans l'interface ou dans le brand board exporté.
 */
// oxlint-disable-next-line no-control-regex
const CARACTERES_DE_CONTROLE = /[\u0000-\u001f\u007f-\u009f]/g

const MAX_COULEURS = 4
const MAX_NOM = 32

function normaliserHex(brut: string): string | null {
  const s = brut.trim().replace(/^#/, '')
  if (HEX6.test(s)) return `#${s.toLowerCase()}`
  if (HEX3.test(s)) {
    const t = s.toLowerCase()
    return `#${t[0]}${t[0]}${t[1]}${t[1]}${t[2]}${t[2]}`
  }
  return null
}

function borner(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

/**
 * Sérialise la configuration en paramètres d'URL.
 *
 * Renvoie la chaîne **sans le `#` de tête**, prête à être affectée à
 * `location.hash` ou concaténée derrière un `#`.
 *
 * Le fragment plutôt que la chaîne de requête : un fragment n'est jamais envoyé
 * au serveur. Les chartes que les gens partagent ne transitent donc pas même par
 * l'hébergeur, ce qui est la seule façon de tenir sérieusement la promesse
 * « rien ne quitte votre navigateur ».
 */
export function encodeState(config: BrandConfig): string {
  const p = new URLSearchParams()
  p.set('v', VERSION_URL)

  const couleurs = config.colors
    .map(normaliserHex)
    .filter((c): c is string => c !== null)
    .slice(0, MAX_COULEURS)
    .map((c) => c.slice(1))
  p.set('c', (couleurs.length > 0 ? couleurs : CONFIG_DEFAUT.colors.map((c) => c.slice(1))).join(','))

  p.set('h', config.heading.family)
  p.set('hw', String(config.heading.weight))
  p.set('b', config.body.family)
  p.set('bw', String(config.body.weight))
  p.set('s', String(config.baseSize))
  p.set('r', String(config.ratio))

  const nom = config.name.trim()
  if (nom !== '') p.set('n', nom)

  return p.toString()
}

/** Construit l'URL partageable complète. */
export function shareUrl(config: BrandConfig, base: string): string {
  return `${base.replace(/[#?].*$/, '').replace(/\/+$/, '')}/#${encodeState(config)}`
}

/**
 * Isole la partie paramètres, que l'on reçoive un fragment, une chaîne de
 * requête, ou une URL entière collée depuis la barre d'adresse.
 */
function extraireParams(entree: string): string {
  const s = entree.trim()
  const diese = s.indexOf('#')
  if (diese !== -1) return s.slice(diese + 1)
  const question = s.indexOf('?')
  if (question !== -1) return s.slice(question + 1)
  return s
}

function lireGraisse(brut: string | null, defaut: number, quoi: string, issues: string[]): number {
  if (brut === null || brut.trim() === '') return defaut
  const n = Number(brut)
  if (!Number.isFinite(n)) {
    issues.push(`Graisse ${quoi} illisible (${brut}), remplacée par ${defaut}.`)
    return defaut
  }
  const cale = borner(Math.round(n / 100) * 100, 100, 900)
  if (cale !== n) {
    issues.push(`Graisse ${quoi} ${n} ajustée à ${cale}.`)
  }
  return cale
}

function lireFamille(
  brut: string | null,
  defaut: FontChoice,
  quoi: string,
  knownFonts: readonly string[] | undefined,
  issues: string[],
): string {
  if (brut === null || brut.trim() === '') return defaut.family
  const famille = brut.trim()

  if (!FAMILLE.test(famille)) {
    issues.push(`Police ${quoi} refusée (${famille}), remplacée par ${defaut.family}.`)
    return defaut.family
  }
  if (knownFonts && !knownFonts.includes(famille)) {
    issues.push(`Police ${quoi} inconnue (${famille}), remplacée par ${defaut.family}.`)
    return defaut.family
  }
  return famille
}

function lireNombre(
  brut: string | null,
  defaut: number,
  min: number,
  max: number,
  quoi: string,
  issues: string[],
): number {
  if (brut === null || brut.trim() === '') return defaut
  const n = Number(brut)
  if (!Number.isFinite(n)) {
    issues.push(`${quoi} illisible (${brut}), remplacé par ${defaut}.`)
    return defaut
  }
  const cale = borner(n, min, max)
  if (cale !== n) {
    issues.push(`${quoi} ${n} ramené à ${cale}.`)
  }
  return cale
}

/**
 * Lit une configuration depuis une URL, un fragment ou une chaîne de paramètres.
 *
 * Ne lève jamais d'exception et renvoie toujours une configuration utilisable :
 * chaque champ est validé séparément et retombe seul sur sa valeur par défaut.
 * Une URL tronquée par un client mail doit produire une charte valide, pas un
 * écran blanc. Les clés inconnues sont ignorées, ce qui laisse la porte ouverte
 * à de futurs champs sans casser les liens déjà partagés.
 */
export function decodeState(entree: unknown, options: DecodeOptions = {}): DecodeResult {
  const issues: string[] = []

  if (typeof entree !== 'string' || entree.trim() === '') {
    return { config: { ...CONFIG_DEFAUT, colors: [...CONFIG_DEFAUT.colors] }, issues }
  }

  let p: URLSearchParams
  try {
    p = new URLSearchParams(extraireParams(entree))
  } catch {
    issues.push('Paramètres illisibles, configuration par défaut appliquée.')
    return { config: { ...CONFIG_DEFAUT, colors: [...CONFIG_DEFAUT.colors] }, issues }
  }

  const version = p.get('v')
  if (version !== null && version !== VERSION_URL) {
    issues.push(`Format de partage version ${version}, attendu ${VERSION_URL}. Lecture au mieux.`)
  }

  // Couleurs
  const brutCouleurs = p.get('c')
  let colors: string[] = []
  if (brutCouleurs !== null && brutCouleurs.trim() !== '') {
    for (const morceau of brutCouleurs.split(',')) {
      if (colors.length >= MAX_COULEURS) {
        issues.push(`Au delà de ${MAX_COULEURS} couleurs, les suivantes sont ignorées.`)
        break
      }
      const hex = normaliserHex(morceau)
      if (hex === null) {
        if (morceau.trim() !== '') issues.push(`Couleur ignorée : ${morceau.trim()}.`)
        continue
      }
      colors.push(hex)
    }
  }
  if (colors.length === 0) {
    if (brutCouleurs !== null) issues.push('Aucune couleur exploitable, palette par défaut appliquée.')
    colors = [...CONFIG_DEFAUT.colors]
  }

  // Nom de marque
  let name = ''
  const brutNom = p.get('n')
  if (brutNom !== null) {
    name = brutNom.replace(CARACTERES_DE_CONTROLE, '').trim()
    if (name.length > MAX_NOM) {
      name = name.slice(0, MAX_NOM)
      issues.push(`Nom de marque tronqué à ${MAX_NOM} caractères.`)
    }
  }

  const { knownFonts } = options

  return {
    config: {
      name,
      colors,
      heading: {
        family: lireFamille(p.get('h'), CONFIG_DEFAUT.heading, 'des titres', knownFonts, issues),
        weight: lireGraisse(p.get('hw'), CONFIG_DEFAUT.heading.weight, 'des titres', issues),
      },
      body: {
        family: lireFamille(p.get('b'), CONFIG_DEFAUT.body, 'du texte', knownFonts, issues),
        weight: lireGraisse(p.get('bw'), CONFIG_DEFAUT.body.weight, 'du texte', issues),
      },
      baseSize: lireNombre(
        p.get('s'),
        CONFIG_DEFAUT.baseSize,
        BORNES.base.min,
        BORNES.base.max,
        'Taille de base',
        issues,
      ),
      ratio: lireNombre(p.get('r'), CONFIG_DEFAUT.ratio, BORNES.ratio.min, BORNES.ratio.max, 'Ratio', issues),
    },
    issues,
  }
}
