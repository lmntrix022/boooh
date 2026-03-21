/**
 * FontSelector Component - Version Premium
 * 
 * Sélecteur de police avec catégories, recherche et aperçu amélioré
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/hooks/useLanguage';
import { Type, Search, X, TrendingUp, BookOpen, Code, Sparkles } from 'lucide-react';

interface SelectorProps {
  value: string;
  onChange: (value: string) => void;
}

// Mapping utilitaire: classe tailwind -> libellé humain + nom Google
export const FONT_MAP: Record<string, { label: string; google: string; category: 'sans' | 'serif' | 'display' | 'mono' }> = {
  // Sans-serif (Modernes)
  'font-inter': { label: 'Inter', google: 'Inter', category: 'sans' },
  'font-poppins': { label: 'Poppins', google: 'Poppins', category: 'sans' },
  'font-manrope': { label: 'Manrope', google: 'Manrope', category: 'sans' },
  'font-montserrat': { label: 'Montserrat', google: 'Montserrat', category: 'sans' },
  'font-dm-sans': { label: 'DM Sans', google: 'DM+Sans', category: 'sans' },
  'font-nunito': { label: 'Nunito', google: 'Nunito', category: 'sans' },
  'font-nunito-sans': { label: 'Nunito Sans', google: 'Nunito+Sans', category: 'sans' },
  'font-outfit': { label: 'Outfit', google: 'Outfit', category: 'sans' },
  'font-plus-jakarta': { label: 'Plus Jakarta', google: 'Plus+Jakarta+Sans', category: 'sans' },
  'font-rubik': { label: 'Rubik', google: 'Rubik', category: 'sans' },
  'font-urbanist': { label: 'Urbanist', google: 'Urbanist', category: 'sans' },
  'font-raleway': { label: 'Raleway', google: 'Raleway', category: 'sans' },
  'font-lato': { label: 'Lato', google: 'Lato', category: 'sans' },
  'font-open-sans': { label: 'Open Sans', google: 'Open+Sans', category: 'sans' },
  'font-roboto': { label: 'Roboto', google: 'Roboto', category: 'sans' },
  'font-roboto-condensed': { label: 'Roboto Condensed', google: 'Roboto+Condensed', category: 'sans' },
  'font-worksans': { label: 'Work Sans', google: 'Work+Sans', category: 'sans' },
  'font-quicksand': { label: 'Quicksand', google: 'Quicksand', category: 'sans' },
  'font-josefin': { label: 'Josefin Sans', google: 'Josefin+Sans', category: 'sans' },
  'font-lexend': { label: 'Lexend', google: 'Lexend', category: 'sans' },
  'font-mulish': { label: 'Mulish', google: 'Mulish', category: 'sans' },
  'font-barlow': { label: 'Barlow', google: 'Barlow', category: 'sans' },
  'font-oxygen': { label: 'Oxygen', google: 'Oxygen', category: 'sans' },
  'font-asap': { label: 'Asap', google: 'Asap', category: 'sans' },
  'font-fira-sans': { label: 'Fira Sans', google: 'Fira+Sans', category: 'sans' },
  'font-source-sans': { label: 'Source Sans 3', google: 'Source+Sans+3', category: 'sans' },
  'font-space-grotesk': { label: 'Space Grotesk', google: 'Space+Grotesk', category: 'sans' },
  'font-karla': { label: 'Karla', google: 'Karla', category: 'sans' },
  'font-overpass': { label: 'Overpass', google: 'Overpass', category: 'sans' },
  'font-cabin': { label: 'Cabin', google: 'Cabin', category: 'sans' },
  'font-pt-sans': { label: 'PT Sans', google: 'PT+Sans', category: 'sans' },
  'font-heebo': { label: 'Heebo', google: 'Heebo', category: 'sans' },
  'font-be-vietnam-pro': { label: 'Be Vietnam Pro', google: 'Be+Vietnam+Pro', category: 'sans' },
  'font-syne': { label: 'Syne', google: 'Syne', category: 'sans' },
  'font-ubuntu': { label: 'Ubuntu', google: 'Ubuntu', category: 'sans' },
  'font-titillium': { label: 'Titillium Web', google: 'Titillium+Web', category: 'sans' },
  
  // Serif (Classiques)
  'font-playfair': { label: 'Playfair Display', google: 'Playfair+Display', category: 'serif' },
  'font-merriweather': { label: 'Merriweather', google: 'Merriweather', category: 'serif' },
  'font-lora': { label: 'Lora', google: 'Lora', category: 'serif' },
  'font-dm-serif': { label: 'DM Serif Text', google: 'DM+Serif+Text', category: 'serif' },
  'font-dm-serif-display': { label: 'DM Serif Display', google: 'DM+Serif+Display', category: 'serif' },
  'font-cormorant': { label: 'Cormorant', google: 'Cormorant', category: 'serif' },
  'font-cormorant-garamond': { label: 'Cormorant Garamond', google: 'Cormorant+Garamond', category: 'serif' },
  'font-crimson-pro': { label: 'Crimson Pro', google: 'Crimson+Pro', category: 'serif' },
  'font-eb-garamond': { label: 'EB Garamond', google: 'EB+Garamond', category: 'serif' },
  'font-alegreya': { label: 'Alegreya', google: 'Alegreya', category: 'serif' },
  'font-spectral': { label: 'Spectral', google: 'Spectral', category: 'serif' },
  'font-ibm-plex-serif': { label: 'IBM Plex Serif', google: 'IBM+Plex+Serif', category: 'serif' },
  
  // Display (Impact)
  'font-anton': { label: 'Anton', google: 'Anton', category: 'display' },
  'font-bebas': { label: 'Bebas Neue', google: 'Bebas+Neue', category: 'display' },
  'font-bebas-neue': { label: 'Bebas Neue', google: 'Bebas+Neue', category: 'display' },
  'font-abril-fatface': { label: 'Abril Fatface', google: 'Abril+Fatface', category: 'display' },
  'font-oswald': { label: 'Oswald', google: 'Oswald', category: 'display' },
  'font-righteous': { label: 'Righteous', google: 'Righteous', category: 'display' },
  'font-paytone': { label: 'Paytone One', google: 'Paytone+One', category: 'display' },
  'font-saira': { label: 'Saira', google: 'Saira', category: 'display' },
  'font-zen-kaku': { label: 'Zen Kaku Gothic', google: 'Zen+Kaku+Gothic+New', category: 'display' },
  
  // Monospace (Code)
  'font-space-mono': { label: 'Space Mono', google: 'Space+Mono', category: 'mono' },
  'font-ibm-plex-mono': { label: 'IBM Plex Mono', google: 'IBM+Plex+Mono', category: 'mono' },
  'font-ibm-plex-sans': { label: 'IBM Plex Sans', google: 'IBM+Plex+Sans', category: 'mono' },
  'font-jetbrains-mono': { label: 'JetBrains Mono', google: 'JetBrains+Mono', category: 'mono' },
  'font-fira-code': { label: 'Fira Code', google: 'Fira+Code', category: 'mono' },
  'font-source-code-pro': { label: 'Source Code Pro', google: 'Source+Code+Pro', category: 'mono' },
};

const CATEGORIES = {
  sans: { name: 'Sans-serif', icon: Type, description: 'Modernes et lisibles' },
  serif: { name: 'Serif', icon: BookOpen, description: 'Classiques et élégantes' },
  display: { name: 'Display', icon: Sparkles, description: 'Impactantes et créatives' },
  mono: { name: 'Monospace', icon: Code, description: 'Techniques et précises' },
};

export const FontSelector: React.FC<SelectorProps> = ({ value, onChange }) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const current = typeof value === 'string' ? value : 'font-poppins';

  // Filtrer les polices
  const filteredFonts = useMemo(() => {
    const fonts = Object.entries(FONT_MAP);
    
    return fonts.filter(([key, font]) => {
      const matchesSearch = !searchQuery || 
        font.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        key.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !selectedCategory || font.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Grouper par catégorie
  const fontsByCategory = useMemo(() => {
    const grouped: Record<string, Array<[string, typeof FONT_MAP[string]]>> = {};
    filteredFonts.forEach(([key, font]) => {
      if (!grouped[font.category]) grouped[font.category] = [];
      grouped[font.category].push([key, font]);
    });
    return grouped;
  }, [filteredFonts]);

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-light text-gray-900 flex items-center gap-2"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            fontWeight: 300,
          }}
        >
          <Type className="w-4 h-4" />
          {t('editCardForm.design.font') || 'Police de caractères'}
        </label>
        <button
          type="button"
          onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          className="text-xs px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
        >
          {viewMode === 'grid' ? 'Liste' : 'Grille'}
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher une police..."
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

      {/* Filtres par catégorie */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
            !selectedCategory
              ? 'bg-gray-900 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Toutes
        </button>
        {Object.entries(CATEGORIES).map(([key, cat]) => {
          const Icon = cat.icon;
          const count = fontsByCategory[key]?.length || 0;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all flex items-center gap-1.5 ${
                selectedCategory === key
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-3 h-3" />
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Liste des polices */}
      <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : 'space-y-2'} max-h-96 overflow-y-auto pr-2`}>
        <AnimatePresence mode="wait">
          {filteredFonts.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="col-span-full text-center py-8 text-gray-500"
            >
              Aucune police trouvée
            </motion.div>
          ) : (
            filteredFonts.map(([key, font]) => {
              const isSelected = current === key;
              const categoryInfo = CATEGORIES[font.category];
              
              return (
                <motion.button
                  key={key}
                  type="button"
                  onClick={() => onChange(key)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-gray-50 text-gray-900 border-gray-200 shadow-sm ring-1 ring-gray-200'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-sm'
                  } ${key}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`text-base font-light ${isSelected ? 'text-gray-900' : 'text-gray-900'}`}
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          {font.label}
                        </div>
                        {isSelected && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-5 h-5 rounded-full bg-white text-gray-900 flex items-center justify-center text-xs"
                          >
                            ✓
                          </motion.span>
                        )}
                      </div>
                      <div className={`text-xs ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                        {categoryInfo.name} • {font.label}
                      </div>
                      {viewMode === 'list' && (
                        <div className={`text-xs mt-2 ${isSelected ? 'text-gray-400' : 'text-gray-400'}`}>
                          ABCDEFGHIJKLMNOPQRSTUVWXYZ
                        </div>
                      )}
                    </div>
                    {viewMode === 'grid' && (
                      <div className={`text-2xl font-light ${isSelected ? 'text-gray-600' : 'text-gray-400'}`}
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        Aa
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Aperçu de la police sélectionnée */}
      {current && FONT_MAP[current] && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200"
        >
          <div className="text-xs text-gray-600 mb-2">Aperçu</div>
          <div className={`text-2xl font-light text-gray-900 ${current}`}
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            {FONT_MAP[current].label}
          </div>
          <div className={`text-sm text-gray-700 mt-1 ${current}`}>
            The quick brown fox jumps over the lazy dog
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default FontSelector;
