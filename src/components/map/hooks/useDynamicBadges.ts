// Hook pour calculer et gérer les badges dynamiques des éléments
import { useMemo } from 'react';
import { DynamicBadge, DynamicBadgeType, MapProduct, MapService, MapBusiness } from '../types';

// Configuration des badges
const BADGE_CONFIG: Record<DynamicBadgeType, Omit<DynamicBadge, 'type'>> = {
  trending: {
    label: 'Tendance',
    icon: '🔥',
    color: '#F97316',
    bgColor: '#FFF7ED',
    priority: 10,
  },
  new: {
    label: 'Nouveau',
    icon: '🆕',
    color: '#10B981',
    bgColor: '#ECFDF5',
    priority: 8,
  },
  limited: {
    label: 'Offre limitée',
    icon: '⏳',
    color: '#EF4444',
    bgColor: '#FEF2F2',
    priority: 9,
  },
  flash: {
    label: 'Flash',
    icon: '⚡',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    priority: 10,
  },
  bestseller: {
    label: 'Best-seller',
    icon: '🏆',
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
    priority: 7,
  },
  verified: {
    label: 'Vérifié',
    icon: '✓',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    priority: 5,
  },
  eco: {
    label: 'Éco',
    icon: '🌱',
    color: '#22C55E',
    bgColor: '#F0FDF4',
    priority: 4,
  },
};

// Constantes pour le calcul des badges
const NEW_THRESHOLD_DAYS = 7;
const TRENDING_VIEWS_THRESHOLD = 50;
const TRENDING_SALES_THRESHOLD = 10;
const BESTSELLER_SALES_THRESHOLD = 100;
const LOW_STOCK_THRESHOLD = 5;

interface BadgeCalculationResult {
  badges: DynamicBadge[];
  primaryBadge: DynamicBadge | null;
}

// Calculer si un élément est nouveau
function isNew(createdAt?: string): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  const now = new Date();
  const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= NEW_THRESHOLD_DAYS;
}

// Calculer si un élément est en tendance
function isTrending(viewsCount?: number, salesCount?: number): boolean {
  return (viewsCount || 0) >= TRENDING_VIEWS_THRESHOLD || 
         (salesCount || 0) >= TRENDING_SALES_THRESHOLD;
}

// Calculer si c'est un best-seller
function isBestseller(salesCount?: number): boolean {
  return (salesCount || 0) >= BESTSELLER_SALES_THRESHOLD;
}

// Calculer si c'est une offre limitée (stock bas + promo)
function isLimitedOffer(
  stockCount?: number, 
  isPromotion?: boolean,
  promotionPercent?: number
): boolean {
  const hasLowStock = (stockCount || 0) > 0 && (stockCount || 0) <= LOW_STOCK_THRESHOLD;
  const hasGoodPromo = isPromotion && (promotionPercent || 0) >= 20;
  return hasLowStock || hasGoodPromo;
}

// Calculer si c'est un flash deal
function isFlashDeal(isPromotion?: boolean, promotionPercent?: number): boolean {
  return isPromotion === true && (promotionPercent || 0) >= 30;
}

// Créer un badge complet
function createBadge(type: DynamicBadgeType): DynamicBadge {
  return {
    type,
    ...BADGE_CONFIG[type],
  };
}

// Hook principal pour calculer les badges d'un produit
export function useProductBadges(product: MapProduct): BadgeCalculationResult {
  return useMemo(() => {
    const badges: DynamicBadge[] = [];

    // Vérifier chaque condition de badge
    if (isFlashDeal(product.is_promotion, product.promotion_percent)) {
      badges.push(createBadge('flash'));
    } else if (isLimitedOffer(product.stock_count, product.is_promotion, product.promotion_percent)) {
      badges.push(createBadge('limited'));
    }

    if (isBestseller(product.sales_count)) {
      badges.push(createBadge('bestseller'));
    } else if (isTrending(product.views_count, product.sales_count)) {
      badges.push(createBadge('trending'));
    }

    if (isNew(product.created_at)) {
      badges.push(createBadge('new'));
    }

    // Trier par priorité
    badges.sort((a, b) => b.priority - a.priority);

    return {
      badges,
      primaryBadge: badges[0] || null,
    };
  }, [product]);
}

// Hook principal pour calculer les badges d'un service
export function useServiceBadges(service: MapService): BadgeCalculationResult {
  return useMemo(() => {
    const badges: DynamicBadge[] = [];

    if (isFlashDeal(service.is_promotion, service.promotion_percent)) {
      badges.push(createBadge('flash'));
    }

    if (isTrending((service as any).views_count, (service as any).bookings_count)) {
      badges.push(createBadge('trending'));
    }

    if (isNew((service as any).created_at)) {
      badges.push(createBadge('new'));
    }

    // Trier par priorité
    badges.sort((a, b) => b.priority - a.priority);

    return {
      badges,
      primaryBadge: badges[0] || null,
    };
  }, [service]);
}

// Hook pour calculer les badges d'un business
export function useBusinessBadges(business: MapBusiness): BadgeCalculationResult {
  return useMemo(() => {
    const badges: DynamicBadge[] = [];

    if (business.has_promotions) {
      badges.push(createBadge('limited'));
    }

    if (isNew(business.created_at)) {
      badges.push(createBadge('new'));
    }

    // Un business très actif est considéré comme trending
    const totalItems = (business.products_count || 0) + (business.services_count || 0);
    if (totalItems >= 10) {
      badges.push(createBadge('trending'));
    }

    // Trier par priorité
    badges.sort((a, b) => b.priority - a.priority);

    return {
      badges,
      primaryBadge: badges[0] || null,
    };
  }, [business]);
}

// Fonction utilitaire pour enrichir un tableau d'éléments avec leurs badges
export function enrichWithBadges<T extends MapProduct | MapService | MapBusiness>(
  items: T[],
  type: 'product' | 'service' | 'business'
): (T & { badges: DynamicBadge[]; primaryBadge: DynamicBadge | null })[] {
  return items.map((item) => {
    const badges: DynamicBadge[] = [];

    if (type === 'product') {
      const product = item as MapProduct;
      if (isFlashDeal(product.is_promotion, product.promotion_percent)) {
        badges.push(createBadge('flash'));
      } else if (isLimitedOffer(product.stock_count, product.is_promotion, product.promotion_percent)) {
        badges.push(createBadge('limited'));
      }
      if (isBestseller(product.sales_count)) {
        badges.push(createBadge('bestseller'));
      } else if (isTrending(product.views_count, product.sales_count)) {
        badges.push(createBadge('trending'));
      }
      if (isNew(product.created_at)) {
        badges.push(createBadge('new'));
      }
    } else if (type === 'service') {
      const service = item as MapService;
      if (isFlashDeal(service.is_promotion, service.promotion_percent)) {
        badges.push(createBadge('flash'));
      }
      if (isTrending((service as any).views_count, (service as any).bookings_count)) {
        badges.push(createBadge('trending'));
      }
      if (isNew((service as any).created_at)) {
        badges.push(createBadge('new'));
      }
    } else {
      const business = item as MapBusiness;
      if (business.has_promotions) {
        badges.push(createBadge('limited'));
      }
      if (isNew(business.created_at)) {
        badges.push(createBadge('new'));
      }
    }

    badges.sort((a, b) => b.priority - a.priority);

    return {
      ...item,
      badges,
      primaryBadge: badges[0] || null,
    };
  });
}

// Export des constantes pour réutilisation
export { BADGE_CONFIG, NEW_THRESHOLD_DAYS };

