import React from "react";
import { Button } from "@/components/ui/button";
import { QrCode, Calendar, BarChart, Package, ShoppingCart, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import CardSelector from "./CardSelector";
import { Tables } from "@/integrations/supabase/types";
import { motion } from 'framer-motion';
import { useSubscription } from "@/hooks/useSubscription";
import { PlanType } from "@/types/subscription";

type BusinessCard = Tables<"business_cards">;

interface QuickActionsGridProps {
  cards: BusinessCard[];
  selectedCardId: string;
  onCardChange: (cardId: string) => void;
  defaultCardId?: string;
}

interface QuickAction {
  title: string;
  desc: string;
  icon: React.ReactNode;
  bg: string;
  to: string;
  delay: number;
  feature?: keyof import('@/types/subscription').PlanFeatures;
  requiredPlan?: PlanType | PlanType[];
  badge?: string;
}

const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({ cards, selectedCardId }) => {
  const { hasFeature, isFree } = useSubscription();

  // Définir toutes les actions avec leurs restrictions
  const allActions: QuickAction[] = [
    {
      title: "Statistiques",
      desc: "Analysez les performances de vos cartes",
      icon: <BarChart className="h-7 w-7 text-emerald-600" />,
      bg: "bg-emerald-100",
      to: `/cards/${selectedCardId}/stats`,
      delay: 0,
      // Statistiques basiques disponibles pour tous
    },
    {
      title: "Rendez-vous",
      desc: "Gérez vos rendez-vous",
      icon: <Calendar className="h-7 w-7 text-purple-600" />,
      bg: "bg-purple-100",
      to: `/cards/${selectedCardId}/appointments`,
      delay: 0.05,
      feature: 'hasAppointments',
      requiredPlan: [PlanType.BUSINESS, PlanType.MAGIC],
      badge: isFree ? 'BUSINESS' : undefined,
    },
    {
      title: "QR Code",
      desc: "Générez votre QR code",
      icon: <QrCode className="h-7 w-7 text-blue-600" />,
      bg: "bg-blue-100",
      to: `/cards/${selectedCardId}/qr`,
      delay: 0.1,
      // QR Code disponible pour tous
    },
    {
      title: "Produits",
      desc: "Gérez vos produits",
      icon: <Package className="h-7 w-7 text-amber-600" />,
      bg: "bg-amber-100",
      to: `/cards/${selectedCardId}/products`,
      delay: 0.15,
      feature: 'hasEcommerce',
      requiredPlan: [PlanType.BUSINESS, PlanType.MAGIC],
      badge: isFree ? 'BUSINESS' : undefined,
    },
    {
      title: "Commandes",
      desc: "Gérez vos commandes",
      icon: <ShoppingCart className="h-7 w-7 text-indigo-600" />,
      bg: "bg-indigo-100",
      to: `/cards/${selectedCardId}/orders`,
      delay: 0.2,
      feature: 'hasEcommerce',
      requiredPlan: [PlanType.BUSINESS, PlanType.MAGIC],
      badge: isFree ? 'BUSINESS' : undefined,
    },
  ];

  // Filtrer les actions selon les permissions
  const actions = allActions.filter(action => {
    // Si pas de feature requise, toujours visible
    if (!action.feature) return true;

    // Sinon vérifier l'accès
    return hasFeature(action.feature);
  });
  return (
    <div className="relative w-full max-w-5xl mx-auto">
      {/* Header premium */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 via-indigo-400 to-blue-400 flex items-center justify-center shadow-lg"
            animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.12, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Zap className="h-5 w-5 text-white animate-pulse" />
          </motion.div>
          <h2 className="font-bold text-2xl sm:text-3xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">Actions rapides</h2>
        </div>
        <div className="w-full sm:w-72">
          <CardSelector
            cards={cards}

            className="glass-card border-2 border-gradient-to-r from-blue-400 to-purple-400 shadow-md focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>
      {/* Grille premium */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {actions.map((action) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: action.delay }}
            whileHover={{ scale: 1.045, boxShadow: "0 8px 32px #6366f122" }}
            whileTap={{ scale: 0.98 }}
            className="relative bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-xl flex flex-col items-center text-center p-8 transition-all duration-300 group overflow-visible"
            tabIndex={0}
          >
            {/* Only render badge if it exists in the action object */}
            {"badge" in action && (action as any).badge && (
              <span className="absolute top-4 right-4 z-10 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow animate-pulse">{(action as any).badge}</span>
            )}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 ${action.bg}`}>
              {action.icon}
            </div>
            <h3 className="text-lg font-bold mb-1 text-gray-900 group-hover:text-indigo-700 transition-colors duration-200">{action.title}</h3>
            <p className="text-sm text-gray-500 mb-6">{action.desc}</p>
            <Button variant="outline" size="sm" className="w-full rounded-full bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border-0 shadow group-hover:scale-105 group-hover:shadow-lg transition-all duration-200 font-semibold text-indigo-700">
              <Link to={action.to}>Accéder</Link>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Ajoute le CSS global pour le ripple effect
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    .ripple {
      position: relative;
      overflow: hidden;
    }
    .ripple:after {
      content: '';
      position: absolute;
      left: 50%;
      top: 50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle,rgba(139,92,246,0.15) 0,transparent 70%);
      transform: translate(-50%,-50%) scale(0);
      opacity: 0;
      transition: transform 0.4s, opacity 0.4s;
      pointer-events: none;
    }
    .ripple:active:after {
      transform: translate(-50%,-50%) scale(1);
      opacity: 1;
      transition: 0s;
    }
  `;
  document.head.appendChild(style);
}

export default QuickActionsGrid;
