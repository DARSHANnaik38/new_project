import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: true, // 🔓 This unlocks the tunnel!
  },
  resolve: {
    alias: {
      // react-map-gl v8's `./maplibre` subpath is declared only in `exports`
      // which Rollup's commonjs-resolver can't handle. Point the exact import
      // specifier directly at the pre-built ESM file.
      'react-map-gl/maplibre': path.resolve('./node_modules/react-map-gl/dist/maplibre.js'),
    },
  },
})
