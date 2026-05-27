import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import path from 'path'

// HTTPS=1 habilita TLS autoassinado — necessário pra WebXR/AR funcionar quando
// acessado pelo IP da rede (ex.: do Meta Quest via WiFi). No desktop use HTTP normal.
const useHttps = process.env.HTTPS === '1'

export default defineConfig({
  plugins: [react(), ...(useHttps ? [basicSsl()] : [])],
  resolve: {
    alias: {
      '@sensus/shared-contracts': path.resolve(__dirname, '../../packages/shared-contracts'),
    },
  },
  server: {
    host: true,
    port: 5173,
    https: useHttps ? {} : undefined,
    // Proxy do WebSocket: o front (mesmo via HTTPS por IP) fala com /ws na própria
    // origem e o Vite encaminha pro backend local — evita mixed-content e resolve
    // o "localhost" do Quest. Use VITE_BACKEND_WS_URL=/ws/realtime nesse modo.
    proxy: {
      '/ws': {
        target: 'http://localhost:8080',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
  },
})
