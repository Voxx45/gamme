import { NOM_OUTIL, SITE, DEPOT } from '../../config'
import { Lien } from '../../routage-lien'

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-rule pt-6">
      <h2 className="surtitre mb-3">{titre}</h2>
      <div className="flex flex-col gap-4 text-[15px] leading-relaxed text-ink-soft">{children}</div>
    </section>
  )
}

function LienExterne({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="text-ink underline decoration-rule-strong underline-offset-[3px] hover:decoration-accent"
    >
      {children}
    </a>
  )
}

export function APropos() {
  return (
    <main id="contenu" className="mx-auto w-full max-w-[680px] flex-1 px-5 py-14 sm:px-8 sm:py-20">
      <p className="surtitre">À propos</p>
      <h1 className="mt-3 text-[34px] font-semibold leading-[1.12] tracking-[-0.025em] text-ink">
        Cinq ans à refaire les mêmes vérifications à la main.
      </h1>

      <div className="mt-10 flex flex-col gap-10">
        <Bloc titre="Pourquoi cet outil">
          <p>
            En cinq ans de freelance en design graphique et web, j’ai livré des dizaines de chartes. À chaque projet, le
            même rituel : ouvrir un vérificateur de contraste dans un onglet, y coller mes couleurs deux par deux, noter
            les ratios dans un coin, recommencer parce que le client a changé d’avis sur le bleu. Puis fabriquer les
            nuances à la main, à l’œil, en espérant qu’elles restent cohérentes entre elles.
          </p>
          <p>
            Ce travail est long, répétitif, et surtout il se fait trop tard : on découvre qu’une couleur de marque est
            illisible une fois la maquette terminée, quand il est coûteux de revenir en arrière. J’ai fini par me dire
            que ces vérifications devaient tenir en quelques secondes, au moment où l’on choisit les couleurs — pas
            trois semaines après.
          </p>
          <p>
            {NOM_OUTIL} fait exactement ça, et rien d’autre. Quatre couleurs, deux polices, et tout ce qui en découle :
            les nuances calculées en OKLCH, la matrice de contrastes complète avec une correction proposée pour chaque
            paire qui échoue, l’échelle typographique, un visuel de synthèse et les exports. Gratuit, sans compte, sans
            serveur : tout se calcule dans votre navigateur, et rien de ce que vous saisissez ne quitte votre machine.
          </p>
        </Bloc>

        <Bloc titre="Qui je suis">
          <p>
            Je m’appelle <span className="font-medium text-ink">Ewan Pineau</span>. Designer graphique et web, cinq ans
            de freelance derrière moi, et aujourd’hui étudiant en Bachelor Chef de Projet Digital à YNOV Rennes.
          </p>
          <p>
            Ce qui m’intéresse, c’est le passage de l’écran au produit : ce qui se joue entre une maquette juste et une
            chose que les gens utilisent vraiment. Cet outil est ma façon de le montrer plutôt que de l’affirmer — depuis
            le calcul des couleurs jusqu’aux tests d’accessibilité, en passant par les décisions qu’il a fallu trancher.
          </p>
          <p className="rounded-[2px] border border-rule bg-surface px-4 py-3 text-[14px]">
            <span className="font-medium text-ink">Je cherche une alternance</span> en design produit, design
            d’interface ou gestion de projet digital. Si ce que vous venez d’essayer vous parle, écrivez-moi.
          </p>
        </Bloc>

        <Bloc titre="Me contacter">
          <ul className="flex flex-col gap-2">
            <li>
              Portfolio — <LienExterne href={SITE}>pineauewan.com</LienExterne>
            </li>
            <li>
              Code source — <LienExterne href={DEPOT}>le dépôt GitHub</LienExterne>
            </li>
            <li className="text-ink-muted">
              LinkedIn et adresse e-mail : à compléter avant le lancement.
            </li>
          </ul>
        </Bloc>

        <Bloc titre="Comment c’est fait">
          <p>
            Vite, React, TypeScript et Tailwind CSS v4. Les couleurs sont calculées avec{' '}
            <LienExterne href="https://culorijs.org/">culori</LienExterne>, l’export d’image avec{' '}
            <LienExterne href="https://github.com/bubkoo/html-to-image">html-to-image</LienExterne>. Aucun serveur,
            aucune base de données, aucun cookie : la configuration entière tient dans le fragment de l’URL, qui n’est
            jamais transmis au serveur.
          </p>
          <p>
            Le code est public et sous licence MIT. Le dépôt contient aussi un journal de fabrication, étape par étape,
            avec les décisions prises et les erreurs corrigées en chemin.
          </p>
        </Bloc>
      </div>

      <p className="mt-12 border-t border-rule pt-6">
        <Lien
          href="/"
          className="text-[14px] text-ink underline decoration-rule-strong underline-offset-[3px] hover:decoration-accent"
        >
          Revenir à l’outil
        </Lien>
      </p>
    </main>
  )
}
