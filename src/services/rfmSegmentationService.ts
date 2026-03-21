import { ScannedContact } from './scannedContactsService';
import { ContactRelations } from './crmService';

export interface RFMScores {
  recency: number; // 1-5 (5 = récent)
  frequency: number; // 1-5 (5 = fréquent)
  monetary: number; // 1-5 (5 = gros CA)
  segment: RFMSegment;
}

export type RFMSegment =
  | 'champions'
  | 'loyal_customers'
  | 'potential_loyalists'
  | 'new_customers'
  | 'promising'
  | 'need_attention'
  | 'about_to_sleep'
  | 'at_risk'
  | 'cant_lose_them'
  | 'hibernating'
  | 'lost';

export interface SegmentRecommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  actions: string[];
  messaging: string;
  color: string;
  icon: string;
}

export class RFMSegmentationService {
  /**
   * Calculer scores RFM pour un contact
   */
  static calculateRFM(
    contact: ScannedContact, 
    relations: ContactRelations
  ): RFMScores {
    // 1. Recency (dernière activité)
    const daysSinceLastOrder = this.getDaysSinceLastOrder(relations);
    const recencyScore = this.scoreRecency(daysSinceLastOrder);

    // 2. Frequency (nombre de commandes)
    const totalOrders = 
      relations.physicalOrders.length + 
      relations.digitalOrders.length + 
      relations.digitalPurchases.length;
    const frequencyScore = this.scoreFrequency(totalOrders);

    // 3. Monetary (CA total)
    const totalRevenue = this.calculateTotalRevenue(relations);
    const monetaryScore = this.scoreMonetary(totalRevenue);

    // 4. Déterminer segment
    const segment = this.determineSegment(recencyScore, frequencyScore, monetaryScore);

    return {
      recency: recencyScore,
      frequency: frequencyScore,
      monetary: monetaryScore,
      segment
    };
  }

  /**
   * Obtenir recommandations par segment
   */
  static getSegmentRecommendations(segment: RFMSegment): SegmentRecommendation {
    const recommendations: Record<RFMSegment, SegmentRecommendation> = {
      champions: {
        priority: 'high',
        actions: [
          'Programme de fidélité VIP',
          'Early access nouveaux produits',
          'Demander témoignages/avis',
          'Programme de parrainage'
        ],
        messaging: 'Récompensez-les. Ils peuvent être vos ambassadeurs.',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: '🏆'
      },
      loyal_customers: {
        priority: 'high',
        actions: [
          'Upsell produits premium',
          'Cross-sell complémentaires',
          'Offres personnalisées'
        ],
        messaging: 'Proposez-leur plus de valeur.',
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: '💎'
      },
      potential_loyalists: {
        priority: 'medium',
        actions: [
          'Programmes de fidélité',
          'Recommandations personnalisées'
        ],
        messaging: 'Engagez-les avec bon contenu.',
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: '⭐'
      },
      new_customers: {
        priority: 'medium',
        actions: [
          'Email de bienvenue',
          'Onboarding personnalisé',
          'Support proactif'
        ],
        messaging: 'Créez une bonne première impression.',
        color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        icon: '🆕'
      },
      promising: {
        priority: 'medium',
        actions: [
          'Offres spéciales',
          'Recommandations produits'
        ],
        messaging: 'Créez la valeur de marque.',
        color: 'bg-purple-100 text-purple-800 border-purple-300',
        icon: '✨'
      },
      need_attention: {
        priority: 'medium',
        actions: [
          'Campagne de réengagement',
          'Offres limitées dans le temps'
        ],
        messaging: 'Réengagez-les avec des offres.',
        color: 'bg-orange-100 text-orange-800 border-orange-300',
        icon: '⚠️'
      },
      about_to_sleep: {
        priority: 'high',
        actions: [
          'Offres agressives',
          'Partager valeur de marque'
        ],
        messaging: 'Reconquérez-les avant qu\'ils partent.',
        color: 'bg-amber-100 text-amber-800 border-amber-300',
        icon: '😴'
      },
      at_risk: {
        priority: 'critical',
        actions: [
          'Win-back campaigns',
          'Sondage satisfaction',
          'Offres personnalisées'
        ],
        messaging: 'Contactez-les maintenant !',
        color: 'bg-red-100 text-red-800 border-red-300',
        icon: '🔴'
      },
      cant_lose_them: {
        priority: 'critical',
        actions: [
          'Appel téléphonique personnel',
          'Offres exclusives',
          'Feedback personnalisé'
        ],
        messaging: 'Faites tout pour les garder.',
        color: 'bg-rose-100 text-rose-800 border-rose-300',
        icon: '💔'
      },
      hibernating: {
        priority: 'low',
        actions: [
          'Campagne de réactivation',
          'Offres ultra-attractives'
        ],
        messaging: 'Recréez la valeur de marque.',
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        icon: '🌙'
      },
      lost: {
        priority: 'low',
        actions: [
          'Sondage pourquoi partis',
          'Dernière tentative win-back'
        ],
        messaging: 'Apprenez pourquoi ils sont partis.',
        color: 'bg-slate-100 text-slate-800 border-slate-300',
        icon: '❌'
      }
    };

    return recommendations[segment];
  }

  /**
   * Obtenir la distribution RFM de tous les contacts
   */
  static getSegmentDistribution(contacts: Array<{ contact: ScannedContact; rfm: RFMScores }>): Record<RFMSegment, number> {
    const distribution: Record<string, number> = {
      champions: 0,
      loyal_customers: 0,
      potential_loyalists: 0,
      new_customers: 0,
      promising: 0,
      need_attention: 0,
      about_to_sleep: 0,
      at_risk: 0,
      cant_lose_them: 0,
      hibernating: 0,
      lost: 0
    };

    contacts.forEach(({ rfm }) => {
      distribution[rfm.segment]++;
    });

    return distribution as Record<RFMSegment, number>;
  }

  // Méthodes privées

  private static getDaysSinceLastOrder(relations: ContactRelations): number {
    const allOrders = [
      ...relations.physicalOrders,
      ...relations.digitalOrders,
      ...relations.digitalPurchases
    ];

    if (allOrders.length === 0) return 999;

    const dates = allOrders.map(o => new Date(o.created_at).getTime());
    const lastOrder = Math.max(...dates);

    return Math.floor((Date.now() - lastOrder) / (24 * 60 * 60 * 1000));
  }

  private static scoreRecency(days: number): number {
    if (days <= 30) return 5;
    if (days <= 60) return 4;
    if (days <= 90) return 3;
    if (days <= 180) return 2;
    return 1;
  }

  private static scoreFrequency(orders: number): number {
    if (orders >= 10) return 5;
    if (orders >= 5) return 4;
    if (orders >= 3) return 3;
    if (orders >= 2) return 2;
    return 1;
  }

  private static scoreMonetary(revenue: number): number {
    if (revenue >= 1000000) return 5; // 1M+
    if (revenue >= 500000) return 4;  // 500K+
    if (revenue >= 200000) return 3;  // 200K+
    if (revenue >= 50000) return 2;   // 50K+
    return 1;
  }

  private static calculateTotalRevenue(relations: ContactRelations): number {
    return (
      relations.physicalOrders.reduce((sum, o) => {
        const product = o.products as any;
        return sum + (product?.price || 0) * (o.quantity || 1);
      }, 0) +
      relations.digitalOrders.reduce((sum, o) => {
        const product = o.digital_products as any;
        return sum + (product?.price || 0) * (o.quantity || 1);
      }, 0) +
      relations.digitalPurchases.reduce((sum, p) => sum + (p.amount || 0), 0)
    );
  }

  private static determineSegment(R: number, F: number, M: number): RFMSegment {
    // Champions: Meilleurs clients
    if ((R >= 4 && F >= 4 && M >= 4) || (R === 5 && F === 5 && M >= 4)) {
      return 'champions';
    }

    // Loyal: Achètent régulièrement
    if (R === 5 && F >= 2) {
      return 'loyal_customers';
    }

    // Potentiel loyauté: Achètent souvent mais pas récemment
    if (R === 4 && F >= 3) {
      return 'potential_loyalists';
    }

    // Nouveaux clients: Achat récent, pas beaucoup
    if (R === 5 && F === 1) {
      return 'new_customers';
    }

    // Prometteurs: Achat récent moyen
    if (R === 4 && F === 1) {
      return 'promising';
    }

    // Besoin attention: Activité moyenne déclinante
    if (R === 3) {
      return 'need_attention';
    }

    // Sur le point de dormir
    if (R === 2 && F >= 2) {
      return 'about_to_sleep';
    }

    // À risque: Bons clients qui deviennent inactifs
    if (R <= 2 && F >= 4 && M >= 4) {
      return 'cant_lose_them';
    }

    // En hibernation: Inactifs
    if (R === 1 && F <= 2 && M <= 2) {
      return 'hibernating';
    }

    // Perdus
    return 'lost';
  }
}

