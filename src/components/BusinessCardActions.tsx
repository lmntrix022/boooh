import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package, Calendar, QrCode, BarChart, ShoppingCart, Palette, Map, Download } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type BusinessCard = Tables<"business_cards">;

interface BusinessCardActionsProps {
  card: BusinessCard;
}

const ACTIONS = [
  {
    icon: <Package className="w-4 h-4" />,
    label: "Produits",
    path: "products",
    color: "text-emerald-500",
  },
  {
    icon: <Download className="w-4 h-4" />,
    label: "Produits Numériques",
    path: "digital-products",
    color: "text-purple-500",
  },
  {
    icon: <Calendar className="w-4 h-4" />,
    label: "Rendez-vous",
    path: "appointments",
    color: "text-black",
  },
  {
    icon: <QrCode className="w-4 h-4" />,
    label: "QR Code",
    path: "qr",
    color: "text-purple-500",
  },
  {
    icon: <BarChart className="w-4 h-4" />,
    label: "Statistiques",
    path: "stats",
    color: "text-amber-500",
  },
  {
    icon: <ShoppingCart className="w-4 h-4" />,
    label: "Commandes",
    path: "orders",
    color: "text-rose-500",
  },
  {
    icon: <Map className="w-4 h-4" />,
    label: "Carte",
    path: "map",
    color: "text-cyan-500",
  },
  {
    icon: <Palette className="w-4 h-4" />,
    label: "Thèmes",
    path: "theme",
    color: "text-indigo-500",
  }
];

const BusinessCardActions: React.FC<BusinessCardActionsProps> = ({ card }) => {
  return (
    <TooltipProvider>
      <div className="grid grid-cols-4 gap-3 p-4 rounded-xl bg-[#f0f0f0]">
        {ACTIONS.map((action) => (
          <Tooltip key={action.path}>
            <TooltipTrigger asChild>
              <Link 
                to={`/cards/${card.id}/${action.path}`}
                className="block group"
              >
                <Button
                  variant="ghost"
                  className={`
                    w-full aspect-square
                    flex items-center justify-center
                    rounded-xl
                    bg-[#f0f0f0]
                    shadow-[6px_6px_12px_0px_#d1d1d1,-6px_-6px_12px_0px_#ffffff]
                    hover:shadow-[inset_6px_6px_12px_0px_#d1d1d1,inset_-6px_-6px_12px_0px_#ffffff]
                    active:shadow-[inset_6px_6px_12px_0px_#d1d1d1,inset_-6px_-6px_12px_0px_#ffffff]
                    transition-all duration-200
                  `}
                >
                  <div className={`${action.color} transition-colors duration-200`}>
                    {action.icon}
                  </div>
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent 
              side="bottom"
              className="bg-white/90 backdrop-blur-sm shadow-[4px_4px_8px_0px_#d1d1d1,-4px_-4px_8px_0px_#ffffff] px-2 py-1 text-xs rounded-lg"
            >
              <p className="font-medium text-gray-700">{action.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};

export default BusinessCardActions;

