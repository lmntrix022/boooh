import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import { compression } from 'vite-plugin-compression2';
import { vitePluginCSP, boohCSPConfig } from './vite-plugin-csp';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "127.0.0.1",
    port: 8080,
    hmr: {
      overlay: false
    }
  },
  plugins: [
    react(),
    // Content Security Policy pour protection XSS
    vitePluginCSP({
      policy: boohCSPConfig,
      devRelaxed: true, // Relaxer en dev pour HMR
      useMetaTag: true // Meta tag car headers gérés par Vercel
    }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null, // Désactivé : nous utilisons notre propre gestionnaire sw-lifecycle.js
      workbox: {
        // mode: 'development' évite terser et corrige "Unexpected early exit" (race condition renderChunk)
        mode: 'development',
        cleanupOutdatedCaches: true, // ✨ Nettoyer les anciens caches automatiquement
        clientsClaim: true, // ✨ Prendre le contrôle immédiatement
        skipWaiting: true, // ✨ Activer le nouveau SW sans attendre
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB pour les screenshots
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,xml,json}'],
        // Exclure les gros bundles et images du précache (seront chargés à la demande)
        globIgnores: [
          // Gros bundles JS
          '**/google-maps*.js',     // Google Maps API
          '**/chart-vendor*.js',    // Recharts (484KB)
          '**/admin-main*.js',      // Admin page (412KB)
          '**/jspdf*.js',           // jsPDF (352KB)
          '**/html2canvas*.js',     // html2canvas (196KB)
          '**/Admin*.js',           // Autres fichiers admin
          '**/*-legacy*.js',        // Legacy bundles
          // Grosses images et screenshots
          '**/screenshots/**',      // Tous les screenshots
          '**/testimonials/**',     // Photos témoignages
          '**/*.webp',             // Images WebP (chargées à la demande)
          '**/public/images/**',    // Images publiques volumineuses
        ],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
            }
          },
          {
            // Cache pour les images statiques avec mise à jour automatique
            urlPattern: /\.(webp|png|jpg|jpeg)$/i,
            handler: 'StaleWhileRevalidate', // ✨ Change: toujours vérifier les nouvelles versions
            options: {
              cacheName: 'images-cache-v2', // ✨ Change: nouvelle version de cache
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 jours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache pour l'API Supabase
            urlPattern: /^https:\/\/[a-z_]+\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-cache',
              cacheableResponse: {
                statuses: [0, 200]
              },
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 heures
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Bööh - Cartes de visite digitales',
        short_name: 'bööh',
        description: 'Créez des cartes de visite digitales élégantes et professionnelles pour partager vos informations de contact',
        theme_color: '#7c3aed',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icons/manifest-icon-192.maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icons/manifest-icon-512.maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    }),
    // Compression gzip et brotli
    compression({
      algorithms: ['gzip'],
      exclude: [/\.(br)$/, /\.(gz)$/],
      threshold: 10240
    }),
    compression({
      algorithms: ['brotliCompress'],
      exclude: [/\.(br)$/, /\.(gz)$/],
      threshold: 10240
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  css: {
    devSourcemap: mode === 'development',
    modules: {
      localsConvention: 'camelCase'
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@react-google-maps/api',
      'framer-motion',
      'lucide-react',
      '@tanstack/react-query',
      '@tanstack/react-query-persist-client',
      'date-fns',
      'date-fns/locale',
      'recharts',
      '@supabase/supabase-js',
      '@radix-ui/react-tabs',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-separator',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-slot',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-switch',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-label',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-accordion',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/primitive',
      '@dnd-kit/core',
      '@dnd-kit/utilities',
      '@dnd-kit/sortable',
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
      'zod',
      'react-hook-form',
      '@hookform/resolvers',
      'react-error-boundary',
      'html2canvas',
      'axios',
      'js-cookie'
    ],
    exclude: ['@dnd-kit/modifiers', 'qrcode.react', 'jspdf'],
    esbuildOptions: {
      target: 'esnext',
      // Forcer le traitement des dépendances circulaires
      legalComments: 'none'
    },
  },
  build: {
    sourcemap: mode === 'development',
    minify: mode === 'production' ? 'esbuild' : false,
    // Utiliser esbuild pour la minification car il gère mieux les dépendances circulaires
    // Alternativement, on peut utiliser terser avec des options plus conservatrices
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Fonction dynamique pour éviter les erreurs si un module n'est pas utilisé
          if (id.includes('node_modules')) {
            // React core - plus spécifique pour éviter de matcher @react-google-maps/api
            if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')) {
              return 'react-vendor';
            }
            // Radix UI
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            // Google Maps
            if (id.includes('@react-google-maps') || id.includes('react-google-maps') || id.includes('google.maps')) {
              return 'google-maps';
            }
            // Charts - Ne PAS séparer recharts dans un chunk séparé
            // Cela cause des problèmes d'initialisation avec les dépendances circulaires
            // Laisser recharts dans le bundle vendor par défaut
            // Animations
            if (id.includes('framer-motion') || id.includes('gsap')) {
              return 'animation-vendor';
            }
            // Forms
            if (id.includes('react-hook-form') || id.includes('@hookform/resolvers') || id.includes('zod')) {
              return 'form-vendor';
            }
            // Date
            if (id.includes('date-fns')) {
              return 'date-vendor';
            }
            // Icons
            if (id.includes('lucide-react')) {
              return 'icon-vendor';
            }
            // Supabase
            if (id.includes('@supabase/supabase-js')) {
              return 'supabase-vendor';
            }
          }
        },
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `js/[name]-[hash].js`;
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico|webp/i.test(ext)) {
            return `images/[name]-[hash].[ext]`;
          }
          if (/css/i.test(ext)) {
            return `css/[name]-[hash].[ext]`;
          }
          return `assets/[name]-[hash].[ext]`;
        }
      },
      input: path.resolve(__dirname, 'index.html')
    },
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    // Optimisations pour les performances
    target: 'esnext',
    assetsInlineLimit: 4096, // Inline les petits assets
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false // Désactiver pour accélérer le build
  },
  // Optimisations pour le développement
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
    logOverride: {
      'this-is-undefined-in-esm': 'silent',
    }
  }
}));
