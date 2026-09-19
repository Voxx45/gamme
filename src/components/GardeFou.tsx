import { Component, type ErrorInfo, type ReactNode } from 'react'
import { NOM_OUTIL } from '../config'

type Etat = { erreur: Error | null }

/**
 * Le dernier filet avant la page blanche.
 *
 * L'outil calcule des couleurs saisies par l'utilisateur et lit une URL que
 * n'importe qui peut avoir bricolée. Le moteur est écrit pour ne jamais lever
 * d'exception, et les tests le vérifient — mais un composant peut échouer pour
 * une raison qu'on n'a pas prévue, et une page blanche le jour du lancement
 * serait le pire des résultats.
 *
 * On propose donc deux issues concrètes : repartir d'une charte vierge, ce qui
 * écarte une URL fautive, ou recharger. Et on montre le message d'erreur plutôt
 * que de le cacher : la personne qui le lit peut le copier dans un ticket.
 */
export class GardeFou extends Component<{ children: ReactNode }, Etat> {
  state: Etat = { erreur: null }

  static getDerivedStateFromError(erreur: Error): Etat {
    return { erreur }
  }

  componentDidCatch(erreur: Error, infos: ErrorInfo) {
    console.error('Erreur non rattrapée :', erreur, infos.componentStack)
  }

  render() {
    const { erreur } = this.state
    if (!erreur) return this.props.children

    return (
      <div className="flex min-h-screen items-center justify-center px-5 py-16">
        <div className="max-w-[520px]">
          <p className="surtitre">Erreur</p>
          <h1 className="mt-3 text-[26px] font-semibold leading-[1.2] tracking-[-0.02em] text-ink">
            {NOM_OUTIL} s’est arrêté en chemin.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
            Rien n’est perdu : l’outil ne conserve aucune donnée, votre charte vivait seulement dans l’adresse de cette
            page. Si vous êtes arrivé par un lien partagé, il est probablement abîmé.
          </p>

          <div className="mt-7 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                window.location.href = window.location.pathname
              }}
              className="inline-flex h-9 items-center rounded-[2px] border border-ink bg-ink px-3 text-[13px] font-medium text-paper transition-colors hover:border-accent hover:bg-accent"
            >
              Repartir d’une charte vierge
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex h-9 items-center rounded-[2px] border border-rule-strong bg-paper px-3 text-[13px] font-medium text-ink transition-colors hover:bg-surface"
            >
              Recharger la page
            </button>
          </div>

          <details className="mt-8 border-t border-rule pt-5">
            <summary className="cursor-pointer text-[13px] text-ink-muted">Détail technique</summary>
            <pre className="tabulaire mt-3 overflow-auto rounded-[2px] border border-rule bg-surface p-3 text-[11.5px] leading-relaxed text-ink-soft">
              <code>{erreur.message}</code>
            </pre>
          </details>
        </div>
      </div>
    )
  }
}
