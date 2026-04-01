import React, { Suspense, useEffect } from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from "@/components/ui/error-fallback";
import { PageLoading } from "@/components/ui/loading";
import { Toaster } from "@/components/ui/toaster";
import { MapLoadingSkeleton } from "@/components/map/EnhancedSkeletonLoader";
// Lazy load splash screen pour ne pas bloquer le rendu initial
const AnimatedSplashScreen = React.lazy(() => import('./components/AnimatedSplashScreen'));
import { useAuth } from '@/contexts/AuthContext';
import { preloadCleanupService } from '@/services/cache/preloadCleanupService';
import { initializeSupabaseStorage } from '@/utils/supabaseStorage';
import { cardCacheService } from '@/services/cache/cardCacheService';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { FeatureProtectedRoute } from '@/components/auth/FeatureProtectedRoute';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { SpeedInsights } from '@vercel/speed-insights/react';

// Lazy imports avec préchargement optimisé
// Landing Awwwards v2 (Hero + scrollytelling)
const AwwardsLevelLanding = React.lazy(() => import('./pages/AwwardsLevelLanding'))
const PureAwwardsLanding = React.lazy(() => import('./pages/PureAwwardsLanding'))
const Dashboard = React.lazy(() => import('./pages/Dashboard'))
const PricingNew = React.lazy(() => import('./pages/PricingNew'))
const Cards = React.lazy(() => import('./pages/Cards'))
const CreateCard = React.lazy(() => import('./pages/CreateCard'))
const EditCard = React.lazy(() => import('./pages/EditCard'))
const CardSettings = React.lazy(() => import('./pages/CardSettings'))

// Pages de cartes avec préchargement prioritaire
const ViewCard = React.lazy(() =>
  import('./pages/ViewCard').then(module => {
    // Précharger les dépendances critiques
    import('./components/BusinessCard');
    import('./components/ViewCardActions');
    return module;
  })
)

const CardView = React.lazy(() => import('./pages/CardView'))

const PublicCardView = React.lazy(() =>
  import('./pages/PublicCardView').then(module => {
    // Précharger les dépendances critiques
    import('./components/BusinessCard');
    import('./components/PublicCardActions');
    import('./components/reviews/RatingDisplay');
    return module;
  })
)
// Flyover UI: single fetch + OwnerHUD (panels sans navigation)
const CardController = React.lazy(() => import('./pages/CardController'))

// Payment pages
const PaymentCallback = React.lazy(() => import('./pages/PaymentCallback'))

// Marketplace pages
const Marketplace = React.lazy(() => import('./pages/Marketplace'))
const ProductDetail = React.lazy(() => import('./pages/ProductDetail'))
const Checkout = React.lazy(() => import('./pages/Checkout'))
const MyPurchases = React.lazy(() => import('./pages/MyPurchases'))
const Download = React.lazy(() => import('./pages/Download'))

const Settings = React.lazy(() => import('./pages/Settings'))
const Stats = React.lazy(() => import('./pages/Stats'))
const Orders = React.lazy(() => import('./pages/Orders'))
const Appointments = React.lazy(() => import('./pages/Appointments'))
// ProductManager now redirects to UnifiedProductManager (deprecated aliases in place)
const ProductManager = React.lazy(() => import('./pages/ProductManager'))
const QrCode = React.lazy(() => import('./pages/QrCode'))
// Lazy load MapView - NE PAS précharger Mapbox (économie 980KB)
const MapView = React.lazy(() =>
  import(/* webpackChunkName: "map-view", webpackPrefetch: false */ './pages/MapView')
)
// Admin pages - Code split en sous-modules pour réduire bundle (412KB → ~150KB)
const Admin = React.lazy(() => import(/* webpackChunkName: "admin-main" */ './pages/Admin'))
const UserProfile = React.lazy(() => import(/* webpackChunkName: "admin-user" */ './pages/admin/UserProfile'))
const UserEdit = React.lazy(() => import(/* webpackChunkName: "admin-user" */ './pages/admin/UserEdit'))
const Auth = React.lazy(() => import('./pages/Auth'))
const NotFound = React.lazy(() => import('./pages/NotFound'))
const Profile = React.lazy(() => import('./pages/Profile'))
const Contacts = React.lazy(() => import('./pages/Contacts'))
const ContactCRMDetail = React.lazy(() => import('./pages/ContactCRMDetail'))
const Stock = React.lazy(() => import('./pages/Stock'))
const Facture = React.lazy(() => import('./pages/Facture'))
const TestEmail = React.lazy(() => import('./pages/TestEmail'))
const Contact = React.lazy(() => import('./pages/Contact'))
const FAQ = React.lazy(() => import('./pages/FAQ'))
const Privacy = React.lazy(() => import('./pages/Privacy'))
const Terms = React.lazy(() => import('./pages/Terms'))
const Legal = React.lazy(() => import('./pages/Legal'))
const AppointmentManager = React.lazy(() => import('./pages/AppointmentManager'))
const AppointmentSettings = React.lazy(() => import('./pages/AppointmentSettings'))
const Blog = React.lazy(() => import('./pages/Blog'))
const Article = React.lazy(() => import('./pages/Article'))
const StorageTest = React.lazy(() => import('./components/debug/StorageTest'))
const CalendarDownload = React.lazy(() => import('./pages/CalendarDownload'))
const MapFiltersTest = React.lazy(() => import('./components/debug/MapFiltersTest'))
const PortfolioView = React.lazy(() => import('./pages/PortfolioView'))

// Events Pages - BOOH Events Module (Phase 1 & 2)
const EventsList = React.lazy(() => import('./pages/EventsList'))
const EventCreate = React.lazy(() => import('./pages/EventCreate'))
const EventDetail = React.lazy(() => import('./pages/EventDetail'))
const PublicEventDetail = React.lazy(() => import('./pages/PublicEventDetail'))
const EventEdit = React.lazy(() => import('./pages/EventEdit'))
const TicketValidation = React.lazy(() => import('./pages/TicketValidation'))
const LiveEvent = React.lazy(() => import('./pages/LiveEvent'))
const EventAttendees = React.lazy(() => import('./pages/EventAttendees'))
const EventAnalytics = React.lazy(() => import('./pages/EventAnalytics'))
const EventsListByCard = React.lazy(() => import('./pages/cards/[id]/events/index'))
const ProjectDetail = React.lazy(() => import('./pages/ProjectDetail'))
const ProjectsList = React.lazy(() => import('./pages/portfolio/ProjectsList'))
const ProjectEdit = React.lazy(() => import('./pages/portfolio/ProjectEdit'))
const QuotesList = React.lazy(() => import('./pages/portfolio/QuotesList'))
const QuoteTemplatesPage = React.lazy(() => import('./pages/portfolio/QuoteTemplatesPage'))
const PublicQuoteView = React.lazy(() => import('./pages/PublicQuoteView'))
const PortfolioSettings = React.lazy(() => import('./pages/portfolio/PortfolioSettings'))
const PortfolioServicesSettings = React.lazy(() => import('./pages/portfolio/PortfolioServicesSettings'))
const SubscriptionManagement = React.lazy(() => import('./pages/SubscriptionManagement'))
const Features = React.lazy(() => import('./pages/Features'))
const Solutions = React.lazy(() => import('./pages/Solutions'))
const About = React.lazy(() => import('./pages/About'))
const Help = React.lazy(() => import('./pages/Help'))
const GettingStarted = React.lazy(() => import('./pages/GettingStarted'))
const DocsCards = React.lazy(() => import('./pages/docs/Cards'))
const DocsCRM = React.lazy(() => import('./pages/docs/CRM'))
const DocsStock = React.lazy(() => import('./pages/docs/Stock'))
const DocsDRM = React.lazy(() => import('./pages/docs/DRM'))
const DocsMarketplace = React.lazy(() => import('./pages/docs/Marketplace'))
const DocsBilling = React.lazy(() => import('./pages/docs/Billing'))
const DocsTeam = React.lazy(() => import('./pages/docs/Team'))

import { boohPayService } from '@/services/boohPayService';
import { BoohPayMerchantService } from '@/services/boohPayMerchantService';

// Composant pour les optimisations de performance avec IndexedDB
// Composant pour les optimisations de performance avec IndexedDB
const PerformanceOptimizer: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Initialiser BoohPay Service de manière dynamique pour l'utilisateur connecté
    const initBoohPay = async () => {
      // Configuration de base par défaut (pour l'URL)
      boohPayService.initialize({
        baseUrl: import.meta.env.VITE_BOOHPAY_API_URL || 'http://localhost:3000',
        apiKey: import.meta.env.VITE_BOOHPAY_API_KEY || '', // Clé vide par défaut, sera remplacée par celle de l'utilisateur
      });

      if (user?.id) {
        try {
          // Tente de récupérer et configurer la clé API spécifique au merchant de cet utilisateur
          await BoohPayMerchantService.initializeBoohPayForUser(user.id);
        } catch (error) {
          console.error("Erreur lors de l'initialisation de BoohPay pour l'utilisateur:", error);
        }
      }
    };

    initBoohPay();

    // Initialiser le service de nettoyage unifié
    preloadCleanupService.initialize();

    // Initialiser le storage Supabase
    initializeSupabaseStorage();

    // Optimisations avec le service de cache unifié
    const initOptimizations = async () => {
      try {
        // Nettoyer le cache expiré au démarrage
        await cardCacheService.cleanExpiredCache();

        // Précharger les cartes populaires après 3 secondes
        setTimeout(() => {
          cardCacheService.preloadPopularCards();
        }, 3000);

        // Enhanced performance optimizations enabled
      } catch (error) {
        // Error initializing optimizations
      }
    };

    initOptimizations();

    // Nettoyer à la fermeture
    return () => {
      preloadCleanupService.destroy();
    };
  }, [user?.id]);

  return null;
};

const App = () => {
  // Splash screen désactivé pour un chargement plus rapide
  const [showSplash] = React.useState(false);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {/* Google Analytics - Initialize and track page views */}
      <GoogleAnalytics />
      {/* Vercel Speed Insights - Track Core Web Vitals */}
      <SpeedInsights />

      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <div className="min-h-screen bg-theme-background text-theme-text" style={{ height: 'auto' }}>
              <Toaster />

              {/* Splash screen différé pour ne pas bloquer le rendu */}
              {showSplash && (
                <Suspense fallback={null}>
                  <AnimatedSplashScreen />
                </Suspense>
              )}

              {/* Optimiseur de performance */}
              <PerformanceOptimizer />

              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <Suspense fallback={<PageLoading />}>
                  <Routes>
                    {/* Landing Page - Awwwards Level */}
                    <Route path="/" element={<AwwardsLevelLanding />} />
                    <Route path="/landing-v1" element={<PureAwwardsLanding />} />
                    <Route path="/features" element={<Features />} />
                    <Route path="/solutions" element={<Solutions />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/help" element={<Help />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/map" element={
                      <Suspense fallback={
                        <div className="h-screen w-screen relative bg-[#f8f9fa]">
                          <MapLoadingSkeleton />
                        </div>
                      }>
                        <MapView />
                      </Suspense>
                    } />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/legal" element={<Legal />} />
                    <Route path="/pricing" element={<PricingNew />} />
                    <Route path="/pricing-new" element={<PricingNew />} />
                    <Route path="/getting-started" element={<GettingStarted />} />
                    <Route path="/docs/cards" element={<DocsCards />} />
                    <Route path="/docs/crm" element={<DocsCRM />} />
                    <Route path="/docs/stock" element={<DocsStock />} />
                    <Route path="/docs/drm" element={<DocsDRM />} />
                    <Route path="/docs/marketplace" element={<DocsMarketplace />} />
                    <Route path="/docs/billing" element={<DocsBilling />} />
                    <Route path="/docs/team" element={<DocsTeam />} />

                    {/* Auth */}
                    <Route path="/auth" element={<Auth />} />

                    {/* Dashboard & Main Features - Protected */}
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/cards" element={<ProtectedRoute><Cards /></ProtectedRoute>} />
                    <Route path="/create-card" element={<ProtectedRoute><CreateCard /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

                    {/* CRM - MAGIC only */}
                    <Route path="/contacts" element={<ProtectedRoute><FeatureProtectedRoute feature="hasCRM"><Contacts /></FeatureProtectedRoute></ProtectedRoute>} />
                    <Route path="/contacts/:contactId/crm" element={<ProtectedRoute><FeatureProtectedRoute feature="hasCRM"><ContactCRMDetail /></FeatureProtectedRoute></ProtectedRoute>} />

                    {/* Stock Management - BUSINESS + MAGIC */}
                    <Route path="/stock" element={<ProtectedRoute><FeatureProtectedRoute feature="hasStockManagement"><Stock /></FeatureProtectedRoute></ProtectedRoute>} />

                    {/* Invoicing - BUSINESS + MAGIC */}
                    <Route path="/facture" element={<ProtectedRoute><FeatureProtectedRoute feature="hasInvoicing"><Facture /></FeatureProtectedRoute></ProtectedRoute>} />

                    {/* Card Management - Protected */}
                    <Route path="/cards/:id/edit" element={<ProtectedRoute><EditCard /></ProtectedRoute>} />
                    <Route path="/cards/:id/view" element={<ProtectedRoute><ViewCard /></ProtectedRoute>} />
                    <Route path="/card-view" element={<ProtectedRoute><CardView /></ProtectedRoute>} />
                    <Route path="/cards/:id/qr" element={<ProtectedRoute><QrCode /></ProtectedRoute>} />
                    <Route path="/cards/:id/settings" element={<ProtectedRoute><CardSettings /></ProtectedRoute>} />

                    {/* E-commerce Routes - BUSINESS + MAGIC */}
                    <Route path="/cards/:id/products" element={<ProtectedRoute><FeatureProtectedRoute feature="hasEcommerce"><ProductManager /></FeatureProtectedRoute></ProtectedRoute>} />
                    <Route path="/cards/:id/digital-products" element={<ProtectedRoute><FeatureProtectedRoute feature="hasEcommerce"><ProductManager /></FeatureProtectedRoute></ProtectedRoute>} />
                    <Route path="/cards/:id/orders" element={<ProtectedRoute><FeatureProtectedRoute feature="hasEcommerce"><Orders /></FeatureProtectedRoute></ProtectedRoute>} />

                    {/* Appointments Routes - BUSINESS + MAGIC */}
                    <Route path="/cards/:id/appointments" element={<ProtectedRoute><FeatureProtectedRoute feature="hasAppointments"><Appointments /></FeatureProtectedRoute></ProtectedRoute>} />
                    <Route path="/cards/:id/appointment-manager" element={<ProtectedRoute><FeatureProtectedRoute feature="hasAppointments"><AppointmentManager /></FeatureProtectedRoute></ProtectedRoute>} />
                    <Route path="/cards/:id/appointment-settings" element={<ProtectedRoute><FeatureProtectedRoute feature="hasAppointments"><AppointmentSettings /></FeatureProtectedRoute></ProtectedRoute>} />

                    {/* Stats - Available for all */}
                    <Route path="/cards/:id/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />

                    {/* Theme Customization - BUSINESS + MAGIC */}
                    <Route path="/cards/:id/theme" element={<ProtectedRoute><FeatureProtectedRoute feature="customThemes"><EditCard /></FeatureProtectedRoute></ProtectedRoute>} />

                    {/* Interactive Map - BUSINESS + MAGIC */}
                    <Route path="/cards/:id/map" element={
                      <ProtectedRoute>
                        <FeatureProtectedRoute feature="hasMap">
                          <Suspense fallback={
                            <div className="h-screen w-screen relative bg-[#f8f9fa]">
                              <MapLoadingSkeleton />
                            </div>
                          }>
                            <MapView />
                          </Suspense>
                        </FeatureProtectedRoute>
                      </ProtectedRoute>
                    } />

                    {/* Public Card View (CardController = Flyover UI + OwnerHUD) */}
                    <Route path="/card/:id" element={<CardController />} />
                    <Route path="/card/:id/portfolio" element={<PortfolioView />} />
                    <Route path="/card/:id/portfolio/project/:projectId" element={<ProjectDetail />} />

                    {/* Marketplace Routes */}
                    <Route path="/card/:id/marketplace" element={<Marketplace />} />
                    <Route path="/card/:id/marketplace/product/:productId" element={<ProductDetail />} />
                    <Route path="/card/:id/events" element={<Suspense fallback={<div>Loading...</div>}><EventsListByCard /></Suspense>} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/my-purchases" element={<ProtectedRoute><MyPurchases /></ProtectedRoute>} />

                    {/* DRM Secure Download - Public with token validation */}
                    <Route path="/download/:token" element={<Download />} />
                    {/* Devis public - consultation et acceptation par le client */}
                    <Route path="/quote/:token" element={<PublicQuoteView />} />

                    {/* Payment routes - Protected */}
                    <Route path="/payment/callback" element={<ProtectedRoute><PaymentCallback /></ProtectedRoute>} />
                    <Route path="/payment-callback" element={<PaymentCallback />} />

                    {/* Portfolio Dashboard Routes - BUSINESS + MAGIC */}
                    <Route path="/portfolio/projects" element={<ProtectedRoute><FeatureProtectedRoute feature="hasPortfolio"><ProjectsList /></FeatureProtectedRoute></ProtectedRoute>} />
                    <Route path="/portfolio/projects/new" element={<ProtectedRoute><FeatureProtectedRoute feature="hasPortfolio"><ProjectEdit /></FeatureProtectedRoute></ProtectedRoute>} />
                    <Route path="/portfolio/projects/:id/edit" element={<ProtectedRoute><FeatureProtectedRoute feature="hasPortfolio"><ProjectEdit /></FeatureProtectedRoute></ProtectedRoute>} />
                    <Route path="/portfolio/quotes" element={<ProtectedRoute><FeatureProtectedRoute feature="hasPortfolio"><QuotesList /></FeatureProtectedRoute></ProtectedRoute>} />
                    <Route path="/portfolio/quotes/templates" element={<ProtectedRoute><FeatureProtectedRoute feature="hasPortfolio"><QuoteTemplatesPage /></FeatureProtectedRoute></ProtectedRoute>} />
                    <Route path="/portfolio/settings" element={<ProtectedRoute><FeatureProtectedRoute feature="hasPortfolio"><PortfolioSettings /></FeatureProtectedRoute></ProtectedRoute>} />
                    <Route path="/portfolio/services" element={<ProtectedRoute><FeatureProtectedRoute feature="hasPortfolio"><PortfolioServicesSettings /></FeatureProtectedRoute></ProtectedRoute>} />

                    {/* BOOH Events Module - BUSINESS + MAGIC + Phase 2 Live */}
                    <Route path="/events" element={<EventsList />} />
                    <Route path="/events/create" element={<ProtectedRoute><EventCreate /></ProtectedRoute>} />
                    {/* Public event detail (uses unified V2 design) */}
                    <Route path="/events/:id" element={<EventDetail />} />
                    {/* Protected event detail with management (for organizers) - SAME COMPONENT */}
                    <Route path="/events/:id/manage" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
                    <Route path="/events/:id/edit" element={<ProtectedRoute><EventEdit /></ProtectedRoute>} />
                    <Route path="/events/:id/live" element={<LiveEvent />} />
                    <Route path="/events/:id/attendees" element={<ProtectedRoute><EventAttendees /></ProtectedRoute>} />
                    <Route path="/events/:id/analytics" element={<ProtectedRoute><EventAnalytics /></ProtectedRoute>} />
                    <Route path="/events/:id/validate" element={<ProtectedRoute><TicketValidation /></ProtectedRoute>} />

                    {/* Features */}
                    <Route path="/article/:slug" element={<Article />} />
                    <Route path="/subscription" element={<ProtectedRoute><SubscriptionManagement /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                    <Route path="/admin/users/:userId" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                    <Route path="/admin/users/:userId/edit" element={<ProtectedRoute><UserEdit /></ProtectedRoute>} />
                    <Route path="/faq" element={<FAQ />} />

                    {/* Debug - dev uniquement (masqué en production) */}
                    {import.meta.env.DEV && (
                      <>
                        <Route path="/debug/storage" element={<ProtectedRoute><StorageTest /></ProtectedRoute>} />
                        <Route path="/debug/map-filters" element={<ProtectedRoute><MapFiltersTest /></ProtectedRoute>} />
                        <Route path="/debug/test-email" element={<ProtectedRoute><TestEmail /></ProtectedRoute>} />
                      </>
                    )}

                    {/* Calendar Download - Public for email links */}
                    <Route path="/calendar/download" element={<CalendarDownload />} />

                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </div>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
