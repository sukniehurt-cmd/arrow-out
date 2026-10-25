import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // wymagane przez Capacitor (ładowanie z file://)
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1500, // Phaser jest duży
  },
});
