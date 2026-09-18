/** Assemble des classes conditionnelles, sans dépendance. */
export function classes(...valeurs: (string | false | null | undefined)[]): string {
  return valeurs.filter(Boolean).join(' ')
}

export const CLASSES_SAISIE =
  'h-9 w-full rounded-[2px] border border-rule-strong bg-paper px-2.5 text-[13px] text-ink ' +
  'placeholder:text-ink-muted focus:border-accent'
