import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Share2, QrCode, Package, Calendar as CalendarIcon, BarChart, Edit, ShoppingCart, Map, Check, Sparkles, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { generateCardUrl } from "@/utils/cardUrlUtils";

type BusinessCard = Tables<"business_cards">;

interface ViewCardActionsProps {
  card: BusinessCard;
}

const MAIN_ACTIONS = [
  {
    icon: <Copy className="h-5 w-5" />,
    label: "Copier le lien",
  },
  {
    icon: <Share2 className="h-5 w-5" />,
    label: "Partager",
  }
];

const CARD_ACTIONS = [
  {
    icon: <QrCode className="h-5 w-5" />,
    label: "QR Code",
    path: "qr",
  },
  {
    icon: <Package className="h-5 w-5" />,
    label: "Produits",
    path: "products",
  },
  {
    icon: <CalendarIcon className="h-5 w-5" />,
    label: "Rendez-vous",
    path: "appointments",
  },
  {
    icon: <BarChart className="h-5 w-5" />,
    label: "Stats",
    path: "stats",
  }
];

const EXTRA_ACTIONS = [
  {
    icon: <ShoppingCart className="h-5 w-5" />,
    label: "Commandes",
    path: "orders",
  },
  {
    icon: <Map className="h-5 w-5" />,
    label: "Carte",
    path: "map",
  },
  {
    icon: <Edit className="h-5 w-5" />,
    label: "Modifier",
    path: "edit",
  }
];

const ViewCardActions: React.FC<ViewCardActionsProps> = ({ card }) => {
  const { toast } = useToast();
  const [isCopying, setIsCopying] = useState(false);
  
  const publicCardUrl = generateCardUrl(card.id, (card as any).slug);
  
  const copyLink = async () => {
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(publicCardUrl);
      toast({
        title: "Lien copié",
        description: "Le lien vers votre carte a été copié dans le presse-papier.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le lien.",
        variant: "destructive",
      });
    } finally {
      setIsCopying(false);
    }
  };
  
  const shareCard = () => {
    if (navigator.share) {
      navigator.share({
        title: `Carte de visite de ${card.name}`,
        text: `Découvrez ma carte de visite numérique`,
        url: publicCardUrl,
      })
      .catch((error) => {
        // Error log removed
      });
    } else {
      copyLink();
    }
  };

  const renderActionButton = (action: any, onClick?: () => void) => {
    const ButtonContent = () => (
      <div className="text-gray-900 transition-all duration-300 group-hover:text-gray-700">
        {action.icon}
      </div>
    );

    const buttonClasses = `
      w-full aspect-square
      flex items-center justify-center
      rounded-lg
      bg-white/60 backdrop-blur-md border border-gray-200/50 shadow-sm hover:shadow-md
      hover:bg-gray-50
      focus:ring-2 focus:ring-gray-900
      transition-all duration-200
      relative overflow-hidden
      group
    `;

    if (onClick) {
      return (
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Button
            variant="ghost"
            className={buttonClasses}
            onClick={onClick}
            disabled={isCopying && action.label === "Copier le lien"}
            aria-label={action.label}
          >
            {action.label === "Copier le lien" && isCopying ? (
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                className="flex items-center gap-2"
              >
                <Check className="h-5 w-5 text-gray-900" />
              </motion.span>
            ) : (
              <ButtonContent />
            )}
          </Button>
        </motion.div>
      );
    }

    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <Link to={`/cards/${card.id}/${action.path}`} className="block">
          <Button
            variant="ghost"
            className={buttonClasses}
          >
            <ButtonContent />
          </Button>
        </Link>
      </motion.div>
    );
  };

  return (
    <TooltipProvider>
      <motion.div 
        className="space-y-6 p-6 rounded-lg bg-white/60 backdrop-blur-md border border-gray-200/50 shadow-sm hover:shadow-md relative overflow-hidden transition-all duration-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.8 }}
        whileHover={{ scale: 1.01 }}
      >
        {/* Header des actions */}
        <motion.div 
          className="text-center mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Actions rapides
          </h3>
          <p className="text-gray-600 text-sm">
            Gérez et partagez votre carte de visite
          </p>
        </motion.div>

        {/* Actions principales */}
        <motion.div 
          className="grid grid-cols-2 gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
        >
          {MAIN_ACTIONS.map((action, index) => (
            <Tooltip key={action.label}>
              <TooltipTrigger asChild>
                <div className="group">
                  {renderActionButton(
                    action,
                    index === 0 ? copyLink : shareCard
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent 
                side="bottom"
                className="bg-white/90 backdrop-blur-sm shadow-sm border border-gray-200/50 px-3 py-2 text-sm rounded-lg text-gray-900"
              >
                <p className="font-semibold">{action.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </motion.div>
        
        {/* Actions de la carte */}
        <motion.div 
          className="grid grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
        >
          {CARD_ACTIONS.map((action) => (
            <Tooltip key={action.path}>
              <TooltipTrigger asChild>
                <div className="group">
                  {renderActionButton(action)}
                </div>
              </TooltipTrigger>
              <TooltipContent 
                side="bottom"
                className="bg-white/90 backdrop-blur-sm shadow-sm border border-gray-200/50 px-3 py-2 text-sm rounded-lg text-gray-900"
              >
                <p className="font-semibold">{action.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </motion.div>
        
        {/* Actions supplémentaires */}
        <motion.div 
          className="grid grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.2 }}
        >
          {EXTRA_ACTIONS.map((action) => (
            <Tooltip key={action.path}>
              <TooltipTrigger asChild>
                <div className="group">
                  {renderActionButton(action)}
                </div>
              </TooltipTrigger>
              <TooltipContent 
                side="bottom"
                className="bg-white/90 backdrop-blur-sm shadow-sm border border-gray-200/50 px-3 py-2 text-sm rounded-lg text-gray-900"
              >
                <p className="font-semibold">{action.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </motion.div>

        {/* Badge Premium si applicable */}
        {(card as any)?.premium && (
          <motion.div 
            className="absolute top-4 right-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 1.3 }}
          >
            <div className="bg-gray-900 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-md flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Pro
            </div>
          </motion.div>
        )}
      </motion.div>
    </TooltipProvider>
  );
};

export default ViewCardActions;
