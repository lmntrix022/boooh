import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tables } from "@/integrations/supabase/types";
import { useCardStore } from "@/stores/cardStore";
import { useLanguage } from "@/hooks/useLanguage";

type BusinessCard = Tables<"business_cards">;

interface CardSelectorProps {
  cards: BusinessCard[];
  className?: string;
}

const CardSelector: React.FC<CardSelectorProps> = ({
  cards,
  className = "",
}) => {
  const { selectedCardId, setSelectedCardId } = useCardStore();
  const { t } = useLanguage();

  return (
    <Select
      value={selectedCardId || undefined}
      onValueChange={(value) => setSelectedCardId(value)}
    >
      <SelectTrigger
        aria-label={t('dashboard.cardSelector.label')}
        className={`w-full bg-white border border-gray-200 rounded-lg shadow-sm transition-all duration-200 focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 hover:bg-gray-50 font-light ${className}`}
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
          fontWeight: 300,
        }}
      >
        <SelectValue placeholder={t('dashboard.cardSelector.placeholder')} />
      </SelectTrigger>
      <SelectContent
        className="bg-white border border-gray-200 rounded-lg shadow-lg mt-2 p-1 font-light"
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
          fontWeight: 300,
        }}
      >
        {cards.map((card) => (
          <SelectItem key={card.id} value={card.id}>
            {card.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CardSelector; 