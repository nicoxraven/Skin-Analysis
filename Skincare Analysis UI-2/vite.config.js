import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  server: {
    port: 5173,
    strictPort: false,
    watch: {
      // Critical: never watch Python venv / ML models (causes editor + Vite thrash)
      ignored: [
        '**/backend/**',
        '**/myenv/**',
        '**/.venv/**',
        '**/venv/**',
        '**/*.h5',
        '**/*.tflite',
        '**/node_modules/**',
        '**/dist/**',
      ],
    },
  },
  plugins: [
    figmaAssetResolver(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react', 'recharts'],
  },
})
