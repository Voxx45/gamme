import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { ETIQUETTES_CATEGORIE, FONTS, trouverFont, type FontEntry } from '../../data/fonts'
import { chargerPolice, pileCss } from '../../hooks/useGoogleFont'
import { classes } from '../ui/classes'

/** Retire accents et casse, pour que « garamond » trouve « EB Garamond ». */
function pliage(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/**
 * Sélecteur de police avec recherche, où chaque nom s'affiche dans sa propre fonte.
 *
 * Deux contraintes qui se contredisent : montrer 171 familles chacune dans son
 * dessin, sans charger 171 polices. La réponse est un `IntersectionObserver` :
 * une famille n'est demandée à Google Fonts qu'au moment où sa ligne entre dans
 * la zone visible de la liste. Faire défiler charge au fil de l'eau ; chercher
 * réduit la liste, donc le nombre de requêtes.
 *
 * Le motif ARIA est celui du combobox : l'élément actif est désigné par
 * `aria-activedescendant`, le focus ne quitte jamais le champ de saisie.
 */
export function FontPicker({
  id,
  valeur,
  onChange,
  labelId,
}: {
  id: string
  valeur: string
  onChange: (famille: string) => void
  labelId?: string
}) {
  const idListe = useId()
  const [ouvert, setOuvert] = useState(false)
  const [recherche, setRecherche] = useState('')
  const [actif, setActif] = useState(0)

  const champRef = useRef<HTMLInputElement>(null)
  const listeRef = useRef<HTMLUListElement>(null)
  const enveloppeRef = useRef<HTMLDivElement>(null)

  const resultats = useMemo<FontEntry[]>(() => {
    const q = pliage(recherche.trim())
    if (q === '') return [...FONTS]
    return FONTS.filter((f) => pliage(f.family).includes(q) || pliage(ETIQUETTES_CATEGORIE[f.category]).includes(q))
  }, [recherche])

  /**
   * La liste peut avoir rétréci depuis la dernière frappe : on borne l'index
   * actif pendant le rendu plutôt que de le corriger dans un effet.
   */
  const indexActif = Math.min(actif, Math.max(0, resultats.length - 1))

  /** Charge la fonte d'une ligne dès qu'elle devient visible, et pas avant. */
  const observateur = useRef<IntersectionObserver | null>(null)
  useEffect(() => {
    if (!ouvert) return
    observateur.current = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          if (!e.isIntersecting) continue
          const famille = (e.target as HTMLElement).dataset.famille
          if (famille) chargerPolice(famille, [400])
          observateur.current?.unobserve(e.target)
        }
      },
      { root: listeRef.current, rootMargin: '120px' },
    )
    return () => observateur.current?.disconnect()
  }, [ouvert, resultats])

  const observer = useCallback((noeud: HTMLLIElement | null) => {
    if (noeud) observateur.current?.observe(noeud)
  }, [])

  const fermer = useCallback(() => {
    setOuvert(false)
    setRecherche('')
  }, [])

  const choisir = useCallback(
    (famille: string) => {
      onChange(famille)
      fermer()
      champRef.current?.focus()
    },
    [onChange, fermer],
  )

  // Fermer au clic à l'extérieur, comme n'importe quel menu.
  useEffect(() => {
    if (!ouvert) return
    function surClic(e: MouseEvent) {
      if (!enveloppeRef.current?.contains(e.target as Node)) fermer()
    }
    document.addEventListener('mousedown', surClic)
    return () => document.removeEventListener('mousedown', surClic)
  }, [ouvert, fermer])

  // Garder l'option active dans le champ de vision pendant la navigation clavier.
  useEffect(() => {
    if (!ouvert) return
    listeRef.current?.querySelector('[data-actif="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [indexActif, ouvert])

  function surTouche(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!ouvert) {
        setOuvert(true)
        return
      }
      const pas = e.key === 'ArrowDown' ? 1 : -1
      setActif((i) => Math.min(resultats.length - 1, Math.max(0, i + pas)))
      return
    }
    if (e.key === 'Home' && ouvert) {
      e.preventDefault()
      setActif(0)
      return
    }
    if (e.key === 'End' && ouvert) {
      e.preventDefault()
      setActif(resultats.length - 1)
      return
    }
    if (e.key === 'Enter' && ouvert) {
      e.preventDefault()
      const choix = resultats[indexActif]
      if (choix) choisir(choix.family)
      return
    }
    if (e.key === 'Escape' && ouvert) {
      e.preventDefault()
      fermer()
    }
  }

  const entreeCourante = trouverFont(valeur)

  return (
    <div ref={enveloppeRef} className="relative">
      <input
        ref={champRef}
        id={id}
        type="text"
        role="combobox"
        aria-expanded={ouvert}
        aria-controls={idListe}
        aria-autocomplete="list"
        aria-labelledby={labelId}
        aria-activedescendant={ouvert && resultats[indexActif] ? `${idListe}-${indexActif}` : undefined}
        autoComplete="off"
        spellCheck={false}
        value={ouvert ? recherche : valeur}
        placeholder={ouvert ? 'Chercher une police' : undefined}
        onChange={(e) => {
          setRecherche(e.target.value)
          // L'index actif repart de zero ici, dans l'evenement qui raccourcit la
          // liste, plutot que dans un effet qui declencherait un rendu de plus.
          setActif(0)
          if (!ouvert) setOuvert(true)
        }}
        onFocus={() => setOuvert(true)}
        onKeyDown={surTouche}
        className={classes(
          'h-9 w-full rounded-[2px] border border-rule-strong bg-paper px-2.5 text-[14px] text-ink',
          'placeholder:text-ink-muted focus:border-accent',
        )}
        style={ouvert ? undefined : { fontFamily: pileCss(valeur) }}
      />

      <span aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted">
        <svg width="9" height="6" viewBox="0 0 9 6" fill="none">
          <path d="M1 1l3.5 3.5L8 1" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      </span>

      {ouvert ? (
        <ul
          ref={listeRef}
          id={idListe}
          role="listbox"
          aria-label="Polices disponibles"
          className="defilement-fin absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-[2px] border border-rule-strong bg-paper py-1 shadow-[0_8px_24px_-12px_rgba(20,19,15,0.35)]"
        >
          {resultats.length === 0 ? (
            <li className="px-2.5 py-3 text-[13px] text-ink-muted">Aucune police ne correspond.</li>
          ) : (
            resultats.map((f, i) => {
              const choisie = f.family === valeur
              return (
                <li
                  key={f.family}
                  ref={observer}
                  id={`${idListe}-${i}`}
                  role="option"
                  aria-selected={choisie}
                  data-famille={f.family}
                  data-actif={i === indexActif}
                  onMouseEnter={() => setActif(i)}
                  onClick={() => choisir(f.family)}
                  className={classes(
                    'flex cursor-pointer items-baseline justify-between gap-3 px-2.5 py-1.5',
                    i === indexActif ? 'bg-surface' : '',
                    choisie ? 'text-accent' : 'text-ink',
                  )}
                >
                  <span className="truncate text-[16px] leading-6" style={{ fontFamily: pileCss(f.family) }}>
                    {f.family}
                  </span>
                  <span className="surtitre shrink-0">{ETIQUETTES_CATEGORIE[f.category]}</span>
                </li>
              )
            })
          )}
        </ul>
      ) : null}

      <p className="visuellement-masque" aria-live="polite">
        {ouvert ? `${resultats.length} polices proposées.` : ''}
      </p>

      {entreeCourante ? (
        <span className="visuellement-masque">
          Police sélectionnée : {valeur}, {ETIQUETTES_CATEGORIE[entreeCourante.category]}.
        </span>
      ) : null}
    </div>
  )
}
