import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // La suite ne couvre que le moteur de calcul. Les démonstrations vivent
    // dans scripts/ et se lancent à la demande, via `npm run demo`.
    include: ['src/**/*.test.ts'],
  },
})
