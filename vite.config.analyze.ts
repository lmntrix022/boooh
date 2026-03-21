import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from 'rollup-plugin-visualizer';

/**
 * Configuration Vite pour l'analyse de bundle
 * Usage: npx vite build --config vite.config.analyze.ts
 */
export default defineConfig({
  plugins: [
    react(),
    // Bundle Analyzer - Génère un rapport HTML interactif
    visualizer({
      filename: './dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap', // 'treemap' | 'sunburst' | 'network'
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
          'google-maps': ['@react-google-maps/api'],
          'chart-vendor': ['recharts'],
          'animation-vendor': ['framer-motion', 'gsap'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'date-vendor': ['date-fns'],
          'icon-vendor': ['lucide-react'],
          'supabase-vendor': ['@supabase/supabase-js']
        },
      },
    },
  },
});


















