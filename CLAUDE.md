# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Booh is a modern digital business card SaaS platform with enterprise admin capabilities. Users can create, manage, share digital business cards with real-time analytics, appointment booking, product management, reviews, geolocation, and advanced media integration.

**Tech Stack:**
- Frontend: React 18 + TypeScript + Vite
- Routing: React Router v6
- UI: shadcn/ui + Radix UI + Tailwind CSS
- State: React Query (TanStack Query) for server state
- Backend: Supabase (Auth, Database, Storage, RLS)
- Maps: Mapbox GL / MapLibre GL
- Animation: Framer Motion + GSAP
- Forms: React Hook Form + Zod validation
- Charts: Recharts + Tremor

## Commands

### Development
```bash
npm run dev          # Start dev server (port 8080)
npm run build        # Type-check and build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Build Scripts
```bash
./build-optimized.sh # Build with compression optimizations
```

### Database Migrations
Apply Supabase migrations from `supabase/migrations/` using the Supabase CLI or dashboard. Key migrations include:
- Admin tables setup
- Digital products storage
- Reviews and ratings
- RLS policies
- Geolocation support

## Architecture

### Routing & Pages (`src/pages/`)
React Router v6 configuration in `App.tsx` with lazy-loaded routes:
- **Public:** `/` (landing), `/card/:id` (public card view), `/auth`
- **Protected:** `/dashboard`, `/cards`, `/create-card`, `/cards/:id/edit`
- **Admin:** `/admin` (requires admin role check via `user_roles` table)
- **Features:** `/map`, `/contacts`, `/stock`, `/appointments`, `/orders`

### Authentication (`src/contexts/AuthContext.tsx`)
Centralized auth state using Supabase Auth:
- Session management with auto-refresh
- Role-based access (admin role stored in `user_roles` table)
- User metadata includes `full_name`

### Data Layer
**Supabase Integration** (`src/integrations/supabase/`):
- `client.ts`: Supabase client singleton
- `types.ts`: Auto-generated database types
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

**Services** (`src/services/`):
- `aiParsingService.ts`: AI-powered contact card parsing with Google Vision API
- `mediaService.ts`: Media upload/download with type validation
- `digitalProductService.ts`: Digital product CRUD operations
- `stockService.ts`: Inventory and stock management
- `vCardService.ts`: vCard import/export
- `imageUploadService.ts`: Image optimization and upload to Supabase Storage
- `preloadService.ts` / `cardPreloadService.ts`: Performance optimization with intelligent preloading

**React Query Configuration** (`App.tsx`):
- 5min stale time, 10min garbage collection
- Exponential backoff retry (max 3 attempts)
- No refetch on window focus (manual control)

### Components Architecture
**Layout System** (`src/components/layouts/`):
- `DashboardLayout`: Main authenticated layout with navigation

**Forms** (`src/components/forms/`):
- `ModernCardForm`: Unified form component for creating AND editing cards (see MIGRATION_GUIDE.md)
- Uses auto-save with `useAutoSave` hook (2s debounce, 3 retries, conflict resolution)
- Real-time validation with `useFormValidation`

**Business Card Rendering** (`src/components/`):
- `BusinessCard.tsx`: Core card display component
- `BusinessCardModern.tsx`: Enhanced card with media carousel, animations
- Multi-step form with progress tracking

**Admin Components** (`src/components/admin/`):
- `UserManagement`, `TemplateManagement`, `SystemMonitoring`
- `BusinessCardManagement`, `ThemesManagement`
- Real-time statistics using Supabase RPC functions

### Custom Hooks (`src/hooks/`)
- `useAutoSave.ts`: Debounced auto-save with retry and conflict resolution
- `useFormValidation.ts`: Real-time form validation with completion scoring
- `useMedia.ts`: Media handling (upload, delete, validation)
- `useOptimizedQuery.ts`: Performance-optimized React Query wrapper
- `usePremiumToast.ts`: Enhanced toast notifications
- `useImageOptimization.ts`: Client-side image optimization before upload

### State Management Pattern
- **Server state:** React Query (all Supabase data)
- **Auth state:** `AuthContext` provider
- **Theme state:** `ThemeContext` provider (dark/light mode)
- **Local state:** React hooks (useState, useReducer)
- **Client persistence:** Zustand (via `src/stores/cardStore.ts` for `selectedCardId` persisted in localStorage)

### Media & Storage
Supabase Storage buckets:
- `avatars`: User profile images
- `card-images`: Business card media
- `digital-products`: Digital product files
- `social-images`: Social media integration images

**Important:** All uploads go through `mediaService.ts` which handles:
- File type validation
- Size limits (5MB for images)
- WebP conversion for optimization
- Public URL generation
- RLS policy compliance

### Database Schema (Supabase)
Key tables:
- `business_cards`: Core card data with user_id, media_content JSONB, geolocation
- `user_roles`: Admin role management (role: 'admin' | 'user')
- `templates`: Card templates for reuse
- `card_views`: Analytics/view tracking
- `reviews`: Professional reviews with ratings
- `digital_products`: Digital product catalog with storage references
- `product_inquiries`: Customer inquiries for products
- `appointments`: Booking system
- `stock_items`: Inventory management
- `scanned_contacts`: OCR-parsed contact information
- `themes_party`: Custom theme configurations

**Row-Level Security (RLS):** Enabled on all tables. Users can only access their own data unless admin.

### Performance Optimizations
**Vite Build Configuration:**
- Manual chunking by vendor (react, ui, map, chart, animation, form, supabase)
- Terser minification with console.log removal in production
- Gzip + Brotli compression
- PWA with service worker and aggressive caching
- Image inlining < 4KB

**Runtime Optimizations:**
- `PerformanceOptimizer` component in `App.tsx` preloads popular cards after 3s
- `PreloadCleanup` utility removes unused preloads
- Lazy route loading with critical dependency preloading
- React Query caching (5min stale, 10min GC)

### Known Issues & Workarounds
See the numerous `.md` files in root for historical fixes:
- `STORAGE_PERMISSIONS_FIX.md`: Supabase storage RLS setup
- `RLS_POLICIES_FIX.md`: Row-level security policy corrections
- `DIGITAL_PRODUCTS_INTEGRATION.md`: Digital product feature implementation
- `MEDIA_INTEGRATION_GUIDE.md`: Media carousel and player setup
- `PERFORMANCE_GUIDE.md`: Performance optimization strategies

Many of these issues have been resolved but docs remain for reference.

## Development Patterns

### Adding a New Feature
1. Create types in `src/types/` if needed
2. Add service in `src/services/` for data operations
3. Create React Query hooks in component or custom hook
4. Build UI components in `src/components/`
5. Add routes in `App.tsx` with lazy loading
6. Run migrations for new DB tables/columns

### Working with Supabase
- Always use the `supabase` client from `src/integrations/supabase/client.ts`
- Check RLS policies before querying data
- Use React Query for all data fetching
- Type safety: import types from `src/integrations/supabase/types.ts`

### Form Best Practices
- Use `ModernCardForm` component for card creation/editing
- Leverage `useAutoSave` for draft persistence
- Validate with `useFormValidation` or Zod schemas
- Media uploads: use `mediaService.uploadImage()` or `mediaService.uploadMedia()`

### Styling Conventions
- Tailwind CSS utility-first approach
- Theme variables: `bg-theme-background`, `text-theme-text`
- shadcn/ui components in `src/components/ui/`
- Animations: Framer Motion for page transitions, GSAP for complex sequences
- Glassmorphism design pattern for premium feel (see `PREMIUM_GLASSMORPHISM_DESIGN.md`)

### Admin Development
- Admin access checked via `user_roles` table query
- Admin role: `{ role: 'admin', user_id: <uuid> }`
- Protected routes redirect non-admins
- Use Tremor charts for analytics dashboards

## Testing & Debugging

### Debug Routes
- `/debug/storage`: Test Supabase Storage functionality
- `/debug/map-filters`: Test map filtering logic

### Common Issues
1. **Storage upload fails:** Check RLS policies on storage buckets
2. **Authentication loop:** Clear Supabase session from localStorage
3. **Type errors:** Regenerate types from Supabase dashboard
4. **Build size too large:** Check manual chunk configuration in `vite.config.ts`
5. **Media not loading:** Verify public bucket policies and CORS settings

### Console Logging
Production builds remove console.log automatically via Terser. Use `console.error` for persistent logs.

## Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_MAPBOX_TOKEN=<your-mapbox-token>
VITE_GOOGLE_VISION_API=<google-vision-api-key>  # For AI card parsing
```

## Deployment

Configured for Vercel (see `vercel.json`):
- Redirects all routes to `/index.html` for SPA
- PWA manifest at `/manifest.json`
- Icons in `/public/icons/`

Build output optimized with compression and chunking for fast initial load.
