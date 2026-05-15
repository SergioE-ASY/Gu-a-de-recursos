import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    plugins: [react()],
    base: env.VITE_BASE_PATH || "/",
    server: {
      proxy: {
        // redirige /api/anthropic → api.anthropic.com evitando CORS
        '/api/anthropic': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/anthropic/, ''),
        },
      },
    },
  };
});