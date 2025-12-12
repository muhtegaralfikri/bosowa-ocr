import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Optimasi chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - library eksternal
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-ui': ['lucide-react', 'sonner'],
        },
      },
    },
    // Target browser modern untuk bundle lebih kecil
    target: 'es2020',
    // Minifikasi optimal
    minify: 'esbuild',
    // Batas warning chunk size (dalam KB)
    chunkSizeWarningLimit: 500,
  },
})
