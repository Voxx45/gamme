/**
 * Réduit un nom de marque à un fragment de nom de fichier sûr.
 *
 * Sans dépendance au DOM, pour rester testable hors navigateur.
 */

/*
 * Lettres que la décomposition Unicode NFD ne sait pas traiter.
 *
 * NFD sépare un caractère accentué en lettre + diacritique — « é » devient
 * « e » suivi d'un accent que l'on retire. Mais Ø, Æ, Ð ou ß ne sont pas des
 * lettres accentuées : ce sont des lettres à part entière, que NFD laisse
 * intactes. Sans cette table, « NØRVA » sortait en « n-rva ».
 */
const LETTRES_INDECOMPOSABLES: Record<string, string> = {
  'Ø': 'O', 'ø': 'o',
  'Æ': 'AE', 'æ': 'ae',
  'Œ': 'OE', 'œ': 'oe',
  'Ð': 'D', 'ð': 'd',
  'Þ': 'TH', 'þ': 'th',
  'ß': 'ss',
  'Ł': 'L', 'ł': 'l',
  'Đ': 'D', 'đ': 'd',
  'ı': 'i',
  'Ñ': 'N', 'ñ': 'n',
}

const INDECOMPOSABLES = new RegExp(`[${Object.keys(LETTRES_INDECOMPOSABLES).join('')}]`, 'g')

export function baseNomFichier(nom: string): string {
  const base = nom
    .replace(INDECOMPOSABLES, (c) => LETTRES_INDECOMPOSABLES[c] ?? c)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  return base === '' ? 'charte' : base
}
