import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/n-back/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'N-Back Trainer',
        short_name: 'N-Back',
        description: 'A client-side, configurable n-back cognitive training app.',
        theme_color: '#56b4e9',
        background_color: '#f2f5f6',
        display: 'standalone',
        start_url: '/n-back/',
        scope: '/n-back/',
        icons: [
          { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Letter-stream audio clips (.wav) and app fonts (.woff2) aren't
        // covered by the default glob extensions, but the app must work
        // fully offline after the first load, so precache them too.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,wav}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
