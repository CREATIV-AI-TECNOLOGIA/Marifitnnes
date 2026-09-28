import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), ...(mode === 'standalone' ? [viteSingleFile()] : [])],
  base: './',
  build: { outDir: mode === 'standalone' ? 'standalone' : 'dist', chunkSizeWarningLimit: 1200, rollupOptions: { maxParallelFileOps: 2 }, cssCodeSplit: false },
}));
