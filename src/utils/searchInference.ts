// Moteur d'Inférence Local pour Recherche Intelligente
// Analyse sémantique sans backend lourd

export interface SearchIntent {
  category?: 'products' | 'services' | 'food' | 'beauty' | 'all';
  priceRange?: 'economy' | 'mid' | 'premium' | 'luxury';
  distance?: 'near' | 'medium' | 'far';
  urgency?: boolean;
  sortBy?: 'distance' | 'price' | 'rating' | 'popularity' | 'newest';
  promotions?: boolean;
  tags: Array<{ label: string; key: string; removable?: boolean }>;
  // Nouvelles fonctionnalités
  viewportAction?: {
    zoom?: number;
    centerOnUser?: boolean;
    reason: 'near' | 'rare' | 'none';
  };
  minRating?: number; // Pour "bien noté/fiable"
  isRareSearch?: boolean; // Pour recherches rares nécessitant un dézoom
}

// Dictionnaires de mots-clés pour l'analyse sémantique
const INTENT_KEYWORDS = {
  food: ['faim', 'manger', 'restaurant', 'resto', 'bouffe', 'repas', 'cuisine', 'food', 'pizza', 'burger', 'sushi', 'café', 'cafe', 'manger', 'déjeuner', 'dejeuner', 'dîner', 'diner', 'snack'],
  products: ['acheter', 'produit', 'article', 'achat', 'shopping', 'magasin', 'boutique', 'commander', 'acheter', 'achat'],
  services: ['service', 'réparer', 'reparer', 'réparation', 'reparation', 'formation', 'cours', 'coaching', 'design', 'développement', 'dev', 'réparer', 'réparer'],
  // Talents/Compétences (distinction produits vs services)
  talents: ['plombier', 'plomberie', 'électricien', 'electricien', 'électricité', 'electricite', 'mécanicien', 'mecanicien', 'coiffeur', 'coiffeuse', 'coiffure', 'massage', 'thérapeute', 'therapeute', 'consultant', 'formateur', 'photographe', 'graphiste', 'développeur', 'developpeur', 'designer', 'architecte', 'avocat', 'comptable', 'médecin', 'medecin', 'dentiste', 'vétérinaire', 'veterinaire', 'sculpteur', 'artisan', 'artiste', 'musicien', 'professeur', 'enseignant', 'tuteur', 'tutrice'],
  // Mots-clés pour "bien noté/fiable"
  reliable: ['bien noté', 'biennote', 'fiable', 'vérifié', 'verifie', 'certifié', 'certifie', 'expert', 'professionnel', 'qualifié', 'qualifie', 'recommandé', 'recommandee', 'excellent', 'top', 'meilleur'],
  beauty: ['beauté', 'beaute', 'coiffure', 'salon', 'institut', 'esthétique', 'esthetique', 'maquillage', 'soin', 'visage', 'cheveux', 'manucure', 'pédicure', 'pedicure', 'épilation', 'epilation', 'massage', 'relaxation', 'spa', 'bien-être', 'bienetre'],
  economy: ['pas cher', 'pascher', 'économique', 'economique', 'bon marché', 'bonmarche', 'budget', 'moins cher', 'moinscher', 'gratuit', 'pas payer cher', 'paspayercher', 'peu cher', 'peucher', 'abordable', 'moins cher', 'moinscher'],
  premium: ['premium', 'luxe', 'haut de gamme', 'hautdegamme', 'qualité', 'qualite', 'top', 'meilleur', 'excellence', 'haut de gamme'],
  near: ['proche', 'près', 'pres', 'près de', 'presde', 'à côté', 'acote', 'voisin', 'local', 'autour', 'proximité', 'proximite'],
  far: ['loin', 'loin de', 'loinde', 'distant'],
  urgent: ['urgent', 'rapide', 'vite', 'immédiat', 'immediat', 'maintenant', 'tout de suite', 'toutdesuite', 'asap', 'rapidement'],
  promotions: ['promo', 'réduction', 'reduction', 'offre', 'solde', 'remise', 'discount', 'rabais', 'promotion', 'offre spéciale', 'offrespeciale'],
  popular: ['populaire', 'tendance', 'trending', 'tendances', 'recommandé', 'recommandee', 'meilleur', 'recommandation']
};

export function analyzeSearchQuery(query: string): SearchIntent {
  const lowerQuery = query.toLowerCase().trim();
  const intent: SearchIntent = {
    tags: []
  };

  if (!lowerQuery) {
    return intent;
  }

  // Normaliser la requête (supprimer accents, espaces multiples, etc.)
  const normalizedQuery = lowerQuery
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, ' '); // Supprimer la ponctuation pour meilleure détection

  // Détection de catégorie (priorité aux mots-clés les plus spécifiques)
  // D'abord vérifier les talents (compétences) qui sont toujours des services
  const talentMatches = INTENT_KEYWORDS.talents.filter(keyword => normalizedQuery.includes(keyword));
  const foodMatches = INTENT_KEYWORDS.food.filter(keyword => normalizedQuery.includes(keyword));
  const productMatches = INTENT_KEYWORDS.products.filter(keyword => normalizedQuery.includes(keyword));
  const serviceMatches = INTENT_KEYWORDS.services.filter(keyword => normalizedQuery.includes(keyword));
  const beautyMatches = INTENT_KEYWORDS.beauty.filter(keyword => normalizedQuery.includes(keyword));

  if (foodMatches.length > 0) {
    intent.category = 'food';
    intent.tags.push({ label: '🍔 Food', key: 'food', removable: true });
  } else if (beautyMatches.length > 0) {
    intent.category = 'beauty';
    intent.tags.push({ label: '💅 Beauté', key: 'beauty', removable: true });
  } else if (talentMatches.length > 0) {
    // Talents = toujours services
    intent.category = 'services';
    intent.tags.push({ label: '✨ Services', key: 'services', removable: true });
    intent.tags.push({ label: '👤 Talent', key: 'talent', removable: true });
  } else if (productMatches.length > 0) {
    intent.category = 'products';
    intent.tags.push({ label: '📦 Produits', key: 'products', removable: true });
  } else if (serviceMatches.length > 0) {
    intent.category = 'services';
    intent.tags.push({ label: '✨ Services', key: 'services', removable: true });
  } else {
    intent.category = 'all';
  }

  // Détection "bien noté/fiable"
  const reliableMatches = INTENT_KEYWORDS.reliable.filter(keyword => normalizedQuery.includes(keyword));
  if (reliableMatches.length > 0) {
    intent.minRating = 4; // Minimum 4 étoiles
    intent.sortBy = 'rating';
    intent.tags.push({ label: '⭐ Bien noté', key: 'rating', removable: true });
  }

  // Détection de contrainte de prix (avec phrases complexes)
  const economyMatches = INTENT_KEYWORDS.economy.filter(keyword => normalizedQuery.includes(keyword));
  const premiumMatches = INTENT_KEYWORDS.premium.filter(keyword => normalizedQuery.includes(keyword));
  
  if (economyMatches.length > 0) {
    intent.priceRange = 'economy';
    // Si on a déjà un tri par distance, on garde le prix comme second critère
    if (intent.sortBy !== 'distance' && intent.sortBy !== 'rating') {
      intent.sortBy = 'price';
    }
    intent.tags.push({ label: '💸 Économique', key: 'economy', removable: true });
  } else if (premiumMatches.length > 0) {
    intent.priceRange = 'premium';
    intent.tags.push({ label: '⭐ Premium', key: 'premium', removable: true });
  }

  // Détection de distance
  const nearMatches = INTENT_KEYWORDS.near.filter(keyword => normalizedQuery.includes(keyword));
  const farMatches = INTENT_KEYWORDS.far.filter(keyword => normalizedQuery.includes(keyword));
  
  if (nearMatches.length > 0) {
    intent.distance = 'near';
    if (intent.sortBy !== 'rating') {
      intent.sortBy = 'distance';
    }
    intent.tags.push({ label: '📍 Proche', key: 'near', removable: true });
    // Viewport: zoomer sur position utilisateur
    intent.viewportAction = {
      zoom: 15,
      centerOnUser: true,
      reason: 'near'
    };
  } else if (farMatches.length > 0) {
    intent.distance = 'far';
    intent.viewportAction = {
      zoom: 10,
      centerOnUser: false,
      reason: 'none'
    };
  }

  // Détection d'urgence
  if (INTENT_KEYWORDS.urgent.some(keyword => normalizedQuery.includes(keyword))) {
    intent.urgency = true;
    intent.tags.push({ label: '⚡ Urgent', key: 'urgent', removable: true });
  }

  // Détection de promotions
  if (INTENT_KEYWORDS.promotions.some(keyword => normalizedQuery.includes(keyword))) {
    intent.promotions = true;
    intent.tags.push({ label: '🎯 Promotions', key: 'promotions', removable: true });
  }

  // Détection de popularité
  if (INTENT_KEYWORDS.popular.some(keyword => normalizedQuery.includes(keyword))) {
    if (intent.sortBy !== 'rating' && intent.sortBy !== 'distance') {
      intent.sortBy = 'popularity';
    }
    intent.tags.push({ label: '🔥 Populaire', key: 'popular', removable: true });
  }

  // Détection de recherches rares (nécessite dézoom)
  const rareKeywords = ['sculpteur', 'sculpture', 'rare', 'spécialisé', 'specialise', 'expert', 'unique', 'niche'];
  const isRare = rareKeywords.some(keyword => normalizedQuery.includes(keyword)) || 
                 (talentMatches.length > 0 && normalizedQuery.length < 15); // Talents courts = recherche spécifique
  
  if (isRare && !nearMatches.length) {
    intent.isRareSearch = true;
    intent.viewportAction = {
      zoom: 8, // Dézoom pour voir plus large
      centerOnUser: false,
      reason: 'rare'
    };
  }

  // Si aucun tri spécifique, utiliser distance par défaut
  if (!intent.sortBy) {
    intent.sortBy = 'distance';
  }

  // Viewport par défaut si "Proche" n'a pas été détecté
  if (!intent.viewportAction && intent.distance !== 'near') {
    intent.viewportAction = {
      zoom: 12,
      centerOnUser: false,
      reason: 'none'
    };
  }

  return intent;
}

// Fonction pour générer des suggestions contextuelles basées sur l'heure
export function getContextualSuggestions(): Array<{ label: string; query: string; icon: string }> {
  const hour = new Date().getHours();
  const suggestions: Array<{ label: string; query: string; icon: string }> = [];

  // Suggestions basées sur l'heure
  if (hour >= 11 && hour <= 14) {
    suggestions.push({
      label: 'Déjeuner autour de moi',
      query: 'restaurant proche pas cher',
      icon: '🍽️'
    });
  } else if (hour >= 18 && hour <= 21) {
    suggestions.push({
      label: 'Services ouverts tard',
      query: 'services proche',
      icon: '🌙'
    });
  } else if (hour >= 8 && hour <= 10) {
    suggestions.push({
      label: 'Services du matin',
      query: 'services proche',
      icon: '☀️'
    });
  }

  // Suggestions générales
  suggestions.push(
    { label: 'Produits près de moi', query: 'produits proche', icon: '📍' },
    { label: 'Offres du moment', query: 'promotions', icon: '🎯' }
  );

  return suggestions;
}

export function intentToFilters(intent: SearchIntent, currentFilters: any): any {
  const newFilters = { ...currentFilters };

  // Appliquer la catégorie
  if (intent.category) {
    if (intent.category === 'food') {
      newFilters.filterType = 'food';
    } else if (intent.category === 'beauty') {
      newFilters.filterType = 'beauty';
    } else if (intent.category === 'products') {
      newFilters.filterType = 'products';
    } else if (intent.category === 'services') {
      newFilters.filterType = 'services';
    } else {
      newFilters.filterType = 'all';
    }
  }

  // Appliquer le tri
  if (intent.sortBy) {
    newFilters.sortBy = intent.sortBy;
  }

  // Appliquer les promotions
  if (intent.promotions) {
    newFilters.filterType = 'promotions';
  }

  // Appliquer les contraintes de prix (approximatif)
  if (intent.priceRange === 'economy') {
    newFilters.maxPrice = 50000; // Limite pour "économique"
  } else if (intent.priceRange === 'premium') {
    newFilters.minPrice = 100000; // Minimum pour "premium"
  }

  return newFilters;
}

