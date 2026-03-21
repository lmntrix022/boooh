import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Loader2, Trash2, Globe, Lock, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import BusinessCardActions from "@/components/BusinessCardActions";
import { Tables } from "@/integrations/supabase/types";
import CardOrdersDialog from "./CardOrdersDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import gsap from "gsap";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type BusinessCard = Tables<"business_cards">;

interface BusinessCardItemProps {
  card: BusinessCard;
  index: number;
  isDeleting: boolean;
  onDelete: () => void;
}

// Fonction pour générer un motif aléatoire
const getRandomPattern = () => {
  const patterns = [
    'radial-gradient(circle at 100% 0%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
    'linear-gradient(45deg, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
    'radial-gradient(circle at 0% 100%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)',
    'linear-gradient(-45deg, rgba(236, 72, 153, 0.1) 0%, transparent 50%)',
    'radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.1) 0%, transparent 50%)',
  ];
  return patterns[Math.floor(Math.random() * patterns.length)];
};

const HeaderButton = ({ icon, label, to, variant, onClick, loading }: any) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        {to ? (
          <Link to={to}>
            <Button
              variant="ghost"
              size="icon"
              className={`
                h-8 w-8 rounded-xl
                bg-white/80 backdrop-blur-sm
                shadow-[4px_4px_8px_0px_rgba(0,0,0,0.1),-4px_-4px_8px_0px_rgba(255,255,255,0.8)]
                hover:shadow-[inset_4px_4px_8px_0px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_0px_rgba(255,255,255,0.8)]
                active:shadow-[inset_4px_4px_8px_0px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_0px_rgba(255,255,255,0.8)]
                transition-all duration-200
                ${variant === 'danger' ? 'text-rose-500 hover:text-rose-600' : 'text-gray-600 hover:text-gray-800'}
              `}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
            </Button>
          </Link>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            className={`
              h-8 w-8 rounded-xl
              bg-white/80 backdrop-blur-sm
              shadow-[4px_4px_8px_0px_rgba(0,0,0,0.1),-4px_-4px_8px_0px_rgba(255,255,255,0.8)]
              hover:shadow-[inset_4px_4px_8px_0px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_0px_rgba(255,255,255,0.8)]
              active:shadow-[inset_4px_4px_8px_0px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_0px_rgba(255,255,255,0.8)]
              transition-all duration-200
              ${variant === 'danger' ? 'text-rose-500 hover:text-rose-600' : 'text-gray-600 hover:text-gray-800'}
            `}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
          </Button>
        )}
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{label}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const BusinessCardItem: React.FC<BusinessCardItemProps> = ({
  card,
  index,
  isDeleting,
  onDelete
}) => {
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPublic, setIsPublic] = useState(card.is_public);
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const pattern = React.useMemo(() => getRandomPattern(), []);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    // Animation d'apparition initiale
    const appearanceAnimation = gsap.fromTo(card,
      { 
        y: 20,
        opacity: 0,
        scale: 0.95
      },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.6,
        delay: index * 0.1,
        ease: "power3.out"
      }
    );

    return () => {
      appearanceAnimation.kill();
      gsap.killTweensOf(card);
    };
  }, [index]);

  const handleVisibilityToggle = async () => {
    try {
      setIsUpdating(true);
      const newStatus = !isPublic;

      const { error } = await supabase
        .from('business_cards')
        .update({ is_public: newStatus })
        .eq('id', card.id);

      if (error) throw error;

      setIsPublic(newStatus);
      toast({
        title: "Statut mis à jour",
        description: `La carte est maintenant ${newStatus ? 'publique' : 'privée'}.`,
        variant: "default",
      });
    } catch (error) {
      // Error log removed
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut de la carte.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = () => {
    onDelete();
  };

  const formattedDate = format(new Date(card.created_at!), 'dd MMMM yyyy', { locale: fr });

  return (
    <TooltipProvider>
      <Card 
        ref={cardRef} 
        className={`
          relative overflow-hidden 
          bg-gradient-to-br ${pattern}
          backdrop-blur-sm border border-white/20
          shadow-[8px_8px_16px_0px_rgba(0,0,0,0.1),-8px_-8px_16px_0px_rgba(255,255,255,0.8)]
        `}
      >
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <CardTitle ref={titleRef} className="text-lg font-semibold text-gray-800">
              {card.name}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <HeaderButton
                icon={<Eye className="h-4 w-4" />}
                label="Voir la carte"
                to={`/cards/${card.id}/view`}
              />
              
              <HeaderButton
                icon={<Edit className="h-4 w-4" />}
                label="Modifier"
                to={`/cards/${card.id}/edit`}
              />
              
              <HeaderButton
                icon={<Trash2 className="h-4 w-4" />}
                label="Supprimer"
                variant="danger"
                onClick={handleDelete}
                loading={isDeleting}
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{formattedDate}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`
                flex items-center gap-2 px-3 py-1.5 
                rounded-xl bg-white/80 backdrop-blur-sm
                shadow-[4px_4px_8px_0px_rgba(0,0,0,0.1),-4px_-4px_8px_0px_rgba(255,255,255,0.8)]
                transition-all duration-200
              `}>
                {isPublic ? (
                  <Globe className="h-4 w-4 text-green-500" />
                ) : (
                  <Lock className="h-4 w-4 text-gray-500" />
                )}
                <Switch
                  checked={isPublic}
                  onCheckedChange={handleVisibilityToggle}
                  disabled={isUpdating}
                  className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-white/80 data-[state=unchecked]:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.8)]"
                />
              </div>
            </div>
          </div>

          <div className="backdrop-blur-sm bg-white/20 rounded-xl p-2">
            <BusinessCardActions card={card} />
          </div>
        </CardContent>
      </Card>

      <CardOrdersDialog
        open={ordersOpen}
        onOpenChange={setOrdersOpen}
        cardId={card.id}
      />
    </TooltipProvider>
  );
};

export default BusinessCardItem;
