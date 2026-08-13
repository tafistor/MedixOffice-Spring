import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      config: true, // Active la recherche automatique de la configuration PostCSS
    },
  },
});