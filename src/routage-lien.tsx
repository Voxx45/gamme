import { useCallback, type AnchorHTMLAttributes } from 'react'
import { naviguer } from './routage'

/** Un lien interne, qui reste un vrai lien : clic milieu, nouvel onglet, etc. */
export function Lien({ href, children, ...reste }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const surClic = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      e.preventDefault()
      naviguer(href)
    },
    [href],
  )
  return (
    <a href={href} onClick={surClic} {...reste}>
      {children}
    </a>
  )
}
