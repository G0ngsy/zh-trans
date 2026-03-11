import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    // PWA 설정 시작
    VitePWA({
      // 앱이 업데이트되면 새로운 버전으로 자동 교체
      registerType: 'autoUpdate',
      // 개발 모드에서도 PWA 기능 확인 가능
      devOptions: { enabled: true },
      // 스마트폰에 설치될 앱 설정
      manifest: {
        name: 'Hanyu Lens',
        short_name: 'HanyuLens',
        description: 'AI 기반 중국어 번역 및 학습 도구',
        theme_color: '#34D399', // Jade-400 컬러
        background_color: '#ECFDF5', // Jade-50 컬러
        display: 'standalone', // ✨ 주소창을 숨기고 앱 전체화면으로 실행
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // 안드로이드의 둥근 아이콘 지원
          }
        ]
      }
    })
  ]
})