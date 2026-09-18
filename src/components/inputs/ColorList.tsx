import { useId, useState } from 'react'
import { useAnnonce } from '../../hooks/annonce-context'
import { parseColor } from '../../lib'
import { useCharte } from '../../state/charte-context'
import { MAX_COULEURS } from '../../state/charte-reducer'
import { Bouton } from '../ui/Base'
import { CLASSES_SAISIE, classes } from '../ui/classes'

const NOMS_POSITION = ['Primaire', 'Secondaire', 'Accent', 'Neutre']

/** Quelques couleurs de départ, pour que le premier clic donne un résultat. */
const AMORCES = ['#1b2a41', '#c9a227', '#7c9eb2', '#f4f1ea']

const HEX_COMPLET = /^#[0-9a-f]{6}$/i

function Fleche({ sens }: { sens: 'haut' | 'bas' }) {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
      <path
        d={sens === 'haut' ? 'M4.5 8V1.5M1.5 4.5L4.5 1.5L7.5 4.5' : 'M4.5 1v6.5M1.5 4.5L4.5 7.5L7.5 4.5'}
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  )
}

function LigneCouleur({ index, hex, total }: { index: number; hex: string; total: number }) {
  const { envoyer } = useCharte()
  const annoncer = useAnnonce()
  const idChamp = useId()

  // Le texte saisi vit à part de la configuration : taper « rgb(27 42 » ne doit
  // pas faire clignoter la charte à chaque caractère intermédiaire.
  const [texte, setTexte] = useState(hex)
  const [erreur, setErreur] = useState<string | null>(null)

  /**
   * Réaligner le champ sur la configuration quand elle change *ailleurs* :
   * réordonnancement, clic sur une correction proposée, chargement de l'exemple.
   *
   * Le critère n'est pas « qui a provoqué le changement » mais « le texte en
   * place désigne-t-il déjà cette couleur ». Taper « 1b2a41 » verrait sinon le
   * champ se réécrire en « #1b2a41 » sous le curseur : la normalisation est
   * juste, mais l'imposer pendant la frappe est désagréable.
   */
  const [hexVu, setHexVu] = useState(hex)
  if (hex !== hexVu) {
    setHexVu(hex)
    const lu = parseColor(texte)
    if (!lu.ok || lu.value.hex !== hex) {
      setTexte(hex)
      setErreur(null)
    }
  }

  function surSaisie(valeur: string) {
    setTexte(valeur)
    const r = parseColor(valeur)
    if (!r.ok) {
      setErreur(valeur.trim() === '' ? null : r.error)
      return
    }
    setErreur(null)
    if (r.value.hex !== hex) envoyer({ type: 'modifierCouleur', index, hex: r.value.hex })
  }

  const nom = NOMS_POSITION[index] ?? `Couleur ${index + 1}`

  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <label htmlFor={idChamp} className="surtitre flex-1">
          {nom}
        </label>
        <div className="flex items-center gap-0.5">
          <Bouton
            variante="discret"
            taille="petite"
            className="h-6 w-6 px-0"
            disabled={index === 0}
            aria-label={`Monter ${nom}`}
            onClick={() => {
              envoyer({ type: 'deplacerCouleur', index, vers: index - 1 })
              annoncer(`${nom} déplacée en position ${index}.`)
            }}
          >
            <Fleche sens="haut" />
          </Bouton>
          <Bouton
            variante="discret"
            taille="petite"
            className="h-6 w-6 px-0"
            disabled={index === total - 1}
            aria-label={`Descendre ${nom}`}
            onClick={() => {
              envoyer({ type: 'deplacerCouleur', index, vers: index + 1 })
              annoncer(`${nom} déplacée en position ${index + 2}.`)
            }}
          >
            <Fleche sens="bas" />
          </Bouton>
          <Bouton
            variante="discret"
            taille="petite"
            className="h-6 w-6 px-0"
            disabled={total <= 1}
            aria-label={`Supprimer ${nom}`}
            onClick={() => {
              envoyer({ type: 'supprimerCouleur', index })
              annoncer(`${nom} supprimée. ${total - 1} couleurs.`)
            }}
          >
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
              <path d="M1 1l7 7M8 1l-7 7" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </Bouton>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="color"
          value={HEX_COMPLET.test(texte) ? texte : hex}
          onChange={(e) => surSaisie(e.target.value)}
          aria-label={`Sélecteur de couleur pour ${nom}`}
          className="h-9 w-9 shrink-0 rounded-[2px]"
        />
        <input
          id={idChamp}
          type="text"
          spellCheck={false}
          autoComplete="off"
          value={texte}
          onChange={(e) => surSaisie(e.target.value)}
          aria-invalid={erreur !== null}
          aria-describedby={erreur ? `${idChamp}-erreur` : undefined}
          placeholder="#1b2a41"
          className={classes(CLASSES_SAISIE, 'tabulaire', erreur && 'border-fail')}
        />
      </div>

      {erreur ? (
        <p id={`${idChamp}-erreur`} className="text-[12px] leading-snug text-fail">
          {erreur}
        </p>
      ) : null}
    </li>
  )
}

export function ColorList() {
  const { config, envoyer } = useCharte()
  const annoncer = useAnnonce()
  const total = config.colors.length

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-4">
        {config.colors.map((hex, i) => (
          // Clé par position, et non par couleur : sinon chaque frappe valide
          // remonterait la ligne et le champ perdrait le focus.
          <LigneCouleur key={i} index={i} hex={hex} total={total} />
        ))}
      </ul>

      <Bouton
        variante="secondaire"
        disabled={total >= MAX_COULEURS}
        onClick={() => {
          const hex = AMORCES[total] ?? '#6e6a60'
          envoyer({ type: 'ajouterCouleur', hex })
          annoncer(`Couleur ajoutée. ${total + 1} couleurs sur ${MAX_COULEURS}.`)
        }}
      >
        Ajouter une couleur
        <span className="tabulaire text-ink-muted">
          {total}/{MAX_COULEURS}
        </span>
      </Bouton>
    </div>
  )
}
