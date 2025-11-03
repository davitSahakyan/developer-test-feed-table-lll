import { defineConfig } from 'vite'

export default defineConfig({
  // Use '/' by default (Netlify/localhost). For GitHub Pages builds,
  // set env VITE_TARGET=pages to use the repo subpath.
  base: process.env.VITE_TARGET === 'pages' ? '/developer-test-feed-table/' : '/',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://130.61.77.93:50940',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
