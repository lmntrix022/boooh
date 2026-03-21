import React, { useState } from 'react';
import { Check, CreditCard, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface BusinessCard {
  id: string;
  title: string;
  slug?: string;
}

interface CardSelectorProps {
  cards: BusinessCard[];
  selectedCardIds: string[];
  onChange: (selectedIds: string[]) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  helpText?: string;
  maxSelection?: number;
}

export const CardSelector: React.FC<CardSelectorProps> = ({
  cards,
  selectedCardIds,
  onChange,
  label = "Cartes associées",
  placeholder = "Rechercher une carte...",
  error,
  helpText = "Sélectionnez les cartes sur lesquelles ce service sera affiché",
  maxSelection
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredCards = cards.filter(card =>
    card.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCards = cards.filter(card => selectedCardIds.includes(card.id));

  const toggleCard = (cardId: string) => {
    if (selectedCardIds.includes(cardId)) {
      // Remove card
      onChange(selectedCardIds.filter(id => id !== cardId));
    } else {
      // Add card (check max selection)
      if (!maxSelection || selectedCardIds.length < maxSelection) {
        onChange([...selectedCardIds, cardId]);
      }
    }
  };

  const removeCard = (cardId: string) => {
    onChange(selectedCardIds.filter(id => id !== cardId));
  };

  const selectAll = () => {
    if (maxSelection) {
      onChange(cards.slice(0, maxSelection).map(c => c.id));
    } else {
      onChange(cards.map(c => c.id));
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        {cards.length > 0 && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={selectAll}
              className="h-7 text-xs"
              disabled={maxSelection ? selectedCardIds.length >= maxSelection : false}
            >
              Tout sélectionner
            </Button>
            {selectedCardIds.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-7 text-xs text-red-600 hover:text-red-700"
              >
                Tout désélectionner
              </Button>
            )}
          </div>
        )}
      </div>

      {helpText && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}

      {/* Selected cards display */}
      {selectedCards.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCards.map(card => (
            <Badge
              key={card.id}
              variant="secondary"
              className="pl-2 pr-1 py-1 text-xs flex items-center gap-1"
            >
              <CreditCard className="w-3 h-3" />
              {card.title}
              <button
                type="button"
                onClick={() => removeCard(card.id)}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Dropdown selector */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className={cn(
              "pl-9",
              error && "border-red-500 focus-visible:ring-red-500"
            )}
          />
        </div>

        {/* Dropdown */}
        {isOpen && filteredCards.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredCards.map(card => {
              const isSelected = selectedCardIds.includes(card.id);
              const isDisabled = !isSelected && maxSelection && selectedCardIds.length >= maxSelection;

              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => {
                    if (!isDisabled) {
                      toggleCard(card.id);
                      setSearchTerm('');
                      if (!isSelected) {
                        setIsOpen(false);
                      }
                    }
                  }}
                  disabled={isDisabled}
                  className={cn(
                    "w-full px-3 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors",
                    isSelected && "bg-purple-50 hover:bg-purple-100",
                    isDisabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0",
                    isSelected ? "bg-purple-600 border-purple-600" : "border-gray-300"
                  )}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {card.title}
                    </div>
                    {card.slug && (
                      <div className="text-xs text-gray-500 truncate">
                        /{card.slug}
                      </div>
                    )}
                  </div>
                  <CreditCard className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {/* No results */}
        {isOpen && searchTerm && filteredCards.length === 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg p-4 text-center text-sm text-gray-500">
            Aucune carte trouvée
          </div>
        )}

        {/* Click outside to close */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>

      {/* No cards message */}
      {cards.length === 0 && (
        <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4 text-center">
          <CreditCard className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p>Vous n'avez pas encore de cartes de visite.</p>
          <p className="text-xs mt-1">Créez d'abord une carte pour l'associer à ce service.</p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Selection count */}
      {maxSelection && selectedCardIds.length > 0 && (
        <p className="text-xs text-gray-500">
          {selectedCardIds.length} / {maxSelection} carte{maxSelection > 1 ? 's' : ''} sélectionnée{selectedCardIds.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};
