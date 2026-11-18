import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import packageJson from './package.json' with { type: 'json' };

const BACKEND_ORIGIN = 'http://localhost:8787';

// pdf.js needs its CMaps, standard fonts and wasm decoders at runtime; serving them
// ourselves keeps CJK/legacy-font scores readable without reaching any CDN.
const PDFJS_ASSET_DIRS = ['cmaps', 'standard_fonts', 'wasm'];

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    viteStaticCopy({
      targets: PDFJS_ASSET_DIRS.map(dir => ({ src: `node_modules/pdfjs-dist/${dir}`, dest: 'pdfjs' })),
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@contract': fileURLToPath(new URL('./contract', import.meta.url)),
    },
  },
  server: {
    // Exposed on LAN so the app can be tried on a tablet during development.
    host: true,
    proxy: {
      '/api': BACKEND_ORIGIN,
      '/file': BACKEND_ORIGIN,
    },
  },
});
