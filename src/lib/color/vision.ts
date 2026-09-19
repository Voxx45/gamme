import {
  converter,
  filterDeficiencyDeuter,
  filterDeficiencyProt,
  filterDeficiencyTrit,
  formatHex,
} from './culori'

const toRgb = converter('rgb')

export type Deficience = 'normale' | 'deuteranopie' | 'protanopie' | 'tritanopie'

/**
 * Les trois déficiences de la vision des couleurs que l'on peut simuler.
 *
 * Les proportions sont celles des populations d'ascendance européenne, pour
 * lesquelles les chiffres sont les mieux établis. Elles servent à donner un
 * ordre de grandeur, pas à faire de la statistique : ce qui compte est qu'un
 * homme sur douze environ voit ces couleurs autrement que l'écran ne les montre.
 */
export const DEFICIENCES: readonly {
  cle: Deficience
  nom: string
  /** Ce que la personne perçoit mal, en une ligne. */
  detail: string
}[] = [
  { cle: 'normale', nom: 'Vision courante', detail: 'Les couleurs telles que l’écran les affiche.' },
  {
    cle: 'deuteranopie',
    nom: 'Deutéranopie',
    detail: 'Absence des cônes du vert. La plus répandue : environ 1 homme sur 16.',
  },
  {
    cle: 'protanopie',
    nom: 'Protanopie',
    detail: 'Absence des cônes du rouge. Les rouges s’assombrissent nettement.',
  },
  {
    cle: 'tritanopie',
    nom: 'Tritanopie',
    detail: 'Absence des cônes du bleu. Rare, et non liée au sexe.',
  },
]

/**
 * Sévérité maximale : on simule l'anopie, l'absence complète d'un type de cône,
 * et non l'anomalie, qui en est la forme atténuée. C'est le cas le plus dur,
 * donc celui qui vaut la peine d'être vérifié : une palette qui tient en
 * deutéranopie tient en deutéranomalie.
 */
const SEVERITE = 1

const FILTRES: Record<Exclude<Deficience, 'normale'>, ReturnType<typeof filterDeficiencyDeuter>> = {
  deuteranopie: filterDeficiencyDeuter(SEVERITE),
  protanopie: filterDeficiencyProt(SEVERITE),
  tritanopie: filterDeficiencyTrit(SEVERITE),
}

/**
 * Rend une couleur telle qu'elle est perçue avec la déficience indiquée.
 *
 * L'intérêt n'est pas l'exactitude clinique — aucune simulation ne restitue
 * l'expérience de quelqu'un d'autre — mais de répondre à une question précise :
 * deux couleurs que l'on croyait distinctes se confondent-elles ? C'est le cas
 * qui casse une charte, quand la seule différence entre un état valide et un
 * état en erreur tient à la teinte.
 */
export function simuler(hex: string, deficience: Deficience): string {
  if (deficience === 'normale') return hex
  const rgb = toRgb(hex)
  if (!rgb) return hex
  return formatHex(FILTRES[deficience](rgb)).toLowerCase()
}
