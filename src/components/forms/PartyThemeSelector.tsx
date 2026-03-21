/**
 * PartyThemeSelector Component - Version Premium
 * 
 * Sélecteur de thèmes de fêtes avec recherche, catégories et UX premium
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Search, X, Sparkles, Calendar, Image as ImageIcon, Crown } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export interface PartyTheme {
  id: string;
  party_name: string;
  name: string;
  preview_image_url?: string;
  image_url?: string;
  background_color?: string;
  text_color?: string;
  accent_color?: string;
  is_premium?: boolean;
}

export interface PartyThemeSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
  partyThemes: PartyTheme[];
  activeParties: any[];
}

export const PartyThemeSelector: React.FC<PartyThemeSelectorProps> = ({ 
  value, 
  onChange, 
  partyThemes, 
  activeParties 
}) => {
  const { t } = useLanguage();
  const selected = typeof value === 'string' ? value : null;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Grouper les thèmes par fête
  const themesByParty = useMemo(() => {
    return partyThemes.reduce((acc: Record<string, PartyTheme[]>, theme: PartyTheme) => {
      const partyName = theme.party_name;
      if (!acc[partyName]) {
        acc[partyName] = [];
      }
      acc[partyName].push(theme);
      return acc;
    }, {});
  }, [partyThemes]);

  // Filtrer les thèmes selon la recherche
  const filteredThemesByParty = useMemo(() => {
    if (!searchQuery) return themesByParty;
    
    const filtered: Record<string, PartyTheme[]> = {};
    Object.entries(themesByParty).forEach(([partyName, themes]) => {
      const matchingThemes = themes.filter(theme =>
        theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        partyName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (matchingThemes.length > 0) {
        filtered[partyName] = matchingThemes;
      }
    });
    return filtered;
  }, [themesByParty, searchQuery]);

  // Trouver le thème sélectionné
  const selectedTheme = useMemo(() => {
    if (!selected) return null;
    return partyThemes.find(theme => theme.id === selected);
  }, [selected, partyThemes]);

  // Trouver la fête du thème sélectionné
  const selectedThemeParty = selectedTheme ? selectedTheme.party_name : null;

  return (
    <div className="space-y-4">
      {/* En-tête avec statistiques */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-light text-gray-900 flex items-center gap-2"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            fontWeight: 300,
          }}
        >
          <Sparkles className="w-4 h-4" />
          {t('editCardForm.design.partyThemes') || 'Thèmes de Fêtes'}
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
            {t('editCardForm.design.themesAvailable', { count: partyThemes.length }) || `${partyThemes.length} thèmes disponibles`}
          </span>
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="text-xs px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          >
            {viewMode === 'grid' ? 'Liste' : 'Grille'}
          </button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un thème de fête..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-200 focus:border-gray-900 bg-white font-light"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            fontWeight: 300,
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Liste des fêtes avec filtres */}
      {Object.keys(filteredThemesByParty).length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedParty(null)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all flex items-center gap-1.5 ${
              !selectedParty
                ? 'bg-gray-900 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Calendar className="w-3 h-3" />
            Toutes les fêtes
          </button>
          {Object.keys(filteredThemesByParty).map((partyName) => {
            const count = filteredThemesByParty[partyName].length;
            return (
              <button
                key={partyName}
                type="button"
                onClick={() => setSelectedParty(selectedParty === partyName ? null : partyName)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all flex items-center gap-1.5 ${
                  selectedParty === partyName
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                {partyName} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Affichage des thèmes */}
      <div className="space-y-6 max-h-[32rem] overflow-y-auto pr-2">
        <AnimatePresence mode="wait">
          {Object.keys(filteredThemesByParty).length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12 text-gray-500"
            >
              <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Aucun thème trouvé</p>
              {searchQuery && (
                <p className="text-xs text-gray-400 mt-1">Essayez une autre recherche</p>
              )}
            </motion.div>
          ) : (
            Object.entries(filteredThemesByParty)
              .filter(([partyName]) => !selectedParty || selectedParty === partyName)
              .map(([partyName, themes]) => (
                <motion.div
                  key={partyName}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  {/* En-tête de la fête */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-600" />
                      <h4 className="text-sm font-light text-gray-900"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{partyName}</h4>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {themes.length} {themes.length > 1 ? 'thèmes' : 'thème'}
                      </span>
                    </div>
                  </div>

                  {/* Grille de thèmes */}
                  <div className={`${viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-2'}`}>
                    {themes.map((theme) => {
                      const isSelected = selected === theme.id;
                      const imageUrl = theme.image_url || theme.preview_image_url;
                      
                      return (
                        <motion.button
                          key={theme.id}
                          type="button"
                          onClick={() => onChange(theme.id)}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className={`relative group rounded-lg border overflow-hidden transition-all ${
                            isSelected
                              ? 'border-gray-200 ring-1 ring-gray-200 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md'
                          }`}
                        >
                          {/* Image du thème */}
                          {imageUrl ? (
                            <div className="relative w-full h-32 overflow-hidden bg-gray-100">
                              <img
                                src={imageUrl}
                                alt={theme.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute inset-0 bg-gray-900/30 flex items-center justify-center"
                                >
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg"
                                  >
                                    <Check className="w-6 h-6 text-gray-900" />
                                  </motion.div>
                                </motion.div>
                              )}
                            </div>
                          ) : (
                            <div className={`w-full h-32 flex items-center justify-center ${
                              theme.background_color || 'bg-gray-100'
                            }`}>
                              <Sparkles className={`w-8 h-8 ${
                                theme.accent_color || 'text-pink-500'
                              }`} />
                            </div>
                          )}

                          {/* Informations du thème */}
                          <div className="p-3 bg-white">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm font-semibold truncate ${
                                  isSelected ? 'text-gray-900' : 'text-gray-900'
                                }`}>
                                  {theme.name}
                                </div>
                                {theme.is_premium && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Crown className="w-3 h-3 text-amber-500" />
                                    <span className="text-xs text-amber-600 font-medium">Premium</span>
                                  </div>
                                )}
                              </div>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0"
                                >
                                  <Check className="w-4 h-4 text-white" />
                                </motion.div>
                              )}
                            </div>
                          </div>

                          {/* Badge de sélection */}
                          {isSelected && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center shadow-lg z-10"
                            >
                              <Check className="w-4 h-4 text-white" />
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              ))
          )}
        </AnimatePresence>
      </div>
      
      {/* Info du thème sélectionné */}
      {selectedTheme && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gray-50 rounded-lg border border-gray-200"
        >
          <div className="flex items-center gap-3">
            {selectedTheme.image_url && (
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                <img
                  src={selectedTheme.image_url}
                  alt={selectedTheme.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="text-sm font-light text-gray-900"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >{selectedTheme.name}</div>
                {selectedTheme.is_premium && (
                  <Crown className="w-4 h-4 text-amber-500" />
                )}
              </div>
              <div className="text-xs text-gray-600">
                {t('editCardForm.design.selectedTheme') || 'Thème sélectionné'}: {selectedTheme.party_name}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Message si aucune fête active */}
      {activeParties.length === 0 && partyThemes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">Aucune fête active pour le moment</p>
          <p className="text-xs text-gray-400 mt-1">Les thèmes de fêtes apparaîtront ici lorsqu'ils seront disponibles</p>
        </div>
      )}
    </div>
  );
};

export default PartyThemeSelector;
