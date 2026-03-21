// Hook pour gérer l'historique de recherche et les suggestions IA personnalisées
import { useState, useEffect, useCallback, useMemo } from 'react';
import { SearchHistoryItem } from '../types';

const STORAGE_KEY = 'booh_map_search_history';
const MAX_HISTORY_ITEMS = 20;
const MAX_SUGGESTIONS = 5;

// Pondération pour le scoring des suggestions
const WEIGHT_RECENCY = 0.4;    // 40% - Plus récent = plus pertinent
const WEIGHT_FREQUENCY = 0.35; // 35% - Plus fréquent = plus pertinent
const WEIGHT_SUCCESS = 0.25;   // 25% - Plus de résultats = plus pertinent

// Types d'icônes disponibles
export type IconType = 'search' | 'clock' | 'food' | 'beauty' | 'product' | 'service' | 'location' | 'trending' | 'offer' | 'star';

export interface SearchSuggestion {
  query: string;
  type: 'recent' | 'frequent' | 'contextual' | 'trending';
  iconType: IconType;
  score: number;
  category?: string;
}

interface UseSearchHistoryResult {
  history: SearchHistoryItem[];
  suggestions: SearchSuggestion[];
  addToHistory: (query: string, category?: string, resultCount?: number) => void;
  clearHistory: () => void;
  removeFromHistory: (query: string) => void;
  getContextualSuggestions: () => SearchSuggestion[];
}

// Suggestions tendance basées sur les catégories populaires
const TRENDING_SUGGESTIONS: SearchSuggestion[] = [
  { query: 'coiffeur proche', type: 'trending', iconType: 'beauty', score: 0, category: 'beauty' },
  { query: 'restaurant pas cher', type: 'trending', iconType: 'food', score: 0, category: 'food' },
  { query: 'services à domicile', type: 'trending', iconType: 'service', score: 0, category: 'services' },
  { query: 'produits locaux', type: 'trending', iconType: 'location', score: 0, category: 'products' },
  { query: 'promos du jour', type: 'trending', iconType: 'offer', score: 0 },
];

// Suggestions contextuelles basées sur l'heure
function getTimeBased(): SearchSuggestion[] {
  const hour = new Date().getHours();
  const suggestions: SearchSuggestion[] = [];

  if (hour >= 7 && hour <= 10) {
    suggestions.push({
      query: 'petit déjeuner',
      type: 'contextual',
      iconType: 'food',
      score: 0.8,
      category: 'food',
    });
  } else if (hour >= 11 && hour <= 14) {
    suggestions.push({
      query: 'déjeuner rapide',
      type: 'contextual',
      iconType: 'food',
      score: 0.9,
      category: 'food',
    });
  } else if (hour >= 18 && hour <= 21) {
    suggestions.push({
      query: 'dîner',
      type: 'contextual',
      iconType: 'food',
      score: 0.85,
      category: 'food',
    });
  }

  // Weekend = plus de services beauté
  const dayOfWeek = new Date().getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    suggestions.push({
      query: 'salon beauté',
      type: 'contextual',
      iconType: 'beauty',
      score: 0.75,
      category: 'beauty',
    });
  }

  return suggestions;
}

// Calculer le score de pertinence d'une recherche
function calculateScore(
  item: SearchHistoryItem,
  allItems: SearchHistoryItem[]
): number {
  const now = Date.now();
  const ageInHours = (now - item.timestamp) / (1000 * 60 * 60);
  
  // Score de récence (décroissance exponentielle sur 7 jours)
  const recencyScore = Math.exp(-ageInHours / (24 * 7));
  
  // Score de fréquence
  const frequency = allItems.filter((i) => i.query === item.query).length;
  const frequencyScore = Math.min(frequency / 5, 1); // Max à 5 recherches
  
  // Score de succès (basé sur le nombre de résultats)
  const successScore = item.resultCount 
    ? Math.min(item.resultCount / 100, 1) 
    : 0.5;

  return (
    WEIGHT_RECENCY * recencyScore +
    WEIGHT_FREQUENCY * frequencyScore +
    WEIGHT_SUCCESS * successScore
  );
}

// Mapper catégorie vers type d'icône
function getCategoryIconType(category?: string): IconType {
  switch (category) {
    case 'food': return 'food';
    case 'beauty': return 'beauty';
    case 'products': return 'product';
    case 'services': return 'service';
    default: return 'search';
  }
}

// Charger l'historique depuis localStorage
function loadHistory(): SearchHistoryItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as SearchHistoryItem[];
    return parsed.slice(0, MAX_HISTORY_ITEMS);
  } catch {
    return [];
  }
}

// Sauvegarder l'historique dans localStorage
function saveHistory(history: SearchHistoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_HISTORY_ITEMS)));
  } catch {
    // Ignore storage errors
  }
}

export function useSearchHistory(): UseSearchHistoryResult {
  const [history, setHistory] = useState<SearchHistoryItem[]>(loadHistory);

  // Sauvegarder automatiquement quand l'historique change
  useEffect(() => {
    saveHistory(history);
  }, [history]);

  // Ajouter une recherche à l'historique
  const addToHistory = useCallback((
    query: string,
    category?: string,
    resultCount?: number
  ) => {
    if (!query.trim()) return;

    const newItem: SearchHistoryItem = {
      query: query.trim().toLowerCase(),
      timestamp: Date.now(),
      category,
      resultCount,
    };

    setHistory((prev) => {
      // Éviter les doublons récents (< 1 minute)
      const recentDuplicate = prev.find(
        (item) => 
          item.query === newItem.query && 
          Date.now() - item.timestamp < 60000
      );
      
      if (recentDuplicate) {
        return prev;
      }

      return [newItem, ...prev].slice(0, MAX_HISTORY_ITEMS);
    });
  }, []);

  // Supprimer une recherche de l'historique
  const removeFromHistory = useCallback((query: string) => {
    setHistory((prev) => prev.filter((item) => item.query !== query));
  }, []);

  // Effacer tout l'historique
  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Générer les suggestions basées sur l'historique et le contexte
  const suggestions = useMemo((): SearchSuggestion[] => {
    const results: SearchSuggestion[] = [];

    // 1. Ajouter les recherches récentes scorées
    const uniqueQueries = new Map<string, SearchHistoryItem>();
    history.forEach((item) => {
      if (!uniqueQueries.has(item.query)) {
        uniqueQueries.set(item.query, item);
      }
    });

    uniqueQueries.forEach((item) => {
      const score = calculateScore(item, history);
      results.push({
        query: item.query,
        type: 'recent',
        iconType: getCategoryIconType(item.category),
        score,
        category: item.category,
      });
    });

    // 2. Ajouter les suggestions contextuelles
    const contextual = getTimeBased();
    results.push(...contextual);

    // 3. Ajouter les tendances si peu d'historique
    if (results.length < MAX_SUGGESTIONS) {
      const trendingToAdd = TRENDING_SUGGESTIONS
        .filter((t) => !results.some((r) => r.query === t.query))
        .slice(0, MAX_SUGGESTIONS - results.length);
      results.push(...trendingToAdd);
    }

    // 4. Trier par score et limiter
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_SUGGESTIONS);
  }, [history]);

  // Obtenir des suggestions contextuelles spécifiques
  const getContextualSuggestions = useCallback((): SearchSuggestion[] => {
    const results: SearchSuggestion[] = [];

    // Suggestions basées sur l'heure
    results.push(...getTimeBased());

    // Analyser les catégories fréquentes de l'utilisateur
    const categoryCounts = new Map<string, number>();
    history.forEach((item) => {
      if (item.category) {
        categoryCounts.set(
          item.category,
          (categoryCounts.get(item.category) || 0) + 1
        );
      }
    });

    // Suggérer des recherches dans les catégories préférées
    const topCategories = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);

    topCategories.forEach(([category]) => {
      results.push({
        query: `${category} proche`,
        type: 'contextual',
        iconType: getCategoryIconType(category),
        score: 0.7,
        category,
      });
    });

    return results.slice(0, MAX_SUGGESTIONS);
  }, [history]);

  return {
    history,
    suggestions,
    addToHistory,
    clearHistory,
    removeFromHistory,
    getContextualSuggestions,
  };
}

// Export pour tests
export { TRENDING_SUGGESTIONS, calculateScore };
