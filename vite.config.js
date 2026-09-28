import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const BACKEND = process.env.VITE_API_URL || 'http://localhost:5000';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': BACKEND }
  },
  define: {
    __APP_ROLE__: JSON.stringify(null)
  }
});
