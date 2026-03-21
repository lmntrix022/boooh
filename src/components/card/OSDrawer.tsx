/**
 * OSDrawer - Singularity Design / Flyover UI
 *
 * Drawer OS : menu des modules. En mode Flyover (useFlyover=true), un clic ouvre
 * un panel (iframe) dans le drawer sans changer l’URL. Sinon, navigation classique.
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Users,
  Package,
  ShoppingCart,
  Calendar,
  FileText,
  LayoutGrid,
  MapPin,
  ArrowLeft,
  Lock,
} from 'lucide-react';
import { useRealityLayer, type OSModuleKey } from '@/contexts/RealityLayerContext';
import { useAdaptedPlan } from '@/hooks/useAdaptedPlan';
import { useOSDrawerBadges } from '@/hooks/useOSDrawerBadges';
import { OS_DRAWER_REFRESH_BADGES } from '@/utils/osDrawerBadgesSync';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const OS_LINKS: {
  feature: keyof import('@/types/subscription').PlanFeatures;
  path: string;
  moduleKey: OSModuleKey;
  label: string;
  icon: React.ReactNode;
}[] = [
  { feature: 'hasCRM', path: '/contacts', moduleKey: 'crm', label: 'Contacts', icon: <Users className="h-5 w-5" /> },
  { feature: 'hasEcommerce', path: 'orders', moduleKey: 'commerce', label: 'Commandes', icon: <ShoppingCart className="h-5 w-5" /> },
  { feature: 'hasStockManagement', path: '/stock', moduleKey: 'stock', label: 'Stock', icon: <Package className="h-5 w-5" /> },
  { feature: 'hasAppointments', path: 'appointment-manager', moduleKey: 'appointments', label: 'Rendez-vous', icon: <Calendar className="h-5 w-5" /> },
  { feature: 'hasPortfolio', path: '/portfolio/quotes', moduleKey: 'portfolio', label: 'Devis', icon: <LayoutGrid className="h-5 w-5" /> },
  { feature: 'hasInvoicing', path: '/facture', moduleKey: 'invoicing', label: 'Facturation', icon: <FileText className="h-5 w-5" /> },
  { feature: 'hasMap', path: '/map', moduleKey: 'map', label: 'Carte', icon: <MapPin className="h-5 w-5" /> },
];

function getPanelUrl(moduleKey: OSModuleKey, cardId: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const paths: Record<OSModuleKey, string> = {
    crm: '/contacts',
    commerce: `/cards/${cardId}/orders`,
    stock: '/stock',
    appointments: `/cards/${cardId}/appointment-manager`,
    portfolio: '/portfolio/quotes',
    invoicing: '/facture',
    map: '/map',
  };
  return base + paths[moduleKey];
}

const BADGE_COLORS: Record<string, string> = {
  orange: 'bg-orange-500/90 text-white',
  blue: 'bg-blue-500/90 text-white',
  green: 'bg-emerald-500/90 text-white',
  violet: 'bg-violet-500/90 text-white',
};

export function OSDrawer({ useFlyover = false }: { useFlyover?: boolean }) {
  const { cardId, showOSDrawer, setShowOSDrawer, openPanel, setOpenPanel } = useRealityLayer();
  const { hasFeature } = useAdaptedPlan();
  const queryClient = useQueryClient();
  const badgeStates = useOSDrawerBadges(cardId ?? undefined);
  const navigate = useNavigate();

  // When content runs in iframe (Flyover), it posts this message; parent refetches badges
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.source !== window && event.data?.type === OS_DRAWER_REFRESH_BADGES) {
        queryClient.invalidateQueries({ queryKey: ['os-drawer-badges'] });
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [queryClient]);

  const handleSelect = (path: string, moduleKey: OSModuleKey) => {
    if (!cardId) return;
    if (useFlyover) {
      setOpenPanel(moduleKey);
      return;
    }
    const fullPath = path.startsWith('/') ? path : `/cards/${cardId}/${path}`;
    setShowOSDrawer(false);
    navigate(fullPath);
  };

  const handleBack = () => {
    setOpenPanel(null);
    queryClient.invalidateQueries({ queryKey: ['os-drawer-badges'] });
  };
  const panelUrl = openPanel && cardId ? getPanelUrl(openPanel, cardId) : null;

  return (
    <AnimatePresence>
      {showOSDrawer && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-40"
            onClick={() => { setShowOSDrawer(false); useFlyover && setOpenPanel(null); }}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-[430px] z-50 flex flex-col"
          >
            <div className="absolute inset-0 bg-white" />
            <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-transparent pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full">
              <div className="relative border-b border-gray-100">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                <div className="p-5 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <motion.div
                        className="w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl flex items-center justify-center shadow-lg"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', delay: 0.1 }}
                      >
                        <LayoutGrid className="w-5 h-5 text-white" strokeWidth={2} />
                      </motion.div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h2>
                        <p className="text-sm text-gray-500 font-medium mt-0.5">Gérer ta carte et ton activité</p>
                      </div>
                    </div>
                    <motion.button
                      type="button"
                      onClick={() => { setShowOSDrawer(false); useFlyover && setOpenPanel(null); }}
                      className="w-10 h-10 hover:bg-gray-100 rounded-xl flex items-center justify-center transition-all active:scale-90"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <X className="w-5 h-5 text-gray-600" strokeWidth={2.5} />
                    </motion.button>
                  </div>
                </div>
              </div>

              {useFlyover && openPanel ? (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center gap-2 p-3 border-b border-gray-100">
                    <motion.button
                      type="button"
                      onClick={handleBack}
                      className="p-2 rounded-xl hover:bg-gray-100 flex items-center gap-2 text-gray-700"
                      whileTap={{ scale: 0.95 }}
                    >
                      <ArrowLeft className="h-5 w-5" />
                      <span className="text-sm font-medium">Retour</span>
                    </motion.button>
                  </div>
                  <div className="flex-1 min-h-0 relative">
                    <iframe
                      title="Panel"
                      src={panelUrl ?? ''}
                      className="absolute inset-0 w-full h-full border-0 rounded-b-2xl"
                    />
                  </div>
                </div>
              ) : (
              <TooltipProvider delayDuration={300}>
              <nav className="flex-1 overflow-y-auto overscroll-contain p-5 md:p-6">
                <div className="space-y-2">
                  {OS_LINKS.map(({ feature, path, moduleKey, label, icon }) => {
                    const enabled = moduleKey === 'map' ? true : hasFeature(feature);
                    const badgeState = (moduleKey in badgeStates) ? badgeStates[moduleKey as keyof typeof badgeStates] : undefined;
                    const showBadge = badgeState?.type === 'visible' && badgeState.count > 0;
                    const showGhost = !enabled && (badgeState?.type === 'ghost' || !badgeState);

                    const linkContent = (
                      <>
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            enabled
                              ? 'bg-gradient-to-br from-gray-900 to-gray-700 text-white shadow-md'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {icon}
                        </div>
                        <span className={`font-medium text-[15px] flex-1 text-left ${enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                          {label}
                        </span>
                        {showBadge && badgeState.type === 'visible' && (
                          <span
                            className={`flex-shrink-0 min-w-[22px] h-[22px] px-1.5 rounded-full text-xs font-semibold flex items-center justify-center ${BADGE_COLORS[badgeState.color] ?? BADGE_COLORS.orange}`}
                          >
                            {badgeState.label}
                          </span>
                        )}
                        {showGhost && (
                          <span className="flex-shrink-0 w-[22px] h-[22px] rounded-full bg-gray-200 text-gray-500 flex items-center justify-center">
                            <Lock className="h-3 w-3" />
                          </span>
                        )}
                      </>
                    );

                    const tooltipText = showBadge && badgeState.type === 'visible'
                      ? badgeState.tooltip
                      : showGhost && badgeState?.type === 'ghost'
                        ? badgeState.tooltip
                        : '';

                    const button = (
                      <motion.button
                        type="button"
                        onClick={() => enabled && handleSelect(path, moduleKey)}
                        disabled={!enabled}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white hover:bg-gray-50/80 hover:border-gray-200 transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                        whileHover={enabled ? { scale: 1.01, y: -1 } : {}}
                        whileTap={enabled ? { scale: 0.99 } : {}}
                      >
                        {linkContent}
                      </motion.button>
                    );

                    return (
                      <React.Fragment key={feature}>
                        {tooltipText ? (
                          <Tooltip>
                            <TooltipTrigger asChild>{button}</TooltipTrigger>
                            <TooltipContent side="left" className="max-w-[240px]">{tooltipText}</TooltipContent>
                          </Tooltip>
                        ) : (
                          button
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </nav>
              </TooltipProvider>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
