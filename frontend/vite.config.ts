import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    // PWA 설정 시작
    VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'Hanyu Lens',
    short_name: 'HanyuLens',
    theme_color: '#34D399',
    background_color: '#ECFDF5',
    display: 'standalone', // 앱처럼 보이게 하는 핵심!
    icons: [
      {
        src: '/pwa-192x192.png', // 아까 만드신 아이콘 이름과 일치 확인
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/pwa-512x512.png', // 아까 만드신 아이콘 이름과 일치 확인
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  }
})
  ]
})