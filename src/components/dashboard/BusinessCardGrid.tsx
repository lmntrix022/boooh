import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Globe, 
  Lock, 
  Calendar,
  QrCode,
  BarChart,
  Package,
  ShoppingCart,
  Map,
  Palette,
  Share2,
  Download
} from "lucide-react";
import { Link } from "react-router-dom";
import { Tables } from "@/integrations/supabase/types";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";

type BusinessCard = Tables<"business_cards">;

interface BusinessCardGridProps {
  cards: BusinessCard[];
  onCardSelect: (cardId: string) => void;
  selectedCardId?: string;
  onDeleteCard?: (cardId: string) => void;
}

const BusinessCardGrid: React.FC<BusinessCardGridProps> = ({
  cards,
  onCardSelect,
  selectedCardId,
  onDeleteCard
}) => {
  const [isUpdating, setIsUpdating] = React.useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const [localVisibility, setLocalVisibility] = React.useState(() =>
    Object.fromEntries(cards.map(card => [card.id, card.is_public]))
  );

  React.useEffect(() => {
    setLocalVisibility(Object.fromEntries(cards.map(card => [card.id, card.is_public])));
  }, [cards]);

  const handleToggleVisibility = async (card) => {
    setLocalVisibility(prev => ({ ...prev, [card.id]: !prev[card.id] }));
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('business_cards')
        .update({ is_public: !localVisibility[card.id] })
        .eq('id', card.id);
      if (error) throw error;
      toast({
        title: t('dashboard.cards.statusUpdated'),
        description: t('dashboard.cards.statusUpdatedDesc', { status: !localVisibility[card.id] ? t('dashboard.cards.public') : t('dashboard.cards.private') }),
        variant: 'default',
      });
    } catch (error) {
      setLocalVisibility(prev => ({ ...prev, [card.id]: !prev[card.id] }));
      toast({
        title: t('dashboard.cards.statusError'),
        description: t('dashboard.cards.statusErrorDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <AnimatePresence>
        {cards.length === 0 && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center py-12"
          >
            <h3 className="text-lg font-light text-gray-900 mb-2 tracking-tight"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
                letterSpacing: '-0.02em',
              }}
            >{t('dashboard.cards.noCards')}</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >{t('dashboard.cards.createFirstCard')}</p>
          </motion.div>
        )}
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.5, delay: index * 0.07, ease: 'easeOut' }}
            whileHover={{ scale: 1.02 }}
            className={`relative bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md flex flex-col items-center gap-0 px-6 py-5 transition-all duration-200 cursor-pointer overflow-visible group ${selectedCardId === card.id ? 'ring-1 ring-gray-900/10' : ''}`}
            onClick={() => onCardSelect(card.id)}
            tabIndex={0}
            style={{ minWidth: 0 }}
          >
            {/* Ligne : avatar, nom, badge+switch, actions */}
            <div className="flex items-center justify-center gap-3 w-full mb-3 flex-wrap">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="w-12 h-12 border border-gray-200 transition-all duration-200 group-hover:shadow-sm">
                  <AvatarImage src={card.avatar_url || undefined} alt={card.name} />
                  <AvatarFallback className="bg-gray-100 text-gray-900">{card.name?.charAt(0).toUpperCase() || 'C'}</AvatarFallback>
                </Avatar>
              </div>
              
              {/* Nom */}
              <span className="font-light text-sm text-gray-900 text-center max-w-[120px] tracking-tight"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                  letterSpacing: '-0.01em',
                }}
              >
                {card.name}
              </span>
              
              {/* Badge + Switch */}
              <div className="flex items-center gap-2">
                <Badge 
                  variant="default" 
                  className={`px-2 py-0.5 text-xs font-light rounded-lg border ${
                    localVisibility[card.id] ? 'bg-gray-100 text-gray-700 border-gray-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {localVisibility[card.id] ? t('dashboard.cards.public') : t('dashboard.cards.private')}
                </Badge>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Switch
                        checked={!!localVisibility[card.id]}
                        disabled={isUpdating}
                        onCheckedChange={() => handleToggleVisibility(card)}
                        className="w-10 h-6 transition-all duration-200"
                        aria-label={localVisibility[card.id] ? t('dashboard.cards.makePrivate') : t('dashboard.cards.makePublic')}
                      />
                    </TooltipTrigger>
                    <TooltipContent className="bg-white border border-gray-200 shadow-lg rounded-lg font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{localVisibility[card.id] ? t('dashboard.cards.makePrivate') : t('dashboard.cards.makePublic')}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              {/* Actions principales */}
              <div className="flex items-center gap-1.5">
                {/* Voir */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" className="w-8 h-8 rounded-lg hover:bg-gray-100 transition-all duration-200" onClick={e => { e.stopPropagation(); window.open(`/cards/${card.id}/view`, '_blank'); }}>
                        <Eye className="h-4 w-4 text-gray-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white border border-gray-200 shadow-lg rounded-lg font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('dashboard.cards.actions.view')}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                {/* Éditer */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" className="w-8 h-8 rounded-lg hover:bg-gray-100 transition-all duration-200" onClick={e => { e.stopPropagation(); window.open(`/cards/${card.id}/edit`, '_blank'); }}>
                        <Edit className="h-4 w-4 text-gray-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white border border-gray-200 shadow-lg rounded-lg font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('dashboard.cards.actions.edit')}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                {/* Supprimer */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" className="w-8 h-8 rounded-lg hover:bg-gray-100 transition-all duration-200" onClick={e => { e.stopPropagation(); onDeleteCard?.(card.id); }}>
                        <Trash2 className="h-4 w-4 text-gray-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-white border border-gray-200 shadow-lg rounded-lg font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('dashboard.cards.actions.delete')}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            
            {/* Séparateur */}
            <div className="w-full h-px bg-gray-200/50 mb-3" />
            
            {/* Actions secondaires en grille */}
            <div className="grid grid-cols-5 gap-2 w-full justify-items-center">
              {/* QR Code */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" className="w-8 h-8 rounded-lg hover:bg-gray-100 transition-all duration-200" onClick={e => { e.stopPropagation(); window.open(`/cards/${card.id}/qr`, '_blank'); }}>
                      <QrCode className="h-4 w-4 text-gray-600" />
                    </Button>
                  </TooltipTrigger>
                    <TooltipContent className="bg-white border border-gray-200 shadow-lg rounded-lg font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{t('dashboard.cards.actions.qrCode')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {/* Stats */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" className="w-8 h-8 rounded-lg hover:bg-gray-100 transition-all duration-200" onClick={e => { e.stopPropagation(); window.open(`/cards/${card.id}/stats`, '_blank'); }}>
                      <BarChart className="h-4 w-4 text-gray-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white border border-gray-200 shadow-lg rounded-lg font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >{t('dashboard.cards.actions.stats')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {/* Produits */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" className="w-8 h-8 rounded-lg hover:bg-gray-100 transition-all duration-200" onClick={e => { e.stopPropagation(); window.open(`/cards/${card.id}/products`, '_blank'); }}>
                      <Package className="h-4 w-4 text-gray-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white border border-gray-200 shadow-lg rounded-lg font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >{t('dashboard.cards.actions.products')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {/* RDV */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" className="w-8 h-8 rounded-lg hover:bg-gray-100 transition-all duration-200" onClick={e => { e.stopPropagation(); window.open(`/cards/${card.id}/appointments`, '_blank'); }}>
                      <Calendar className="h-4 w-4 text-gray-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white border border-gray-200 shadow-lg rounded-lg font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >{t('dashboard.cards.actions.appointments')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {/* Partager */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" className="w-8 h-8 rounded-lg hover:bg-gray-100 transition-all duration-200" onClick={e => { e.stopPropagation(); window.open(`/card/${card.id}`, '_blank'); }}>
                      <Share2 className="h-4 w-4 text-gray-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white border border-gray-200 shadow-lg rounded-lg font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >{t('dashboard.cards.actions.share')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default BusinessCardGrid;
