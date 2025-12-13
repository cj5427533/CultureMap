import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Cloudflare Pages 배포를 위한 base 설정 (루트 경로 배포 시 생략 가능)
  // base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false, // 프로덕션 빌드 시 소스맵 비활성화 (선택사항)
  },
  server: {
    host: '0.0.0.0', // 컨테이너 외부에서 접근 가능하도록 설정
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://backend:8080',
        changeOrigin: true,
      },
    },
  },
})
