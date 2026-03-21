/**
 * Feature-based Route Groups pour optimiser le code splitting
 * Chaque groupe charge ses dépendances de manière isolée
 */

import React from 'react';

// ============================================
// CORE ROUTES (Chargées en priorité)
// ============================================
export const coreRoutes = {
  Index: React.lazy(() => import('../pages/Index')),
  Auth: React.lazy(() => import('../pages/Auth')),
  NotFound: React.lazy(() => import('../pages/NotFound')),
} as const;

// ============================================
// DASHBOARD ROUTES (User workspace)
// ============================================
export const dashboardRoutes = {
  Dashboard: React.lazy(() => import('../pages/Dashboard')),
  Profile: React.lazy(() => import('../pages/Profile')),
  Settings: React.lazy(() => import('../pages/Settings')),
} as const;

// ============================================
// CARD ROUTES (Business cards management)
// ============================================
export const cardRoutes = {
  Cards: React.lazy(() => import('../pages/Cards')),
  CreateCard: React.lazy(() => import('../pages/CreateCard')),
  EditCard: React.lazy(() => import('../pages/EditCard')),
  ViewCard: React.lazy(() => import('../pages/ViewCard')),
  CardView: React.lazy(() => import('../pages/CardView')),
  PublicCardView: React.lazy(() => import(/* webpackChunkName: "public-card" */ '../pages/PublicCardView')),
  QrCode: React.lazy(() => import('../pages/QrCode')),
} as const;

// ============================================
// ECOMMERCE ROUTES (Marketplace & Products)
// ============================================
export const ecommerceRoutes = {
  Marketplace: React.lazy(() => import('../pages/Marketplace')),
  ProductDetail: React.lazy(() => import('../pages/ProductDetail')),
  Checkout: React.lazy(() => import('../pages/Checkout')),
  MyPurchases: React.lazy(() => import('../pages/MyPurchases')),
  Orders: React.lazy(() => import('../pages/Orders')),
  OrderManager: React.lazy(() => import('../pages/OrderManager')),
} as const;

// ============================================
// PRODUCT MANAGEMENT ROUTES
// ============================================
export const productManagementRoutes = {
  ProductManager: React.lazy(() => import('../pages/ProductManager')),
  DigitalProductManager: React.lazy(() => import('../pages/DigitalProductManager')),
  UnifiedProductManager: React.lazy(() => import('../pages/UnifiedProductManager')),
  Stock: React.lazy(() => import('../pages/Stock')),
} as const;

// ============================================
// PORTFOLIO ROUTES (Services & Projects)
// ============================================
export const portfolioRoutes = {
  PortfolioView: React.lazy(() => import('../pages/PortfolioView')),
  ProjectsList: React.lazy(() => import('../pages/portfolio/ProjectsList')),
  // ProjectDetail: React.lazy(() => import('../pages/portfolio/ProjectDetail')),
  ProjectEdit: React.lazy(() => import('../pages/portfolio/ProjectEdit')),
  QuotesList: React.lazy(() => import('../pages/portfolio/QuotesList')),
  PortfolioSettings: React.lazy(() => import('../pages/portfolio/PortfolioSettings')),
  PortfolioServicesSettings: React.lazy(() => import('../pages/portfolio/PortfolioServicesSettings')),
} as const;

// ============================================
// BUSINESS TOOLS ROUTES (CRM, Appointments, etc)
// ============================================
export const businessToolsRoutes = {
  Contacts: React.lazy(() => import('../pages/Contacts')),
  Appointments: React.lazy(() => import('../pages/Appointments')),
  AppointmentManager: React.lazy(() => import('../pages/AppointmentManager')),
  Facture: React.lazy(() => import('../pages/Facture')),
  Stats: React.lazy(() => import('../pages/Stats')),
} as const;

// ============================================
// MAP ROUTES (Heavy - Mapbox 980KB)
// ============================================
export const mapRoutes = {
  MapView: React.lazy(() => 
    import(/* webpackChunkName: "map-view", webpackPrefetch: false */ '../pages/MapView')
  ),
  // MapFiltersTest: React.lazy(() => import('../pages/MapFiltersTest')),
} as const;

// ============================================
// ADMIN ROUTES (Admin panel - 412KB)
// ============================================
export const adminRoutes = {
  Admin: React.lazy(() => import(/* webpackChunkName: "admin-main" */ '../pages/Admin')),
  UserProfile: React.lazy(() => import(/* webpackChunkName: "admin-user" */ '../pages/admin/UserProfile')),
  UserEdit: React.lazy(() => import(/* webpackChunkName: "admin-user" */ '../pages/admin/UserEdit')),
  PaymentManager: React.lazy(() => import('../pages/admin/PaymentManager')),
} as const;

// ============================================
// OTHER ROUTES
// ============================================
export const otherRoutes = {
  Themes: React.lazy(() => import('../pages/Themes')),
  Blog: React.lazy(() => import('../pages/Blog')),
  Article: React.lazy(() => import('../pages/Article')),
  PaymentCallback: React.lazy(() => import('../pages/PaymentCallback')),
  SubscriptionManagement: React.lazy(() => import('../pages/SubscriptionManagement')),
  Pricing: React.lazy(() => import('../pages/Pricing')),
  PricingNew: React.lazy(() => import('../pages/PricingNew')),
  FAQ: React.lazy(() => import('../pages/FAQ')),
} as const;

// ============================================
// ALL ROUTES COMBINED (for easy import)
// ============================================
export const allRoutes = {
  ...coreRoutes,
  ...dashboardRoutes,
  ...cardRoutes,
  ...ecommerceRoutes,
  ...productManagementRoutes,
  ...portfolioRoutes,
  ...businessToolsRoutes,
  ...mapRoutes,
  ...adminRoutes,
  ...otherRoutes,
} as const;

/**
 * Précharge les routes d'une feature spécifique
 * Utile pour améliorer l'UX lors de la navigation
 */
export const preloadFeature = async (featureName: keyof typeof allRoutes) => {
  try {
    const route = allRoutes[featureName];
    if (route) {
      // Précharge le composant (déclenche le lazy load)
      await (route as any).preload?.();
    }
  } catch (error) {
    // Silently fail - le composant sera chargé normalement lors de l'accès
  }
};

/**
 * Statistiques de bundle par feature (estimées)
 */
export const FEATURE_BUNDLE_STATS = {
  core: '~500KB',
  dashboard: '~300KB',
  cards: '~400KB',
  ecommerce: '~600KB',
  productManagement: '~500KB',
  portfolio: '~550KB',
  businessTools: '~700KB',
  map: '~980KB', // Le plus lourd !
  admin: '~412KB',
  other: '~400KB',
} as const;

