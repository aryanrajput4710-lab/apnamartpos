import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true // This enables the PWA install button during npm run dev
      },
      includeAssets: ['favicon.jpg', 'apna-mart-logo.jpg', 'logo.png', 'logo192.png', 'logo512.png'],
      manifest: {
        name: 'Apna Mart POS',
        short_name: 'Apna Mart',
        description: 'Point of Sale & Price Checker for Apna Mart',
        start_url: '/',
        scope: '/',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/logo192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/logo512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/logo512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Price Check',
            short_name: 'Price Check',
            description: 'Barcode Scanner & Price Lookup',
            url: '/price-check',
            icons: [{ src: '/logo192.png', sizes: '192x192' }]
          },
          {
            name: 'POS Billing',
            short_name: 'POS',
            description: 'Point of Sale Counter Billing',
            url: '/pos',
            icons: [{ src: '/logo192.png', sizes: '192x192' }]
          }
        ]
      }
    })
  ],
})
