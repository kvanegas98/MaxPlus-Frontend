import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon.svg'],

      manifest: {
        name: 'MaxPlus IPTV',
        short_name: 'MaxPlus IPTV',
        description: 'Plataforma de gestión de suscripciones IPTV',
        theme_color: '#7c3aed',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        lang: 'es',
        icons: [
          { src: 'pwa-64x64.png',             sizes: '64x64',   type: 'image/png' },
          { src: 'pwa-192x192.png',            sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png',            sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png',  sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },

      workbox: {
        // Pre-cachear todos los assets del build
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,

        runtimeCaching: [
          // Google Fonts CSS — CacheFirst (1 año)
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 10, maxAgeSeconds: 31_536_000 },
            },
          },
          // Google Fonts archivos .woff2 — CacheFirst (1 año)
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: { maxEntries: 30, maxAgeSeconds: 31_536_000 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Imágenes de productos (cualquier origen) — StaleWhileRevalidate (7 días)
          {
            urlPattern: /\.(png|jpg|jpeg|webp|gif|svg)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'product-images',
              expiration: { maxEntries: 150, maxAgeSeconds: 604_800 },
            },
          },
          // NOTA: Los endpoints JSON de la API NO se cachean en SW
          // para garantizar que el cajero siempre trabaje con datos en tiempo real.
        ],
      },
    }),
  ],
  envDir: 'src',
})
