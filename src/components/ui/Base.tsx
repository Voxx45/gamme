import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useCopie } from '../../hooks/annonce-context'
import { classes } from './classes'

type BoutonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: 'principal' | 'secondaire' | 'discret'
  taille?: 'normale' | 'petite'
}

const VARIANTES: Record<string, string> = {
  principal: 'bg-ink text-paper border-ink hover:bg-accent hover:border-accent',
  secondaire: 'bg-paper text-ink border-rule-strong hover:bg-surface',
  discret: 'bg-transparent text-ink-muted border-transparent hover:text-ink hover:bg-surface',
}

export function Bouton({ variante = 'secondaire', taille = 'normale', className, ...props }: BoutonProps) {
  return (
    <button
      type="button"
      {...props}
      className={classes(
        'inline-flex items-center justify-center gap-1.5 border font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-40',
        taille === 'petite' ? 'h-7 rounded-[2px] px-2 text-[12px]' : 'h-9 rounded-[2px] px-3 text-[13px]',
        VARIANTES[variante],
        className,
      )}
    />
  )
}

/**
 * Bouton de copie avec confirmation visuelle.
 *
 * La confirmation change le libellé plutôt que d'afficher une icône seule :
 * « Copié » se lit, se traduit et s'annonce. Une coche ne dit rien à un lecteur
 * d'écran sans texte de remplacement, et rien du tout à qui ne la voit pas.
 */
export function BoutonCopier({
  texte,
  identifiant,
  libelle,
  enonce,
  variante = 'secondaire',
  taille = 'petite',
  className,
}: {
  texte: string
  identifiant: string
  /** Ce qui s'affiche sur le bouton. */
  libelle: string
  /** Ce qui est annoncé, ex. « Les variables CSS ». */
  enonce?: string
  variante?: BoutonProps['variante']
  taille?: BoutonProps['taille']
  className?: string
}) {
  const { copier, copie } = useCopie()
  const actif = copie === identifiant
  return (
    <Bouton
      variante={variante}
      taille={taille}
      className={className}
      onClick={() => void copier(texte, identifiant, enonce ?? libelle)}
    >
      {actif ? 'Copié' : libelle}
    </Bouton>
  )
}

/** Pastille de verdict : AA, AAA ou échec. */
export function Pastille({
  verdict,
  titre,
  prefixe,
}: {
  verdict: 'AA' | 'AAA' | 'échec'
  titre?: string
  prefixe?: string
}) {
  const passe = verdict !== 'échec'
  return (
    <span
      title={titre}
      className={classes(
        'tabulaire inline-flex h-[17px] shrink-0 items-center whitespace-nowrap rounded-[2px] px-1 text-[10px] font-medium tracking-[0.06em]',
        passe ? 'bg-pass/12 text-pass' : 'bg-fail/10 text-fail',
      )}
    >
      {prefixe ? `${prefixe} ` : ''}
      {verdict === 'échec' ? 'ÉCHEC' : verdict}
    </span>
  )
}

export function Section({
  titre,
  description,
  actions,
  children,
}: {
  titre: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-3">
        <div>
          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">{titre}</h2>
          {description ? <p className="mt-0.5 max-w-prose text-[13px] text-ink-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      {children}
    </section>
  )
}
