import { defineConfig } from 'vitest/config'

/**
 * Configuration de la démonstration.
 *
 * Séparée de `vitest.config.ts` pour que `npm test` ne couvre que le moteur :
 * une démonstration n'est pas un test, elle ne vérifie rien, elle montre.
 */
export default defineConfig({
  test: {
    include: ['scripts/**/*.test.ts'],
    reporters: ['verbose'],
  },
})
