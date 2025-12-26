import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // モバイル向けの最適化
    target: 'es2015',
    minify: 'esbuild', // terserの代わりにesbuildを使用
    rollupOptions: {
      output: {
        manualChunks: {
          // ライブラリを分割してキャッシュ効率を向上
          vendor: ['react', 'react-dom'],
          leaflet: ['leaflet', 'react-leaflet'],
          aws: ['aws-amplify'],
        },
      },
    },
    // チャンクサイズ警告の閾値を調整
    chunkSizeWarningLimit: 1000,
  },
  server: {
    // 開発サーバーの設定
    host: true, // モバイルデバイスからのアクセスを許可
    port: 5173,
  },
  preview: {
    // プレビューサーバーの設定
    host: true,
    port: 4173,
  },
})
