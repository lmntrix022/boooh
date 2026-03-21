import { supabase } from '@/integrations/supabase/client';
import { ScannedContactsService } from './scannedContactsService';

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: 'contact_created' | 'order_placed' | 'quote_requested' | 'inactive_days' | 'invoice_unpaid';
    conditions: Record<string, any>;
  };
  actions: Array<{
    type: 'send_email' | 'send_sms' | 'create_task' | 'add_tag' | 'change_stage' | 'notify_owner';
    parameters: Record<string, any>;
  }>;
  enabled: boolean;
}

export class AutomationService {
  /**
   * Automatisations prédéfinies
   */
  static getDefaultAutomations(): AutomationRule[] {
    return [
      {
        id: 'welcome-new-contact',
        name: 'Email de bienvenue nouveau contact',
        description: 'Envoyer un email automatique quand un nouveau contact est créé',
        trigger: {
          type: 'contact_created',
          conditions: { source: ['scanner', 'manual'] }
        },
        actions: [
          {
            type: 'send_email',
            parameters: {
              template: 'welcome',
              delay_minutes: 5,
              subject: 'Bienvenue !',
              body: 'Nous sommes ravis de vous compter parmi nos contacts.'
            }
          },
          {
            type: 'add_tag',
            parameters: { tags: ['nouveau'] }
          }
        ],
        enabled: true
      },
      {
        id: 'follow-up-quote-7d',
        name: 'Relance devis après 7 jours',
        description: 'Relancer automatiquement les devis sans réponse après 7 jours',
        trigger: {
          type: 'quote_requested',
          conditions: { days_since: 7, status: 'quoted' }
        },
        actions: [
          {
            type: 'send_email',
            parameters: {
              template: 'quote-followup',
              subject: 'Avez-vous eu le temps de consulter notre devis ?',
              body: 'Nous voulions nous assurer que vous avez bien reçu notre devis.'
            }
          },
          {
            type: 'create_task',
            parameters: {
              title: 'Appeler client pour devis',
              priority: 'high'
            }
          }
        ],
        enabled: true
      },
      {
        id: 'churn-prevention-30d',
        name: 'Prévention churn - client inactif 30j',
        description: 'Réengager les clients inactifs depuis 30 jours',
        trigger: {
          type: 'inactive_days',
          conditions: { days: 30, previous_orders: { min: 1 } }
        },
        actions: [
          {
            type: 'send_email',
            parameters: {
              template: 'win-back',
              subject: 'Ça fait longtemps ! Voici une offre spéciale',
              body: 'Nous avons remarqué que vous ne nous avez pas rendu visite récemment. Voici une offre exclusive pour vous.'
            }
          },
          {
            type: 'add_tag',
            parameters: { tags: ['à-risque'] }
          },
          {
            type: 'notify_owner',
            parameters: {
              message: 'Client inactif depuis 30j - Action requise'
            }
          }
        ],
        enabled: true
      },
      {
        id: 'invoice-reminder-3d',
        name: 'Rappel facture impayée après 3j',
        description: 'Envoyer un rappel pour les factures en retard',
        trigger: {
          type: 'invoice_unpaid',
          conditions: { days_overdue: 3 }
        },
        actions: [
          {
            type: 'send_email',
            parameters: {
              template: 'invoice-reminder',
              subject: 'Rappel: Facture en attente de paiement',
              body: 'Nous tenions à vous rappeler que la facture est échue.'
            }
          },
          {
            type: 'send_sms',
            parameters: {
              message: 'Rappel: votre facture est échue. Merci de procéder au règlement.'
            }
          }
        ],
        enabled: true
      },
      {
        id: 'upsell-vip-customer',
        name: 'Upsell client VIP',
        description: 'Proposer offres premium aux clients VIP',
        trigger: {
          type: 'order_placed',
          conditions: { 
            total_revenue: { min: 500000 },
            order_count: { min: 3 }
          }
        },
        actions: [
          {
            type: 'add_tag',
            parameters: { tags: ['VIP', 'upsell-opportunity'] }
          },
          {
            type: 'send_email',
            parameters: {
              template: 'vip-offer',
              subject: 'Offre exclusive pour nos meilleurs clients',
              body: 'En tant que client VIP, nous avons une offre spéciale rien que pour vous.'
            }
          },
          {
            type: 'create_task',
            parameters: {
              title: 'Proposer offre premium',
              assigned_to: 'owner',
              priority: 'high'
            }
          }
        ],
        enabled: true
      }
    ];
  }

  /**
   * Exécuter une action spécifique
   */
  static async executeAction(
    contactId: string,
    action: { type: string; parameters: Record<string, any> }
  ): Promise<void> {
    try {
      switch (action.type) {
        case 'add_tag':
          await ScannedContactsService.addTags(contactId, action.parameters.tags);
          break;
        
        case 'send_email':
          // À implémenter avec Edge Function
          break;
        
        case 'send_sms':
          // À implémenter avec Twilio ou service SMS
          break;
        
        case 'create_task':
          // À implémenter avec système de tâches
          break;
        
        case 'notify_owner':
          // À implémenter avec notifications
          break;
        
        default:
          console.warn('Unknown action type:', action.type);
      }
    } catch (error) {
      console.error('Error executing action:', error);
      throw error;
    }
  }

  /**
   * Vérifier si une automation doit être déclenchée
   */
  static shouldTrigger(
    automation: AutomationRule,
    context: {
      contact?: any;
      relations?: any;
      event?: string;
    }
  ): boolean {
    if (!automation.enabled) return false;

    const { trigger } = automation;

    switch (trigger.type) {
      case 'contact_created':
        return context.event === 'contact_created';
      
      case 'order_placed':
        return context.event === 'order_placed';
      
      case 'inactive_days':
        // Vérifier nombre de jours d'inactivité
        if (context.relations) {
          const daysSinceLastActivity = this.getDaysSinceLastActivity(context.relations);
          return daysSinceLastActivity >= (trigger.conditions.days || 30);
        }
        return false;
      
      default:
        return false;
    }
  }

  private static getDaysSinceLastActivity(relations: any): number {
    const allDates = [
      ...relations.appointments.map((a: any) => new Date(a.date)),
      ...relations.quotes.map((q: any) => new Date(q.created_at)),
      ...relations.physicalOrders.map((o: any) => new Date(o.created_at)),
      ...relations.digitalOrders.map((o: any) => new Date(o.created_at)),
      ...relations.digitalPurchases.map((p: any) => new Date(p.created_at))
    ].sort((a, b) => b.getTime() - a.getTime());

    if (allDates.length === 0) return 999;

    return Math.floor((Date.now() - allDates[0].getTime()) / (24 * 60 * 60 * 1000));
  }
}

