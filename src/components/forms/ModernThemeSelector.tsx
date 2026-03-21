/**
 * ModernThemeSelector Component - Version Premium
 * 
 * Sélecteur de thème avec catégories, thèmes prédéfinis et UX premium
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/hooks/useLanguage';
import { Palette, Sparkles, Briefcase, Heart, Zap, Search, X } from 'lucide-react';

interface SelectorProps {
  value: string;
  onChange: (value: string) => void;
}

// Catégories de thèmes avec thèmes prédéfinis
const THEME_CATEGORIES = {
  professional: {
    name: 'Professionnel',
    icon: Briefcase,
    themes: [
      { token: 'slate-600/10', name: 'Slate Élégant', gradient: 'from-slate-600/20 to-slate-700/10' },
      { token: 'gray-600/10', name: 'Gris Classique', gradient: 'from-gray-600/20 to-gray-700/10' },
      { token: 'blue-600/10', name: 'Bleu Corporate', gradient: 'from-blue-600/20 to-blue-700/10' },
      { token: 'indigo-600/10', name: 'Indigo Pro', gradient: 'from-indigo-600/20 to-indigo-700/10' },
      { token: 'neutral-600/10', name: 'Neutre Moderne', gradient: 'from-neutral-600/20 to-neutral-700/10' },
    ]
  },
  creative: {
    name: 'Créatif',
    icon: Sparkles,
    themes: [
      { token: 'purple-600/10', name: 'Violet Créatif', gradient: 'from-purple-600/20 to-purple-700/10' },
      { token: 'fuchsia-600/10', name: 'Fuchsia Énergique', gradient: 'from-fuchsia-600/20 to-fuchsia-700/10' },
      { token: 'pink-600/10', name: 'Rose Moderne', gradient: 'from-pink-600/20 to-pink-700/10' },
      { token: 'violet-600/10', name: 'Violet Vibrant', gradient: 'from-violet-600/20 to-violet-700/10' },
      { token: 'rose-600/10', name: 'Rose Élégant', gradient: 'from-rose-600/20 to-rose-700/10' },
    ]
  },
  nature: {
    name: 'Nature',
    icon: Heart,
    themes: [
      { token: 'green-600/10', name: 'Vert Frais', gradient: 'from-green-600/20 to-green-700/10' },
      { token: 'emerald-600/10', name: 'Émeraude Luxe', gradient: 'from-emerald-600/20 to-emerald-700/10' },
      { token: 'teal-600/10', name: 'Sarcelle Océan', gradient: 'from-teal-600/20 to-teal-700/10' },
      { token: 'lime-600/10', name: 'Citron Vert', gradient: 'from-lime-600/20 to-lime-700/10' },
      { token: 'cyan-600/10', name: 'Cyan Ciel', gradient: 'from-cyan-600/20 to-cyan-700/10' },
    ]
  },
  energetic: {
    name: 'Énergique',
    icon: Zap,
    themes: [
      { token: 'orange-600/10', name: 'Orange Dynamique', gradient: 'from-orange-600/20 to-orange-700/10' },
      { token: 'amber-600/10', name: 'Ambre Chaleureux', gradient: 'from-amber-600/20 to-amber-700/10' },
      { token: 'yellow-600/10', name: 'Jaune Lumineux', gradient: 'from-yellow-600/20 to-yellow-700/10' },
      { token: 'red-600/10', name: 'Rouge Passion', gradient: 'from-red-600/20 to-red-700/10' },
    ]
  },
  classic: {
    name: 'Classique',
    icon: Palette,
    themes: [
      { token: 'stone-600/10', name: 'Pierre Naturelle', gradient: 'from-stone-600/20 to-stone-700/10' },
      { token: 'zinc-600/10', name: 'Zinc Industriel', gradient: 'from-zinc-600/20 to-zinc-700/10' },
      { token: 'slate-500/10', name: 'Ardoise Douce', gradient: 'from-slate-500/20 to-slate-600/10' },
      { token: 'gray-500/10', name: 'Gris Doux', gradient: 'from-gray-500/20 to-gray-600/10' },
    ]
  }
};

// Tous les tokens pour la vue complète
const ALL_COLOR_TOKENS = [
  'slate-500/10','slate-600/10','slate-700/10',
  'gray-500/10','gray-600/10','gray-700/10',
  'zinc-500/10','zinc-600/10','zinc-700/10',
  'neutral-500/10','neutral-600/10','neutral-700/10',
  'stone-500/10','stone-600/10','stone-700/10',
  'red-500/10','red-600/10','red-700/10',
  'orange-500/10','orange-600/10','orange-700/10',
  'amber-500/10','amber-600/10','amber-700/10',
  'yellow-500/10','yellow-600/10','yellow-700/10',
  'lime-500/10','lime-600/10','lime-700/10',
  'green-500/10','green-600/10','green-700/10',
  'emerald-500/10','emerald-600/10','emerald-700/10',
  'teal-500/10','teal-600/10','teal-700/10',
  'cyan-500/10','cyan-600/10','cyan-700/10',
  'sky-500/10','sky-600/10','sky-700/10',
  'blue-500/10','blue-600/10','blue-700/10',
  'indigo-500/10','indigo-600/10','indigo-700/10',
  'violet-500/10','violet-600/10','violet-700/10',
  'purple-500/10','purple-600/10','purple-700/10',
  'fuchsia-500/10','fuchsia-600/10','fuchsia-700/10',
  'pink-500/10','pink-600/10','pink-700/10',
  'rose-500/10','rose-600/10','rose-700/10'
];

const colorClassMap: Record<string, string> = {
  'slate-500/10': 'bg-slate-500/10','slate-600/10': 'bg-slate-600/10','slate-700/10': 'bg-slate-700/10',
  'gray-500/10': 'bg-gray-500/10','gray-600/10': 'bg-gray-600/10','gray-700/10': 'bg-gray-700/10',
  'zinc-500/10': 'bg-zinc-500/10','zinc-600/10': 'bg-zinc-600/10','zinc-700/10': 'bg-zinc-700/10',
  'neutral-500/10': 'bg-neutral-500/10','neutral-600/10': 'bg-neutral-600/10','neutral-700/10': 'bg-neutral-700/10',
  'stone-500/10': 'bg-stone-500/10','stone-600/10': 'bg-stone-600/10','stone-700/10': 'bg-stone-700/10',
  'red-500/10': 'bg-red-600/10','red-600/10': 'bg-red-600/10','red-700/10': 'bg-red-600/10',
  'orange-500/10': 'bg-orange-500/10','orange-600/10': 'bg-orange-600/10','orange-700/10': 'bg-orange-700/10',
  'amber-500/10': 'bg-amber-500/10','amber-600/10': 'bg-amber-600/10','amber-700/10': 'bg-amber-700/10',
  'yellow-500/10': 'bg-yellow-500/10','yellow-600/10': 'bg-yellow-600/10','yellow-700/10': 'bg-yellow-700/10',
  'lime-500/10': 'bg-lime-500/10','lime-600/10': 'bg-lime-600/10','lime-700/10': 'bg-lime-700/10',
  'green-500/10': 'bg-green-500/10','green-600/10': 'bg-green-600/10','green-700/10': 'bg-green-700/10',
  'emerald-500/10': 'bg-emerald-500/10','emerald-600/10': 'bg-emerald-600/10','emerald-700/10': 'bg-emerald-700/10',
  'teal-500/10': 'bg-teal-500/10','teal-600/10': 'bg-teal-600/10','teal-700/10': 'bg-teal-700/10',
  'cyan-500/10': 'bg-cyan-500/10','cyan-600/10': 'bg-cyan-600/10','cyan-700/10': 'bg-cyan-700/10',
  'sky-500/10': 'bg-sky-500/10','sky-600/10': 'bg-sky-600/10','sky-700/10': 'bg-sky-700/10',
  'blue-500/10': 'bg-blue-500/10','blue-600/10': 'bg-blue-600/10','blue-700/10': 'bg-blue-700/10',
  'indigo-500/10': 'bg-indigo-500/10','indigo-600/10': 'bg-indigo-600/10','indigo-700/10': 'bg-indigo-700/10',
  'violet-500/10': 'bg-violet-500/10','violet-600/10': 'bg-violet-600/10','violet-700/10': 'bg-violet-700/10',
  'purple-500/10': 'bg-purple-500/10','purple-600/10': 'bg-purple-600/10','purple-700/10': 'bg-purple-700/10',
  'fuchsia-500/10': 'bg-fuchsia-500/10','fuchsia-600/10': 'bg-fuchsia-600/10','fuchsia-700/10': 'bg-fuchsia-700/10',
  'pink-500/10': 'bg-pink-500/10','pink-600/10': 'bg-pink-600/10','pink-700/10': 'bg-pink-700/10',
  'rose-500/10': 'bg-rose-500/10','rose-600/10': 'bg-rose-600/10','rose-700/10': 'bg-rose-700/10'
};

export const ModernThemeSelector: React.FC<SelectorProps> = ({ value, onChange }) => {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<'categories' | 'all'>('categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const selected = value as unknown;
  const selectedLabel = typeof selected === 'string' ? selected : undefined;

  // Trouver le thème sélectionné dans les catégories
  const findSelectedTheme = () => {
    for (const [key, category] of Object.entries(THEME_CATEGORIES)) {
      const theme = category.themes.find(t => t.token === value);
      if (theme) return { category: key, theme };
    }
    return null;
  };

  const selectedThemeInfo = findSelectedTheme();

  // Filtrer les thèmes selon la recherche
  const filteredCategories = Object.entries(THEME_CATEGORIES).filter(([key, category]) => {
    if (searchQuery) {
      return category.themes.some(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* En-tête avec recherche et vue */}
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-light text-gray-900 flex items-center gap-2"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            fontWeight: 300,
          }}
        >
          <Palette className="w-4 h-4" />
          {t('editCardForm.design.themeLabel') || 'Thème de couleur'}
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'categories' ? 'all' : 'categories')}
            className="text-xs px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          >
            {viewMode === 'categories' ? 'Tous' : 'Catégories'}
          </button>
        </div>
      </div>

      {/* Barre de recherche */}
      {viewMode === 'categories' && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un thème..."
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
      )}

      {/* Vue par catégories */}
      {viewMode === 'categories' ? (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {filteredCategories.map(([key, category]) => {
            const Icon = category.icon;
            const isCategorySelected = selectedCategory === key;
            
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <button
                  type="button"
                  onClick={() => setSelectedCategory(isCategorySelected ? null : key)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">{category.name}</span>
                    <span className="text-xs text-gray-500">({category.themes.length})</span>
                  </div>
                  <motion.div
                    animate={{ rotate: isCategorySelected ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="text-gray-400">▼</span>
                  </motion.div>
                </button>

                <AnimatePresence>
                  {(isCategorySelected || !selectedCategory) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-5 gap-2 p-2 bg-gray-50/50 rounded-lg">
                        {category.themes.map((theme) => {
                          const isSelected = selected === theme.token;
                          const bgClass = colorClassMap[theme.token] || 'bg-gray-500/10';
                          
                          return (
                            <motion.button
                              key={theme.token}
                              type="button"
                              onClick={() => onChange(theme.token)}
                              whileHover={{ scale: 1.1, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              className={`relative group`}
                            >
                              <div className={`w-12 h-12 rounded-lg border transition-all ${bgClass} ${isSelected ? 'ring-1 ring-gray-200 border-gray-200 shadow-sm' : 'border-gray-200 hover:border-gray-300 shadow-sm'}`}>
                                {isSelected && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute inset-0 flex items-center justify-center"
                                  >
                                    <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center">
                                      <span className="text-white text-xs">✓</span>
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                              <div className="mt-1 text-xs text-center text-gray-600 group-hover:text-gray-900 transition-colors truncate">
                                {theme.name}
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Vue complète */
        <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-2 max-h-96 overflow-y-auto pr-2">
          {ALL_COLOR_TOKENS.map((token) => {
            const isSelected = selected === token;
            const bgClass = colorClassMap[token] || 'bg-gray-500/10';
            
            return (
              <motion.button
                key={token}
                type="button"
                onClick={() => onChange(token)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`relative w-10 h-10 rounded-lg border-2 backdrop-blur-xl shadow-md transition-all ${bgClass} ${isSelected ? 'ring-2 ring-gray-900 border-gray-900' : 'border-white/40 hover:border-gray-300'}`}
                title={token}
              >
                {isSelected && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-1 -bottom-1 w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-lg text-xs"
                  >
                    ✓
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Info du thème sélectionné */}
      {selectedThemeInfo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-gray-50 rounded-lg border border-gray-200"
        >
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg ${colorClassMap[value] || 'bg-gray-500/10'} border border-gray-200`} />
              <div>
                <div className="text-sm font-light text-gray-900"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >{selectedThemeInfo.theme.name}</div>
              <div className="text-xs text-gray-600">{THEME_CATEGORIES[selectedThemeInfo.category as keyof typeof THEME_CATEGORIES].name}</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ModernThemeSelector;
