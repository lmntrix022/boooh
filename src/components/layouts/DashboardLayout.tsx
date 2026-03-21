import React, { useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCardStore } from "@/stores/cardStore";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  CreditCard,
  User,
  Users,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Home,
  File,
  Globe,
  Bell,
  Palette,
  Store,
  ChevronLeft,
  ChevronRight,
  Map,
  ShoppingCart,
  Calendar,
  BarChart3,
  QrCode,
  Briefcase
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CurrencySelector } from '@/components/settings/CurrencySelector';
import { LanguageSelector } from '@/components/settings/LanguageSelector';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import CardSelector from "@/components/dashboard/CardSelector";
import { Tables } from "@/integrations/supabase/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSubscription } from "@/hooks/useSubscription";
import { useLogout } from "@/hooks/useLogout";
import { useUserCards } from "@/hooks/useUserCards";
import { useLanguage } from "@/hooks/useLanguage";

type BusinessCard = Tables<"business_cards">;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const NOTIFICATION_SETTINGS_KEY = 'app_notification_settings';
const APPEARANCE_SETTINGS_KEY = 'app_appearance_settings';

interface NotificationSettings {
  emailNotifications: boolean;
  appointmentReminders: boolean;
  orderNotifications: boolean;
  marketingEmails: boolean;
}

interface AppearanceSettings {
  darkMode: boolean;
  compactMode: boolean;
  animationsEnabled: boolean;
}

/** True when the app is rendered inside an iframe (e.g. Flyover drawer). */
function useIsEmbedFrame(): boolean {
  const [isEmbed, setIsEmbed] = useState(false);
  React.useEffect(() => {
    // Détecte si la page est affichée dans un iframe (ex. Flyover drawer)
    setIsEmbed(typeof window !== 'undefined' && window.self !== window.top);
  }, []);
  return isEmbed;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isEmbedFrame = useIsEmbedFrame();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const queryClient = useQueryClient();
  const { hasFeature, planType, isLoading: subscriptionLoading } = useSubscription();
  const handleSignOut = useLogout();
  const { t } = useLanguage();

  // Utiliser le store Zustand pour la carte sélectionnée
  const { selectedCardId, setSelectedCardId } = useCardStore();

  // Fetch user's business cards avec le hook réutilisable
  const { cards = [] } = useUserCards();

  // Stabilize cards array to prevent infinite re-renders
  const stableCards = React.useMemo(() => cards, [cards.length, cards.map(c => c.id).join(',')]);
  
  // Get first card ID once
  const firstCardId = React.useMemo(() => stableCards[0]?.id || null, [stableCards.length > 0 ? stableCards[0]?.id : null]);

  // Auto-select first card if none selected (only once, using ref to prevent re-runs)
  const hasAutoSelectedRef = React.useRef(false);
  const lastCardsLengthRef = React.useRef(stableCards.length);
  
  React.useEffect(() => {
    // Only run if cards actually changed (length or first card ID)
    const cardsChanged = lastCardsLengthRef.current !== stableCards.length;
    lastCardsLengthRef.current = stableCards.length;
    
    if (stableCards.length > 0 && firstCardId && !selectedCardId && !hasAutoSelectedRef.current) {
      setSelectedCardId(firstCardId);
      hasAutoSelectedRef.current = true;
    }
    
    // Reset flag if cards are cleared
    if (stableCards.length === 0) {
      hasAutoSelectedRef.current = false;
    }
  }, [firstCardId, selectedCardId, setSelectedCardId]);

  // État pour les notifications
  const [notificationSettings, setNotificationSettings] = React.useState<NotificationSettings>(() => {
    const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    return stored ? JSON.parse(stored) : {
      emailNotifications: true,
      appointmentReminders: true,
      orderNotifications: true,
      marketingEmails: false
    };
  });

  // État pour l'apparence
  const [appearanceSettings, setAppearanceSettings] = React.useState<AppearanceSettings>(() => {
    const stored = localStorage.getItem(APPEARANCE_SETTINGS_KEY);
    return stored ? JSON.parse(stored) : {
      darkMode: false,
      compactMode: false,
      animationsEnabled: true
    };
  });

  // Gestionnaire de changement pour les notifications
  const handleNotificationChange = (key: keyof NotificationSettings) => {
    const newSettings = {
      ...notificationSettings,
      [key]: !notificationSettings[key]
    };
    setNotificationSettings(newSettings);
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(newSettings));
  };

  // Gestionnaire de changement pour l'apparence
  const handleAppearanceChange = (key: keyof AppearanceSettings) => {
    const newSettings = {
      ...appearanceSettings,
      [key]: !appearanceSettings[key]
    };
    setAppearanceSettings(newSettings);
    localStorage.setItem(APPEARANCE_SETTINGS_KEY, JSON.stringify(newSettings));
  };

  const { data: isAdmin } = useQuery({
    queryKey: ['isAdmin', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      if (error) {
        // Error log removed
        return false;
      }
      return !!data;
    }
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const userName = user?.user_metadata?.full_name || user?.email || "";
  const userInitials = userName ? getInitials(userName) : "U";

  const allNavigationItems = [
    {
      title: t('dashboard.navigation.dashboard'),
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: "/dashboard",
      active: location.pathname === "/dashboard",
      // Pas de feature = toujours visible
    },
    {
      title: t('dashboard.navigation.portfolio'),
      icon: <Briefcase className="h-5 w-5" />,
      href: "/portfolio/projects",
      active: location.pathname.startsWith("/portfolio"),
      feature: 'hasPortfolio' as const, // CONNEXIONS/COMMERCE/OPERE
    },
    {
      title: 'Events',
      icon: <Calendar className="h-5 w-5" />,
      href: "/events",
      active: location.pathname.startsWith("/events"),
      // Pas de feature = accessible à tous (public browsing)
      // Création protégée au niveau de la route
    },
    {
      title: t('dashboard.navigation.contacts'),
      icon: <Users className="h-5 w-5" />,
      href: "/contacts",
      active: location.pathname === "/contacts",
      feature: 'hasCRM' as const, // CONNEXIONS/COMMERCE/OPERE
    },
    {
      title: t('dashboard.navigation.stock'),
      icon: <Package className="h-5 w-5" />,
      href: "/stock",
      active: location.pathname === "/stock",
      feature: 'hasStockManagement' as const, // COMMERCE/OPERE
    },
    {
      title: t('dashboard.navigation.invoice'),
      icon: <File className="h-5 w-5" />,
      href: "/facture",
      active: location.pathname === "/facture",
      feature: 'hasInvoicing' as const, // CONNEXIONS/COMMERCE/OPERE
    },
    {
      title: t('dashboard.navigation.profile'),
      icon: <User className="h-5 w-5" />,
      href: "/profile",
      active: location.pathname === "/profile",
      // Pas de feature = toujours visible
    },
    {
      title: t('dashboard.navigation.subscription'),
      icon: <CreditCard className="h-5 w-5" />,
      href: "/subscription",
      active: location.pathname === "/subscription",
      // Toujours visible pour tous les utilisateurs
    },
    {
      title: t('dashboard.navigation.settings'),
      icon: <Settings className="h-5 w-5" />,
      href: "/settings",
      active: location.pathname === "/settings",
      // Toujours visible pour tous les utilisateurs
    },
    ...(isAdmin ? [{
      title: t('dashboard.navigation.admin'),
      icon: <Settings className="h-5 w-5" />,
      href: "/admin",
      active: location.pathname === "/admin",
      // Admin toujours visible pour les admins
    }] : []),
  ];

  // Filtrer la navigation principale selon le plan
  const navigationItems = subscriptionLoading
    ? [] // Pendant le chargement, ne rien afficher
    : allNavigationItems.filter(item => {
        if (!('feature' in item) || !item.feature) {
          return true; // Toujours visible si pas de feature
        }
        return hasFeature(item.feature);
      });

  // Navigation spécifique à une carte sélectionnée (AVEC FILTRAGE PAR PLAN)
  const allCardNavigationItems = selectedCardId ? [
    {
      title: t('dashboard.navigation.editCard'),
      icon: <Palette className="h-5 w-5" />,
      href: `/cards/${selectedCardId}/edit`,
      active: location.pathname.includes("/edit"),
      // Pas de feature = toujours visible
    },
    {
      title: t('dashboard.navigation.products'),
      icon: <Package className="h-5 w-5" />,
      href: `/cards/${selectedCardId}/products`,
      active: location.pathname.includes("/products"),
      feature: 'hasEcommerce' as const, // COMMERCE/OPERE
    },
    {
      title: t('dashboard.navigation.orders'),
      icon: <ShoppingCart className="h-5 w-5" />,
      href: `/cards/${selectedCardId}/orders`,
      active: location.pathname.includes("/orders"),
      feature: 'hasEcommerce' as const, // COMMERCE/OPERE
    },
    {
      title: t('dashboard.navigation.appointments'),
      icon: <Calendar className="h-5 w-5" />,
      href: `/cards/${selectedCardId}/appointments`,
      active: location.pathname.includes("/appointments"),
      feature: 'hasAppointments' as const, // CONNEXIONS/OPERE
    },
    {
      title: t('dashboard.navigation.statistics'),
      icon: <BarChart3 className="h-5 w-5" />,
      href: `/cards/${selectedCardId}/stats`,
      active: location.pathname.includes("/stats"),
      feature: 'advancedAnalytics' as const, // CONNEXIONS/COMMERCE/OPERE
    },
    {
      title: t('dashboard.navigation.qr'),
      icon: <QrCode className="h-5 w-5" />,
      href: `/cards/${selectedCardId}/qr`,
      active: location.pathname.includes("/qr"),
      // Pas de feature = toujours visible
    },
  ] : [];

  // Filtrer selon le plan (attendre le chargement)
  const cardNavigationItems = subscriptionLoading
    ? [] // Pendant le chargement, ne rien afficher
    : allCardNavigationItems.filter(item => {
        if (!('feature' in item) || !item.feature) {
          return true; // Toujours visible si pas de feature
        }
        return hasFeature(item.feature);
      });

  // Fonction de prefetch pour les pages de cartes au hover
  const handlePrefetchCardPage = (cardId: string, page: string) => {
    // Prefetch les données de la carte si nécessaire
    queryClient.prefetchQuery({
      queryKey: [`card-${page}`, cardId],
      queryFn: async () => {
        const { data } = await supabase
          .from("business_cards")
          .select("*")
          .eq("id", cardId)
          .single();
        return data;
      },
      staleTime: 1000 * 60 * 10, // 10 minutes
    });
  };

  const renderSettingsPanel = () => (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold">{t('dashboard.settingsPanel.title')}</h2>
      </div>
      
      <div className="flex-1 overflow-auto p-6 space-y-8">
        {/* Devise et Langue */}
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-4">{t('dashboard.settingsPanel.currency')}</h3>
            <CurrencySelector />
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-4">{t('dashboard.settingsPanel.language')}</h3>
            <LanguageSelector />
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium mb-4">{t('dashboard.settingsPanel.notifications')}</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('dashboard.settingsPanel.emailNotifications')}</Label>
                <p className="text-sm text-gray-500">{t('dashboard.settingsPanel.emailNotificationsDesc')}</p>
              </div>
              <Switch
                checked={notificationSettings.emailNotifications}
                onCheckedChange={() => handleNotificationChange('emailNotifications')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('dashboard.settingsPanel.appointmentReminders')}</Label>
                <p className="text-sm text-gray-500">{t('dashboard.settingsPanel.appointmentRemindersDesc')}</p>
              </div>
              <Switch
                checked={notificationSettings.appointmentReminders}
                onCheckedChange={() => handleNotificationChange('appointmentReminders')}
              />
            </div>
          </div>
        </div>

        {/* Apparence */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium mb-4">{t('dashboard.settingsPanel.appearance')}</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('dashboard.settingsPanel.darkMode')}</Label>
                <p className="text-sm text-gray-500">{t('dashboard.settingsPanel.darkModeDesc')}</p>
              </div>
              <Switch
                checked={appearanceSettings.darkMode}
                onCheckedChange={() => handleAppearanceChange('darkMode')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('dashboard.settingsPanel.compactMode')}</Label>
                <p className="text-sm text-gray-500">{t('dashboard.settingsPanel.compactModeDesc')}</p>
              </div>
              <Switch
                checked={appearanceSettings.compactMode}
                onCheckedChange={() => handleAppearanceChange('compactMode')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Top navigation for mobile (masquée dans l’iframe Flyover) */}
      {!isEmbedFrame && (
      <header className="flex items-center justify-between p-4 border-b border-gray-200/50 bg-white lg:hidden">
        <div className="flex items-center">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-5 w-5 text-gray-900" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-white border-r border-gray-200/50">
              <SheetTitle className="sr-only">{t('dashboard.navigation.menu')}</SheetTitle>
              <SheetDescription className="sr-only">{t('dashboard.navigation.menuDescription')}</SheetDescription>
              <div className="flex flex-col h-full">
                <div className="px-4 py-6 border-b border-gray-200/50">
                  <Link to="/" className="flex items-center justify-center mb-6">
                    <img src="/logo/66c64b31-f6a2-40eb-959e-4bf2b6e071d9.webp" alt="Booh Logo" className="h-12" />
                  </Link>

                  {loading ? (
                    <div className="flex items-center gap-3 px-3 py-2.5">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-2 w-32" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-3 py-2.5">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback className="bg-gray-900 text-white font-semibold text-sm rounded-full">
                        {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm leading-tight truncate">{userName}</p>
                        <p className="text-xs text-gray-500 truncate">{planType}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 overflow-auto py-4 px-3">
                  <nav className="flex flex-col gap-0.5">
                    

                    {navigationItems.map((item) => (
                      <SheetClose key={item.href} asChild>
                        <NavLink
                          to={item.href}
                          className={({ isActive }) => cn(
                            "group relative flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-sm transition-all duration-200",
                            isActive
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-700 hover:bg-gray-50"
                          )}
                        >
                          {({ isActive }) => (
                            <>
                              <span className={cn(
                                "flex items-center justify-center transition-all duration-200",
                                isActive ? "text-gray-900" : "text-gray-500 group-hover:text-gray-700"
                              )}>
                                {item.icon}
                              </span>
                              <span className="transition-all duration-200">
                                {item.title}
                              </span>
                            </>
                          )}
                        </NavLink>
                      </SheetClose>
                    ))}

                    {/* Section de sélection de carte et navigation contextuelle (Mobile) */}
                    {cards.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-gray-200/50">
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 px-1">
                            {t('dashboard.navigation.myCard')}
                          </p>
                          <CardSelector
                            cards={cards}
                            className="mb-3"
                          />
                        </div>

                        <div className="flex flex-col gap-0.5">
                          {cardNavigationItems.map((item) => (
                            <SheetClose key={item.href} asChild>
                              <NavLink
                                to={item.href}
                                className={({ isActive }) => cn(
                                  "group relative flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-sm transition-all duration-200",
                                  isActive
                                    ? "bg-gray-100 text-gray-900"
                                    : "text-gray-700 hover:bg-gray-50"
                                )}
                              >
                                {({ isActive }) => (
                                  <>
                                    <span className={cn(
                                      "flex items-center justify-center transition-all duration-200",
                                      isActive ? "text-gray-900" : "text-gray-500 group-hover:text-gray-700"
                                    )}>
                                      {item.icon}
                                    </span>
                                    <span className="transition-all duration-200">
                                      {item.title}
                                    </span>
                                  </>
                                )}
                              </NavLink>
                            </SheetClose>
                          ))}
                        </div>
                      </div>
                    )}

                    <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
                      <SheetTrigger asChild>
                        <button
                          className="group relative flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200 w-full mt-2"
                        >
                          <Settings className="h-5 w-5 text-gray-500 group-hover:text-gray-700 transition-all duration-200" />
                          <span>{t('dashboard.navigation.settings')}</span>
                        </button>
                      </SheetTrigger>
                      <SheetContent side="right" className="w-80 p-0 bg-white">
                        <SheetTitle className="sr-only">{t('dashboard.settingsPanel.title')}</SheetTitle>
                        <SheetDescription className="sr-only">{t('dashboard.settingsPanel.description')}</SheetDescription>
                        {renderSettingsPanel()}
                      </SheetContent>
                    </Sheet>
                  </nav>
                </div>

                <div className="px-3 pb-3 border-t border-gray-200/50 pt-3">
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 justify-start rounded-lg hover:bg-gray-100 text-gray-700 hover:text-gray-900 font-medium transition-all duration-200 py-2 px-3"
                    >
                      <LogOut className="w-4 h-4 transition-all duration-200" />
                      <span>{t('dashboard.navigation.logout')}</span>
                    </Button>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        {loading ? (
          <Skeleton className="h-10 w-10 rounded-full" />
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-0 h-auto rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-gray-900 text-white">{userInitials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="flex items-center justify-start p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium text-gray-900">{userName}</p>
                  <p className="text-sm text-gray-500 truncate w-40">{user?.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile">
                  <User className="h-4 w-4 mr-2" />
                  {t('dashboard.navigation.profile')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                <Settings className="h-4 w-4 mr-2" />
                {t('dashboard.navigation.settings')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                {t('dashboard.navigation.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>
      )}
      
      {/* Desktop layout (sidebar masquée dans l’iframe Flyover) */}
      {!isEmbedFrame && (
      <div className={cn(
    "hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300",
    isCollapsed ? "lg:w-20" : "lg:w-72"
  )}>
    <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200/50 bg-white px-0 pb-4 relative">
      {/* Header Apple Style - Minimal */}
      <div className="flex items-center justify-between h-16 w-full px-4 border-b border-gray-200/50">
        <div className="flex items-center justify-center flex-1">
          <img
            src="/logo/66c64b31-f6a2-40eb-959e-4bf2b6e071d9.webp"
            alt="Booh Logo"
            className={cn(
              "transition-all duration-300",
              isCollapsed ? "w-12" : "w-24"
            )}
            draggable={false}
          />
        </div>

        {/* Toggle button - Minimal */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 rounded-lg hover:bg-gray-100 transition-all duration-200"
          aria-label={isCollapsed ? t('dashboard.navigation.expandSidebar') : t('dashboard.navigation.collapseSidebar')}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          )}
        </Button>
      </div>
      
      {/* Navigation Apple Style - Minimal et épurée */}
      <TooltipProvider delayDuration={0}>
        <nav className="flex flex-col gap-0.5 px-3">
          {navigationItems.map((item) => (
            <Tooltip key={item.title}>
              <TooltipTrigger asChild>
                <NavLink
                  to={item.href}
                  className={({ isActive }) => cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-sm transition-all duration-200",
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-700 hover:bg-gray-50",
                    isCollapsed && "justify-center px-2"
                  )}
                >
                  {({ isActive }) => (
                    <>
                      <span className={cn(
                        "flex items-center justify-center transition-all duration-200",
                        isActive ? "text-gray-900" : "text-gray-500 group-hover:text-gray-700"
                      )}>
                        {item.icon}
                      </span>
                      {!isCollapsed && (
                        <span className="transition-all duration-200">
                          {item.title}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" className="bg-gray-900 text-white text-sm">
                  <p>{item.title}</p>
                </TooltipContent>
              )}
            </Tooltip>
          ))}
        </nav>
      </TooltipProvider>

        {/* Section de sélection de carte et navigation contextuelle */}
        {!isCollapsed && cards.length > 0 && (
          <div className="px-3 mt-6 pt-4 border-t border-gray-200/50">
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-3">
                {t('dashboard.navigation.myCard')}
              </p>
              <CardSelector
                cards={cards}
                className="mb-3"
              />
            </div>

            <div className="flex flex-col gap-0.5">
              {cardNavigationItems.map((item) => (
                <NavLink
                  key={item.title}
                  to={item.href}
                  onMouseEnter={() => {
                    const page = item.title.toLowerCase();
                    if (selectedCardId) {
                      handlePrefetchCardPage(selectedCardId, page);
                    }
                  }}
                  className={({ isActive }) => cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-sm transition-all duration-200",
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {({ isActive }) => (
                    <>
                      <span className={cn(
                        "flex items-center justify-center transition-all duration-200",
                        isActive ? "text-gray-900" : "text-gray-500 group-hover:text-gray-700"
                      )}>
                        {item.icon}
                      </span>
                      <span className="transition-all duration-200">
                        {item.title}
                      </span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      
      {/* Footer utilisateur Apple Style - Minimal */}
      <div className="mt-auto px-3 pb-3 border-t border-gray-200/50 pt-3">
        {!isCollapsed && (
          <div className="flex items-center gap-3 px-3 py-2.5 mb-2">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-gray-900 text-white font-semibold text-sm rounded-lg">
              {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col justify-center min-w-0 flex-1">
              <span className="font-medium text-gray-900 text-sm leading-tight truncate">{userName}</span>
              <span className="text-xs text-gray-500">{planType}</span>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="flex items-center justify-center mb-2">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-gray-900 text-white font-semibold text-sm rounded-lg">
              {userInitials}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className={cn(
            "w-full flex items-center gap-2 justify-start rounded-lg hover:bg-gray-100 text-gray-700 hover:text-gray-900 font-medium transition-all duration-200 py-2",
            isCollapsed && "justify-center px-2"
          )}
        >
          <LogOut className="w-4 h-4 transition-all duration-200" />
          {!isCollapsed && <span>{t('dashboard.navigation.logout')}</span>}
        </Button>
      </div>
    </div>
  </div>
      )}
  
  {/* Main content (pleine largeur en iframe Flyover) */}
  <div className={cn(
    "transition-all duration-300",
    !isEmbedFrame && (isCollapsed ? "lg:pl-20" : "lg:pl-72")
  )}>
    <main className="py-10">
      <div className="px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  </div>
</div>
  );
};

export default DashboardLayout;

/* Ajoute ce CSS global pour les animations et le ripple effect */
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes gradient-move {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    .animate-gradient-move {
      background-size: 200% 200%;
      animation: gradient-move 12s ease-in-out infinite;
    }
    .animate-glow {
      box-shadow: 0 0 16px 2px rgba(139,92,246,0.18), 0 0 32px 4px rgba(99,102,241,0.12);
    }
    .ripple {
      position: relative;
      overflow: hidden;
    }
    .ripple-effect {
      content: '';
      position: absolute;
      left: 50%;
      top: 50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle,rgba(139,92,246,0.10) 0,transparent 70%);
      transform: translate(-50%,-50%) scale(0);
      opacity: 0;
      transition: transform 0.4s, opacity 0.4s;
      pointer-events: none;
    }
    .ripple:active .ripple-effect {
      transform: translate(-50%,-50%) scale(1);
      opacity: 1;
      transition: 0s;
    }
    .animate-bounce {
      animation: bounce 1.2s infinite alternate cubic-bezier(.5,1.8,.5,1);
    }
    @keyframes bounce {
      0% { transform: translateY(0); }
      100% { transform: translateY(-4px) scale(1.08); }
    }
  `;
  document.head.appendChild(style);
}
