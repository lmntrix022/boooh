import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Loader2, Trash2, Globe, Lock, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import BusinessCardActions from "@/components/BusinessCardActions";
import { Tables } from "@/integrations/supabase/types";
import CardOrdersDialog from "@/components/dashboard/CardOrdersDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import gsap from "gsap";

type BusinessCard = Tables<"business_cards">;

interface BusinessCardItemProps {
  card: BusinessCard;
  index: number;
  deletingCardId: string | null;
  onDelete: (id: string) => void;
}

const getCardBackground = (index: number) => {
  const backgrounds = [
    "from-violet-500/10 via-purple-500/10 to-indigo-500/10",
    "from-amber-500/10 via-orange-500/10 to-yellow-500/10",
    "from-emerald-500/10 via-teal-500/10 to-green-500/10",
    "from-sky-500/10 via-black/10 to-cyan-500/10",
    "from-black-500/10 via-rose-500/10 to-red-500/10",
  ];
  return backgrounds[index % backgrounds.length];
};

const BusinessCardItem: React.FC<BusinessCardItemProps> = ({
  card,
  index,
  deletingCardId,
  onDelete
}) => {
  const [ordersOpen, setOrdersOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    // Animation d'apparition initiale
    gsap.fromTo(card,
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

    // Configuration des animations de survol
    const enterAnimation = () => {
      gsap.to(card, {
        scale: 1.02,
        duration: 0.3,
        ease: "power2.out",
      });
    };

    const leaveAnimation = () => {
      gsap.to(card, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out",
      });
    };

    card.addEventListener("mouseenter", enterAnimation);
    card.addEventListener("mouseleave", leaveAnimation);

    return () => {
      // Nettoyage des animations au démontage
      gsap.killTweensOf(card);
      card.removeEventListener("mouseenter", enterAnimation);
      card.removeEventListener("mouseleave", leaveAnimation);
    };
  }, [index]);

  const handleDelete = async () => {
    const card = cardRef.current;
    if (!card) return;

    // Animation de suppression
    await gsap.to(card, {
      scale: 0.9,
      opacity: 0,
      y: -20,
      duration: 0.3,
      ease: "power2.in"
    });

    onDelete(card.id);
  };

  const formattedDate = new Date(card.created_at!).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short'
  });

  return (
    <TooltipProvider>
      <Card 
        ref={cardRef}
        className="relative overflow-hidden border border-gray-200 shadow-lg transition-colors duration-300 bg-white"
      >
        <CardHeader className="p-4 pb-2 relative">
          <div className="flex justify-between items-start">
            <div ref={titleRef} className="transform transition-all duration-300">
              <CardTitle className="text-lg font-bold text-gray-900">
                {card.name}
              </CardTitle>
            </div>
            <div className="flex space-x-1.5 backdrop-blur-sm bg-white/5 rounded-lg p-1">
              <HeaderButton
                icon={<Eye className="h-4 w-4" />}
                label="Voir la carte"
                to={`/cards/${card.id}/view`}
              />
              <HeaderButton
                icon={<Edit className="h-4 w-4" />}
                label="Éditer la carte"
                to={`/edit-card/${card.id}`}
              />
              <HeaderButton
                icon={<Trash2 className="h-4 w-4" />}
                label="Supprimer"
                variant="danger"
                onClick={handleDelete}
                loading={deletingCardId === card.id}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent ref={contentRef} className="p-4 pt-2 relative">
          <div className="flex justify-between items-center mb-3 backdrop-blur-sm bg-white/5 rounded-lg p-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                  <Calendar className="h-3.5 w-3.5" />
                  {formattedDate}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-gray-800/90 backdrop-blur-sm text-white px-3 py-1.5 text-sm rounded-md">
                <p>Créée le {formattedDate}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5">
                  {card.is_public ? (
                    <Globe className="w-4 h-4 text-green-500" />
                  ) : (
                    <Lock className="w-4 h-4 text-amber-500" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-gray-800/90 backdrop-blur-sm text-white px-3 py-1.5 text-sm rounded-md">
                <p>{card.is_public ? "Carte publique" : "Carte privée"}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="backdrop-blur-sm bg-white/5 rounded-lg p-2">
            <BusinessCardActions card={card} />
          </div>
        </CardContent>
        
        <CardOrdersDialog
          cardId={card.id}
          open={ordersOpen}
          onOpenChange={setOrdersOpen}
        />
      </Card>
    </TooltipProvider>
  );
};

const HeaderButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  to?: string;
  variant?: "default" | "danger";
  loading?: boolean;
}> = ({ icon, label, onClick, to, variant = "default", loading }) => {
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        {to ? (
          <Link to={to}>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`relative h-8 w-8 overflow-hidden transition-transform duration-200 ${
                variant === "danger" 
                  ? "hover:text-rose-600" 
                  : "hover:text-gray-900"
              }`}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
            </Button>
          </Link>
        ) : (
          <Button 
            variant="ghost" 
            size="icon" 
            className={`relative h-8 w-8 overflow-hidden transition-transform duration-200 ${
              variant === "danger" 
                ? "hover:text-rose-600" 
                : "hover:text-gray-900"
            }`}
            onClick={onClick}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
          </Button>
        )}
      </TooltipTrigger>
      <TooltipContent side="top" className="bg-gray-800/90 backdrop-blur-sm text-white px-3 py-1.5 text-sm rounded-md">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default BusinessCardItem;
 