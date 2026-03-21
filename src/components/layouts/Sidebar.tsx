import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CreditCard,
  Settings,
  LogOut,
  ChevronRight,
  BarChart3,
  Calendar,
  Package,
  ShoppingCart,
  QrCode,
  ChevronLeft,
  Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import CardSelector from "@/components/dashboard/CardSelector";
import { Tables } from "@/integrations/supabase/types";
import { useSubscription } from "@/hooks/useSubscription";
import { PlanFeatures } from "@/types/subscription";
import { useCardStore } from "@/stores/cardStore";
import { useLogout } from "@/hooks/useLogout";
import { useUserCards } from "@/hooks/useUserCards";

type BusinessCard = Tables<"business_cards">;

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { hasFeature, isLoading: subscriptionLoading, planType, features } = useSubscription();
  const { selectedCardId, setSelectedCardId } = useCardStore();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const handleLogout = useLogout();

  // Fetch user's business cards avec le hook réutilisable
  const { cards = [], isLoading: cardsLoading } = useUserCards();

  // ✅ Correction : Auto-select first card avec dépendances optimisées
  useEffect(() => {
    if (Array.isArray(cards) && cards.length > 0 && !selectedCardId && !cardsLoading) {
      setSelectedCardId(cards[0].id);
    }
  }, [cards.length, selectedCardId, cardsLoading, setSelectedCardId]);

  const navigation = [
    {
      name: "Tableau de bord",
      href: "/dashboard",
      icon: LayoutDashboard,
      current: location.pathname === "/dashboard",
      description: "Vue d'ensemble de vos activités"
    },
    {
      name: "Mes cartes",
      href: "/cards",
      icon: CreditCard,
      current: location.pathname === "/cards",
      description: "Gérez vos cartes de visite"
    },
    {
      name: "Paramètres",
      href: "/settings",
      icon: Settings,
      current: location.pathname === "/settings",
      description: "Configuration du compte"
    },
  ];

  // Navigation spécifique à une carte sélectionnée
  const allCardNavigation = [
    {
      name: "Produits",
      href: `/cards/${selectedCardId}/products`,
      icon: Package,
      current: location.pathname.includes("/products"),
      description: "Gérer les produits de la carte",
      feature: 'hasEcommerce' as keyof PlanFeatures
    },
    {
      name: "Commandes",
      href: `/cards/${selectedCardId}/orders`,
      icon: ShoppingCart,
      current: location.pathname.includes("/orders"),
      description: "Suivi des commandes",
      feature: 'hasEcommerce' as keyof PlanFeatures
    },
    {
      name: "Rendez-vous",
      href: `/cards/${selectedCardId}/appointments`,
      icon: Calendar,
      current: location.pathname.includes("/appointments"),
      description: "Gestion des rendez-vous",
      feature: 'hasAppointments' as keyof PlanFeatures
    },
    {
      name: "Statistiques",
      href: `/cards/${selectedCardId}/stats`,
      icon: BarChart3,
      current: location.pathname.includes("/stats"),
      description: "Analyses et performances",
      feature: 'advancedAnalytics' as keyof PlanFeatures
    },
    {
      name: "QR Code",
      href: `/cards/${selectedCardId}/qr`,
      icon: QrCode,
      current: location.pathname.includes("/qr"),
      description: "Génération du QR code"
    },
    {
      name: "Personnaliser",
      href: `/cards/${selectedCardId}/edit`,
      icon: Edit,
      current: location.pathname.includes("/edit"),
      description: "Modifier la carte"
    },
  ];

  // ✅ Correction : Gestion améliorée du loading
  const cardNavigation = subscriptionLoading || cardsLoading
    ? []
    : allCardNavigation.filter(item => !item.feature || hasFeature(item.feature));

  // ✅ Fonction utilitaire pour les liens de carte
  const getCardLinkProps = (item: typeof allCardNavigation[0]) => {
    const isDisabled = !selectedCardId;
    
    return {
      to: isDisabled ? "#" : item.href,
      onClick: (e: React.MouseEvent) => {
        if (isDisabled) {
          e.preventDefault();
          console.warn('⚠️ Aucune carte sélectionnée');
        }
      },
      className: cn(
        "group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300",
        item.current
          ? "bg-gradient-to-r from-indigo-500/10 to-blue-500/10 text-indigo-700 border border-indigo-200/50 shadow-lg"
          : "text-gray-600 hover:text-indigo-700 hover:bg-white/60",
        isDisabled && "opacity-50 cursor-not-allowed pointer-events-none"
      )
    };
  };

  return (
    <motion.div
      className={cn(
        "flex h-full flex-col bg-white/80 backdrop-blur-xl border-r border-white/20 shadow-2xl relative transition-all duration-300",
        collapsed ? "w-24" : "w-72"
      )}
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1, width: collapsed ? 96 : 288 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Fond décoratif premium */}
      <div className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 20% 20%, rgba(139,92,246,0.08) 0, transparent 60%), radial-gradient(circle at 80% 80%, rgba(236,72,153,0.07) 0, transparent 60%)'
        }}
      />
      
      {/* Header premium + bouton collapse */}
      <div className={cn("p-6 border-b border-black/20 flex items-center", collapsed && "p-4", "relative")}> 
        <div
          className={cn("flex items-center gap-3 group transition-all cursor-pointer", collapsed && "p-0")}
          aria-label="Logo Booh, rétracter ou étendre la sidebar"
          onClick={() => setCollapsed((v) => !v)}
        >
          <motion.div
            className="relative"
            whileHover={{ scale: 1.08 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
          >
            <img src="/booh.svg" alt="Logo Bööh" className="h-12 w-auto" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
          </motion.div>
          {!collapsed && (
            <div>
              <p className="text-xs text-gray-500 font-medium">Dashboard Pro</p>
            </div>
          )}
        </div>
        
        {/* Bouton collapse premium tout à droite */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Déplier la sidebar" : "Réduire la sidebar"}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 p-0 flex items-center justify-center rounded-full bg-white/70 hover:bg-gradient-to-br hover:from-purple-100 hover:to-indigo-100 shadow-lg border border-white/30 transition-all focus:ring-2 focus:ring-purple-300 z-50"
        >
          {collapsed ? <ChevronRight className="w-5 h-5 text-purple-500" /> : <ChevronLeft className="w-5 h-5 text-purple-500" />}
        </button>
      </div>
      
      {/* Navigation premium */}
      <nav className={cn("flex-1 px-4 py-2 transition-all duration-300 overflow-y-auto", collapsed && "px-1 py-4")}>
        <div className="space-y-2">
          {navigation.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              onHoverStart={() => setHoveredItem(item.name)}
              onHoverEnd={() => setHoveredItem(null)}
            >
              <Link
                to={item.href}
                className={cn(
                  "group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                  item.current
                    ? "bg-gradient-to-r from-purple-500/10 to-indigo-500/10 text-purple-700 border border-purple-200/50 shadow-lg"
                    : "text-gray-600 hover:text-purple-700 hover:bg-white/60",
                  collapsed && "justify-center px-2 py-2"
                )}
                tabIndex={0}
              >
                {/* Indicateur actif */}
                {item.current && !collapsed && (
                  <motion.div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-r-full"
                    layoutId="activeIndicator"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                
                {/* Icône avec animation + tooltip premium en mode collapsed */}
                <motion.div
                  className={cn(
                    "p-2 rounded-lg transition-all duration-300",
                    item.current
                      ? "bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-lg"
                      : "bg-gray-100 text-gray-500 group-hover:bg-purple-100 group-hover:text-purple-600"
                  )}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <item.icon className="h-5 w-5" />
                </motion.div>
                
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{item.name}</p>
                    <AnimatePresence>
                      {hoveredItem === item.name && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="text-xs text-gray-500 mt-1"
                        >
                          {item.description}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                )}
                
                {/* Tooltip premium en mode collapsed */}
                {collapsed && (
                  <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-white/90 shadow text-xs text-purple-700 font-semibold border border-purple-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                    {item.name}
                  </span>
                )}
                
                {/* Flèche hover (seulement étendu) */}
                {!collapsed && (
                  <motion.div
                    className={cn(
                      "transition-all duration-300",
                      item.current ? "text-purple-600" : "text-gray-400 group-hover:text-purple-600"
                    )}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{
                      x: hoveredItem === item.name ? 0 : -10,
                      opacity: hoveredItem === item.name ? 1 : 0
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </motion.div>
                )}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Section de sélection de carte et navigation contextuelle */}
        <div key={`card-nav-${collapsed}-${Array.isArray(cards) ? cards.length : 0}`}>
          {!collapsed && Array.isArray(cards) && cards.length > 0 && (
            <div className="mt-2 space-y-4">
              <div className="px-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Navigation par carte
                </h3>
                <CardSelector
                  cards={cards}
                  className="mb-3"
                />
              </div>

              <div className="space-y-2">
                {cardNavigation.map((item, index) => (
                  <motion.div
                    key={`${item.name}-${selectedCardId}`}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: (navigation.length + index) * 0.1, duration: 0.5 }}
                    onHoverStart={() => setHoveredItem(item.name)}
                    onHoverEnd={() => setHoveredItem(null)}
                  >
                    <Link
                      {...getCardLinkProps(item)}
                      tabIndex={0}
                    >
                      {/* Indicateur actif */}
                      {item.current && (
                        <motion.div
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-indigo-500 to-blue-500 rounded-r-full"
                          layoutId="activeCardIndicator"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      
                      {/* Icône avec animation */}
                      <motion.div
                        className={cn(
                          "p-2 rounded-lg transition-all duration-300",
                          item.current
                            ? "bg-gradient-to-br from-indigo-500 to-blue-500 text-white shadow-lg"
                            : "bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                        )}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <item.icon className="h-5 w-5" />
                      </motion.div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{item.name}</p>
                        <AnimatePresence>
                          {hoveredItem === item.name && (
                            <motion.p
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className="text-xs text-gray-500 mt-1"
                            >
                              {item.description}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                      
                      {/* Flèche hover */}
                      <motion.div
                        className={cn(
                          "transition-all duration-300",
                          item.current ? "text-indigo-600" : "text-gray-400 group-hover:text-indigo-600"
                        )}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{
                          x: hoveredItem === item.name ? 0 : -10,
                          opacity: hoveredItem === item.name ? 1 : 0
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Version collapsed avec tooltips */}
        {collapsed && Array.isArray(cards) && cards.length > 0 && (
          <div className="mt-6 space-y-2">
            {cardNavigation.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: (navigation.length + index) * 0.1, duration: 0.5 }}
              >
                <Link
                  to={selectedCardId ? item.href : "#"}
                  onClick={(e) => {
                    if (!selectedCardId) {
                      e.preventDefault();
                    }
                  }}
                  className={cn(
                    "group relative flex items-center justify-center px-2 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                    item.current
                      ? "bg-gradient-to-r from-indigo-500/10 to-blue-500/10 text-indigo-700 border border-indigo-200/50 shadow-lg"
                      : "text-gray-600 hover:text-indigo-700 hover:bg-white/60",
                    !selectedCardId && "opacity-50 cursor-not-allowed"
                  )}
                  tabIndex={0}
                >
                  <motion.div
                    className={cn(
                      "p-2 rounded-lg transition-all duration-300",
                      item.current
                        ? "bg-gradient-to-br from-indigo-500 to-blue-500 text-white shadow-lg"
                        : "bg-gray-100 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                    )}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <item.icon className="h-5 w-5" />
                  </motion.div>
                  
                  {/* Tooltip premium en mode collapsed */}
                  <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-white/90 shadow text-xs text-indigo-700 font-semibold border border-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                    {item.name}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </nav>
      
      {/* Footer premium */}
      <div className={cn("p-4 border-t border-white/20 transition-all duration-300", collapsed && "flex flex-col items-center justify-center p-2")}> 
        {/* Profil utilisateur */}
        <div className={cn(
          "flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 mb-4 transition-all duration-300",
          collapsed && "justify-center px-1 py-2 gap-0"
        )}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.email || "Utilisateur"}
              </p>
              <p className="text-xs text-gray-500">Pro</p>
            </div>
          )}
        </div>
        
        {/* Bouton déconnexion */}
        <button
          type="button"
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-300 group relative z-50",
            collapsed && "w-10 h-10 p-0 justify-center"
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleLogout();
          }}
          style={{ pointerEvents: 'auto' }}
        >
          <div className="p-2 rounded-lg bg-gray-100 text-gray-500 group-hover:bg-red-100 group-hover:text-red-600 transition-all duration-300">
            <LogOut className="h-4 w-4" />
          </div>
          {!collapsed && <span className="font-medium">Déconnexion</span>}
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;