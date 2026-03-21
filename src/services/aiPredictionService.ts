import { ScannedContact } from './scannedContactsService';
import { ContactRelations } from './crmService';

export interface NextOrderPrediction {
  probability: number;
  confidence: number;
  suggestedAction: string;
}

export interface CLVPrediction {
  predictedCLV: number;
  currentCLV: number;
  growthPotential: number;
}

export interface ChurnRisk {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  reasons: string[];
  recommendations: string[];
}

export interface ProductRecommendation {
  productType: 'physical' | 'digital';
  category: string;
  reason: string;
  confidence: number;
}

export class AIPredictionService {
  /**
   * Prédire la probabilité de commande dans les 30 prochains jours
   */
  static predictNextOrderProbability(
    contact: ScannedContact, 
    relations: ContactRelations
  ): NextOrderPrediction {
    let score = 0;
    let factors = 0;

    // Facteur 1: Récence dernière commande
    const lastOrderDate = this.getLastOrderDate(relations);
    if (lastOrderDate) {
      const daysSinceOrder = Math.floor(
        (Date.now() - lastOrderDate.getTime()) / (24 * 60 * 60 * 1000)
      );
      if (daysSinceOrder < 30) {
        score += 40;
      } else if (daysSinceOrder < 90) {
        score += 20;
      } else if (daysSinceOrder < 180) {
        score += 10;
      }
      factors++;
    }

    // Facteur 2: Fréquence des commandes
    const totalOrders = 
      relations.physicalOrders.length + 
      relations.digitalOrders.length + 
      relations.digitalPurchases.length;
    
    if (totalOrders > 5) {
      score += 30;
    } else if (totalOrders > 2) {
      score += 15;
    }
    factors++;

    // Facteur 3: Valeur moyenne commande
    const avgOrderValue = this.calculateAverageOrderValue(relations);
    if (avgOrderValue > 100000) {
      score += 20;
    } else if (avgOrderValue > 50000) {
      score += 10;
    }
    factors++;

    // Facteur 4: Engagement récent (RDV, devis)
    const recentEngagement = this.hasRecentEngagement(relations);
    if (recentEngagement) {
      score += 10;
    }
    factors++;

    const probability = Math.min(score, 100);
    const confidence = (factors / 4) * 100;

    // Suggestion d'action
    let suggestedAction = 'Aucune action nécessaire';
    if (probability > 70) {
      suggestedAction = 'Contacter pour upsell/cross-sell';
    } else if (probability > 40) {
      suggestedAction = 'Envoyer offre personnalisée';
    } else if (probability < 20 && totalOrders > 0) {
      suggestedAction = 'Risque de churn - Réengager immédiatement';
    }

    return { probability, confidence, suggestedAction };
  }

  /**
   * Calculer la Customer Lifetime Value prédite
   */
  static predictCLV(
    contact: ScannedContact, 
    relations: ContactRelations
  ): CLVPrediction {
    // CLV actuelle
    const currentCLV = this.calculateCurrentCLV(relations);

    // Prédiction basée sur patterns
    const avgOrderValue = this.calculateAverageOrderValue(relations);
    const orderFrequency = this.calculateOrderFrequency(relations);
    const retentionProbability = this.calculateRetention(relations);

    // Formule CLV simplifiée: (Valeur moyenne × Fréquence × Durée vie client)
    const predictedLifetimeMonths = 24; // 2 ans
    const predictedCLV = 
      avgOrderValue * 
      orderFrequency * 
      predictedLifetimeMonths * 
      retentionProbability;

    const growthPotential = currentCLV > 0 
      ? ((predictedCLV - currentCLV) / currentCLV) * 100 
      : 0;

    return {
      predictedCLV,
      currentCLV,
      growthPotential
    };
  }

  /**
   * Détecter le risque de churn (client qui va partir)
   */
  static detectChurnRisk(
    contact: ScannedContact, 
    relations: ContactRelations
  ): ChurnRisk {
    let churnScore = 0;
    const reasons: string[] = [];
    const recommendations: string[] = [];

    // 1. Inactivité récente
    const daysSinceLastActivity = this.getDaysSinceLastActivity(relations);
    if (daysSinceLastActivity > 90) {
      churnScore += 30;
      reasons.push(`Aucune activité depuis ${daysSinceLastActivity} jours`);
      recommendations.push('Campagne de réengagement urgente');
    } else if (daysSinceLastActivity > 60) {
      churnScore += 15;
      reasons.push('Inactivité prolongée');
      recommendations.push('Email de ré-engagement');
    }

    // 2. Diminution fréquence commandes
    const orderTrend = this.getOrderTrend(relations);
    if (orderTrend < -0.3) {
      churnScore += 25;
      reasons.push('Baisse significative des commandes');
      recommendations.push('Offre personnalisée avec remise');
    }

    // 3. Devis refusés récemment
    const recentRefusedQuotes = relations.quotes.filter(
      q => q.status === 'refused' && 
      new Date(q.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    if (recentRefusedQuotes.length > 0) {
      churnScore += 20;
      reasons.push(`${recentRefusedQuotes.length} devis refusé(s) récemment`);
      recommendations.push('Appel téléphonique pour comprendre les besoins');
    }

    // 4. Factures impayées
    const unpaidInvoices = relations.invoices.filter(i => i.status === 'sent');
    if (unpaidInvoices.length > 2) {
      churnScore += 15;
      reasons.push('Plusieurs factures impayées');
      recommendations.push('Négocier plan de paiement');
    }

    // Déterminer niveau de risque
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (churnScore >= 70) riskLevel = 'critical';
    else if (churnScore >= 50) riskLevel = 'high';
    else if (churnScore >= 30) riskLevel = 'medium';
    else riskLevel = 'low';

    return {
      riskLevel,
      score: churnScore,
      reasons,
      recommendations
    };
  }

  /**
   * Recommandations de produits (cross-sell/upsell)
   */
  static getProductRecommendations(
    contact: ScannedContact,
    relations: ContactRelations
  ): ProductRecommendation[] {
    const recommendations: ProductRecommendation[] = [];

    // Si achète physique mais pas digital → recommander digital
    if (relations.physicalOrders.length > 0 && relations.digitalOrders.length === 0) {
      recommendations.push({
        productType: 'digital',
        category: 'e-books',
        reason: 'Client de produits physiques, potentiel pour digitaux',
        confidence: 75
      });
    }

    // Si achète digital mais pas physique → recommander physique
    if (relations.digitalOrders.length > 0 && relations.physicalOrders.length === 0) {
      recommendations.push({
        productType: 'physical',
        category: 'merchandise',
        reason: 'Client digital uniquement, potentiel physique',
        confidence: 65
      });
    }

    // Client avec plusieurs achats → upsell premium
    const totalOrders = 
      relations.physicalOrders.length + 
      relations.digitalOrders.length + 
      relations.digitalPurchases.length;
    
    if (totalOrders > 3) {
      recommendations.push({
        productType: 'digital',
        category: 'premium',
        reason: 'Client fidèle, prêt pour offres premium',
        confidence: 85
      });
    }

    return recommendations;
  }

  // Méthodes helpers privées

  private static getLastOrderDate(relations: ContactRelations): Date | null {
    const allDates = [
      ...relations.physicalOrders.map(o => new Date(o.created_at)),
      ...relations.digitalOrders.map(o => new Date(o.created_at)),
      ...relations.digitalPurchases.map(p => new Date(p.created_at))
    ].sort((a, b) => b.getTime() - a.getTime());

    return allDates[0] || null;
  }

  private static calculateAverageOrderValue(relations: ContactRelations): number {
    const totalRevenue = 
      relations.physicalOrders.reduce((sum, o) => {
        const product = o.products as any;
        return sum + (product?.price || 0) * (o.quantity || 1);
      }, 0) +
      relations.digitalOrders.reduce((sum, o) => {
        const product = o.digital_products as any;
        return sum + (product?.price || 0) * (o.quantity || 1);
      }, 0) +
      relations.digitalPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);

    const totalOrders = 
      relations.physicalOrders.length + 
      relations.digitalOrders.length + 
      relations.digitalPurchases.length;

    return totalOrders > 0 ? totalRevenue / totalOrders : 0;
  }

  private static hasRecentEngagement(relations: ContactRelations): boolean {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    return (
      relations.appointments.some(a => new Date(a.date) > thirtyDaysAgo) ||
      relations.quotes.some(q => new Date(q.created_at) > thirtyDaysAgo)
    );
  }

  private static calculateCurrentCLV(relations: ContactRelations): number {
    return (
      relations.physicalOrders.reduce((sum, o) => {
        const product = o.products as any;
        return sum + (product?.price || 0) * (o.quantity || 1);
      }, 0) +
      relations.digitalOrders.reduce((sum, o) => {
        const product = o.digital_products as any;
        return sum + (product?.price || 0) * (o.quantity || 1);
      }, 0) +
      relations.digitalPurchases.reduce((sum, p) => sum + (p.amount || 0), 0) +
      relations.invoices
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + (i.total_ttc || 0), 0)
    );
  }

  private static calculateOrderFrequency(relations: ContactRelations): number {
    const totalOrders = 
      relations.physicalOrders.length + 
      relations.digitalOrders.length + 
      relations.digitalPurchases.length;
    
    if (totalOrders === 0) return 0;

    const firstOrder = this.getFirstOrderDate(relations);
    const lastOrder = this.getLastOrderDate(relations);

    if (!firstOrder || !lastOrder) return 0;

    const monthsActive = Math.max(
      (lastOrder.getTime() - firstOrder.getTime()) / (30 * 24 * 60 * 60 * 1000),
      1
    );

    return totalOrders / monthsActive; // Commandes par mois
  }

  private static calculateRetention(relations: ContactRelations): number {
    const daysSinceLastActivity = this.getDaysSinceLastActivity(relations);
    
    if (daysSinceLastActivity < 30) return 0.9;
    if (daysSinceLastActivity < 60) return 0.7;
    if (daysSinceLastActivity < 90) return 0.5;
    return 0.3;
  }

  private static getDaysSinceLastActivity(relations: ContactRelations): number {
    const allDates = [
      ...relations.appointments.map(a => new Date(a.date)),
      ...relations.quotes.map(q => new Date(q.created_at)),
      ...relations.physicalOrders.map(o => new Date(o.created_at)),
      ...relations.digitalOrders.map(o => new Date(o.created_at)),
      ...relations.digitalPurchases.map(p => new Date(p.created_at)),
      ...relations.invoices.map(i => new Date(i.created_at))
    ].sort((a, b) => b.getTime() - a.getTime());

    if (allDates.length === 0) return 999;

    return Math.floor((Date.now() - allDates[0].getTime()) / (24 * 60 * 60 * 1000));
  }

  private static getOrderTrend(relations: ContactRelations): number {
    const orders = [
      ...relations.physicalOrders,
      ...relations.digitalOrders,
      ...relations.digitalPurchases
    ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    if (orders.length < 2) return 0;

    const midpoint = Math.floor(orders.length / 2);
    const firstHalf = orders.slice(0, midpoint).length;
    const secondHalf = orders.slice(midpoint).length;

    return (secondHalf - firstHalf) / firstHalf;
  }

  private static getFirstOrderDate(relations: ContactRelations): Date | null {
    const allDates = [
      ...relations.physicalOrders.map(o => new Date(o.created_at)),
      ...relations.digitalOrders.map(o => new Date(o.created_at)),
      ...relations.digitalPurchases.map(p => new Date(p.created_at))
    ].sort((a, b) => a.getTime() - b.getTime());

    return allDates[0] || null;
  }
}

