import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The site lives at the root of skills.pimbo.dev. Nothing is inlined into the code, so the page rendered at build
// time (tools/prerender.mjs) and the browser code point at the very same files.
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: { assetsInlineLimit: 0 },
});
