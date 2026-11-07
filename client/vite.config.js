// client/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    open: true,
    proxy: {
      // In case you need to proxy, but we rely on CORS+cookies
    },
  },
});
