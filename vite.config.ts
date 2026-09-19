import tailwindcss from '@tailwindcss/vite'
import preact from '@preact/preset-vite'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [preact(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Preact en lieu et place de React : `preact/compat` expose la meme API,
      // pour un dixieme du poids. Tout le code applicatif reste ecrit en React.
      react: 'preact/compat',
      'react-dom': 'preact/compat',
      'react-dom/test-utils': 'preact/test-utils',
      'react/jsx-runtime': 'preact/jsx-runtime',
    },
  },
})
