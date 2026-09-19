/**
 * Les quelques valeurs qui identifient le projet.
 *
 * Rassemblées ici pour qu'un changement de nom ou de dépôt se fasse en un seul
 * endroit, plutôt qu'à la main dans une douzaine de fichiers.
 */

export const NOM_OUTIL = 'Gamme'
export const ACCROCHE = 'Générateur de mini charte graphique'
export const URL_PUBLIQUE = 'https://gamme-murex.vercel.app'
export const SITE = 'https://pineauewan.com'
export const DEPOT = 'https://github.com/Voxx45/gamme'
export const AUTEUR = 'Ewan Pineau'
export const EMAIL = 'pineauewan0@gmail.com'

/**
 * Profil LinkedIn. Laisser vide masque la ligne sur la page « à propos ».
 * À renseigner avant le lancement : c'est là que le post renverra.
 */
// Le type est élargi à `string` volontairement : sans cela TypeScript fige la
// valeur en type littéral, et le garde `LINKEDIN === ''` de la page « à propos »
// devient une comparaison impossible — erreur TS2367, build cassé.
export const LINKEDIN: string = 'https://www.linkedin.com/in/ewan-pineau'
