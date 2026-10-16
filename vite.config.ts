import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  const rootDir = import.meta.dirname || '.';
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(rootDir, '.'),
        '@web': path.resolve(rootDir, 'web/src'),
        '@server': path.resolve(rootDir, 'server/src'),
        '@shared': path.resolve(rootDir, 'shared'),
        '@contracts': path.resolve(rootDir, 'shared/contracts'),
      },
    },
    server: {
      headers: {
        'Permissions-Policy': 'microphone=*',
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
