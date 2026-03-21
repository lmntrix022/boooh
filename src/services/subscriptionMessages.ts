
/**
 * Subscription Messages Service
 * Provides user-friendly and contextual error messages for subscription-related operations
 *
 * Singularity Design: Prefer Growth Insights over "Accès refusé".
 *
 * Handles:
 * - Quota limits (cards, products, etc.)
 * - Plan restrictions
 * - Upgrade suggestions (Growth Insights)
 * - Addon opportunities
 * - Feature access messages
 */

import { PlanType } from '@/types/subscription';
import {
  getGrowthInsightSync,
  type GrowthInsight,
  type InsightFeature,
} from './growthInsightsService';

export interface SubscriptionMessage {
  title: string;
  description: string;
  actionLabel?: string;
  actionUrl?: string;
  helpText?: string;
}

export interface SubscriptionErrorContext {
  planType?: PlanType;
  currentCount?: number;
  maxLimit?: number;
  featureName?: string;
  addonAvailable?: boolean;
}

export class SubscriptionMessagesService {
  /**
   * Get user-friendly message for quota exceeded error
   */
  static getQuotaExceededMessage(
    feature: string,
    currentCount: number,
    maxLimit: number,
    planType?: PlanType
  ): SubscriptionMessage {
    const plural = maxLimit > 1 ? 's' : '';
    
    const messages: Record<string, any> = {
      card: {
        title: '🎴 Limite de cartes atteinte',
        description: `Vous avez créé ${currentCount} carte${currentCount > 1 ? 's' : ''}, mais votre plan "${planType || 'actuel'}" vous permet d'en avoir maximum ${maxLimit}.`,
        helpText: 'Les addons "Pack Créateur" et "Pack Studio" peuvent augmenter votre limite.',
      },
      product: {
        title: '📦 Limite de produits atteinte',
        description: `Vous avez ${currentCount} produit${currentCount > 1 ? 's' : ''}, mais votre plan "${planType || 'actuel'}" vous permet d'en avoir maximum ${maxLimit}.`,
        helpText: 'Passez à un plan supérieur ou ajoutez un addon pour continuer.',
      },
      project: {
        title: '🎨 Limite de projets atteinte',
        description: `Vous avez créé ${currentCount} projet${currentCount > 1 ? 's' : ''}, mais votre plan "${planType || 'actuel'}" vous permet d'en avoir maximum ${maxLimit}.`,
        helpText: 'Débloquez des projets illimités avec un plan Premium ou un addon.',
      },
      invoice: {
        title: '📄 Limite de factures atteinte',
        description: `Vous avez créé ${currentCount} facture${currentCount > 1 ? 's' : ''}, mais votre plan "${planType || 'actuel'}" vous permet d'en générer maximum ${maxLimit}.`,
        helpText: 'Augmentez votre limite avec un plan supérieur.',
      },
    };

    return messages[feature] || {
      title: '⚠️ Limite atteinte',
      description: `Vous avez atteint la limite de ${maxLimit} ${feature}${plural} pour votre plan.`,
      helpText: 'Contactez notre support ou mettez à jour votre abonnement.',
    };
  }

  /**
   * Get Growth Insight message (Singularity: don't say "Accès refusé", say what they're missing).
   * Use when you have card context (view count, etc.).
   */
  static getGrowthInsightMessage(
    feature: InsightFeature,
    viewCount?: number,
    inquiryCount?: number
  ): GrowthInsight {
    return getGrowthInsightSync(feature, viewCount, inquiryCount);
  }

  /**
   * Get message for feature not available in plan
   */
  static getFeatureNotAvailableMessage(
    featureName: string,
    requiredPlan?: string
  ): SubscriptionMessage {
    const featureMessages: Record<string, any> = {
      portfolio: {
        title: '🖼️ Portfolio non disponible',
        description: 'Le portfolio est exclusif aux plans Premium et supérieurs.',
        helpText: 'Passez à un plan Premium (BUSINESS ou MAGIC) pour accéder au portfolio.',
      },
      appointments: {
        title: '📅 Rendez-vous non disponibles',
        description: 'La gestion des rendez-vous est réservée aux plans Premium.',
        helpText: 'Mettez à jour votre abonnement pour gérer vos rendez-vous.',
      },
      digitalProducts: {
        title: '💾 Produits numériques non disponibles',
        description: 'Les produits numériques (téléchargeables) sont une fonctionnalité Premium.',
        helpText: 'Débloquez les produits numériques avec un plan BUSINESS ou MAGIC.',
      },
      advancedAnalytics: {
        title: '📊 Analyses avancées non disponibles',
        description: 'Les analyses complètes sont exclusives aux plans Premium.',
        helpText: 'Passez à un plan supérieur pour accéder aux statistiques détaillées.',
      },
      customDomain: {
        title: '🌐 Domaine personnalisé non disponible',
        description: 'Les domaines personnalisés sont une fonctionnalité Premium.',
        helpText: 'Mettez à jour votre plan pour utiliser votre propre domaine.',
      },
      teamCollaboration: {
        title: '👥 Collaboration d\'équipe non disponible',
        description: 'La collaboration d\'équipe est réservée aux plans MAGIC et supérieurs.',
        helpText: 'Passez au plan MAGIC pour inviter des collaborateurs.',
      },
    };

    return featureMessages[featureName] || {
      title: '🔒 Fonctionnalité Premium',
      description: `La fonctionnalité "${featureName}" n'est pas disponible pour votre plan.`,
      helpText: requiredPlan 
        ? `Passez au plan ${requiredPlan} pour accéder à cette fonctionnalité.`
        : 'Contactez le support pour plus d\'informations.',
    };
  }

  /**
   * Get upgrade suggestion message
   */
  static getUpgradeSuggestionMessage(
    currentPlan: PlanType | string,
    reason: string,
    nextPlan?: string
  ): SubscriptionMessage {
    const suggestions: Record<string, SubscriptionMessage> = {
      'needMoreCards': {
        title: '⬆️ Augmentez votre limite de cartes',
        description: 'Pour créer plus de cartes numériques, mettez à jour votre abonnement ou ajoutez un addon.',
        actionLabel: 'Voir les plans',
        actionUrl: '/pricing',
        helpText: 'L\'addon "Pack Créateur" offre 4 cartes supplémentaires.',
      },
      'needMoreProducts': {
        title: '📦 Élargissez votre catalogue',
        description: 'Votre plan actuel limite votre nombre de produits. Passez à un plan supérieur pour vendre plus.',
        actionLabel: 'Comparer les plans',
        actionUrl: '/pricing',
        helpText: 'Les plans Premium offrent jusqu\'à ∞ produits.',
      },
      'needPortfolio': {
        title: '🎨 Créez un portfolio professionnel',
        description: 'Mettez en avant vos meilleurs travaux avec un portfolio interactif (plan Premium requis).',
        actionLabel: 'Découvrir Premium',
        actionUrl: '/pricing',
        helpText: 'Disponible dans les plans BUSINESS et MAGIC.',
      },
      'needAppointments': {
        title: '📅 Gérez vos rendez-vous facilement',
        description: 'Permettez à vos clients de vous prendre rendez-vous directement (plans Premium).',
        actionLabel: 'Activer Premium',
        actionUrl: '/pricing',
        helpText: 'Calendrier, notifications automatiques et rappels inclus.',
      },
    };

    return suggestions[reason] || {
      title: '⬆️ Mettez à jour votre plan',
      description: `Vous auriez besoin du plan ${nextPlan || 'Premium'} pour ${reason}.`,
      actionLabel: 'Voir les plans',
      actionUrl: '/pricing',
    };
  }

  /**
   * Get addon recommendation message
   */
  static getAddonRecommendationMessage(
    addonType: string,
    benefit: string
  ): SubscriptionMessage {
    const addons: Record<string, SubscriptionMessage> = {
      'pack_createur': {
        title: '✨ Pack Créateur',
        description: 'Ajoutez 4 cartes supplémentaires, 50 produits supplémentaires et des outils de création avancés.',
        actionLabel: 'Ajouter au panier',
        helpText: '€9.99/mois • Sans engagement',
      },
      'pack_studio': {
        title: '🎬 Pack Studio',
        description: 'Débloquez les vidéos, animations personnalisées et outils de conception premium.',
        actionLabel: 'Ajouter au panier',
        helpText: '€19.99/mois • Pour les créateurs sérieux',
      },
      'pack_pro': {
        title: '⚡ Pack Pro',
        description: 'Outils avancés d\'analyse, API personnalisée et support prioritaire inclus.',
        actionLabel: 'Ajouter au panier',
        helpText: '€39.99/mois • Tout illimité',
      },
    };

    return addons[addonType] || {
      title: `📦 ${addonType}`,
      description: `Bénéfice: ${benefit}`,
      actionLabel: 'En savoir plus',
    };
  }

  /**
   * Get payment error message
   */
  static getPaymentErrorMessage(errorCode?: string): SubscriptionMessage {
    const paymentErrors: Record<string, SubscriptionMessage> = {
      'insufficient_funds': {
        title: '💳 Fonds insuffisants',
        description: 'Votre compte n\'a pas suffisamment de fonds pour effectuer cette transaction.',
        helpText: 'Veuillez vérifier votre solde ou utiliser un autre moyen de paiement.',
      },
      'card_declined': {
        title: '❌ Carte refusée',
        description: 'Votre carte de paiement a été refusée par votre banque.',
        helpText: 'Vérifiez les détails de votre carte ou contactez votre banque.',
      },
      'expired_card': {
        title: '⏰ Carte expirée',
        description: 'Votre carte de paiement a expiré.',
        helpText: 'Mettez à jour votre carte pour continuer.',
      },
      'invalid_payment_method': {
        title: '⚠️ Méthode de paiement invalide',
        description: 'Le moyen de paiement sélectionné n\'est pas disponible.',
        helpText: 'Essayez une autre méthode de paiement.',
      },
      'network_error': {
        title: '🌐 Erreur de connexion',
        description: 'Une erreur réseau a empêché le traitement de votre paiement.',
        helpText: 'Vérifiez votre connexion Internet et réessayez.',
      },
    };

    return paymentErrors[errorCode || 'unknown'] || {
      title: '❌ Erreur de paiement',
      description: 'Une erreur est survenue lors du traitement de votre paiement.',
      helpText: 'Veuillez réessayer ou contacter notre support.',
    };
  }

  /**
   * Get subscription status message
   */
  static getSubscriptionStatusMessage(
    status: string,
    planName?: string,
    renewalDate?: Date
  ): SubscriptionMessage {
    const statusMessages: Record<string, SubscriptionMessage> = {
      'active': {
        title: '✅ Abonnement actif',
        description: `Vous êtes actuellement sur le plan "${planName || 'Premium'}" et pouvez accéder à toutes les fonctionnalités.`,
        helpText: renewalDate ? `Renouvellement prévu le ${renewalDate.toLocaleDateString('fr-FR')}` : '',
      },
      'pending': {
        title: '⏳ Abonnement en attente',
        description: 'Votre abonnement est en cours de traitement. Cela peut prendre quelques minutes.',
        helpText: 'Vous recevrez une confirmation par email une fois activé.',
      },
      'cancelled': {
        title: '🚫 Abonnement annulé',
        description: 'Votre abonnement a été annulé. Vous conservez l\'accès jusqu\'à la fin de votre période de facturation.',
        actionLabel: 'Réactiver',
        actionUrl: '/pricing',
        helpText: 'Vous pouvez réactiver à tout moment.',
      },
      'expired': {
        title: '⏰ Abonnement expiré',
        description: 'Votre abonnement a expiré. Pour continuer à accéder aux fonctionnalités Premium, veuillez le renouveler.',
        actionLabel: 'Renouveler maintenant',
        actionUrl: '/pricing',
        helpText: 'Retrouvez accès immédiatement après le renouvellement.',
      },
      'past_due': {
        title: '⚠️ Paiement en retard',
        description: 'Votre dernier paiement n\'a pas pu être traité. Veuillez mettre à jour votre méthode de paiement.',
        actionLabel: 'Mettre à jour le paiement',
        actionUrl: '/settings/payment',
        helpText: 'Votre abonnement sera suspendu si le paiement n\'est pas effectué sous 7 jours.',
      },
    };

    return statusMessages[status] || {
      title: 'Statut de l\'abonnement',
      description: `Votre statut d'abonnement actuel est: ${status}`,
    };
  }

  /**
   * Get comprehensive context-aware message
   */
  static getContextualMessage(
    messageType: 'quota_exceeded' | 'feature_unavailable' | 'upgrade_suggested' | 'addon_recommended' | 'payment_error' | 'status_update',
    context: SubscriptionErrorContext & { [key: string]: any }
  ): SubscriptionMessage {
    switch (messageType) {
      case 'quota_exceeded':
        return this.getQuotaExceededMessage(
          context.featureName || 'resource',
          context.currentCount || 0,
          context.maxLimit || 1,
          context.planType
        );
      case 'feature_unavailable':
        return this.getFeatureNotAvailableMessage(
          context.featureName || 'feature',
          context.requiredPlan
        );
      case 'upgrade_suggested':
        return this.getUpgradeSuggestionMessage(
          context.planType || 'FREE',
          context.reason || 'need_upgrade',
          context.nextPlan
        );
      case 'addon_recommended':
        return this.getAddonRecommendationMessage(
          context.addonType || 'addon',
          context.benefit || ''
        );
      case 'payment_error':
        return this.getPaymentErrorMessage(context.errorCode);
      case 'status_update':
        return this.getSubscriptionStatusMessage(
          context.status || 'unknown',
          context.planName,
          context.renewalDate
        );
      default:
        return {
          title: 'Information d\'abonnement',
          description: 'Une action concernant votre abonnement est requise.',
        };
    }
  }

  /**
   * Get action button configuration
   */
  static getActionConfig(message: SubscriptionMessage) {
    return {
      label: message.actionLabel || 'En savoir plus',
      url: message.actionUrl || '/pricing',
    };
  }
}

export default SubscriptionMessagesService;


