import { supabase } from '@/integrations/supabase/client';
import { ScannedContactsService } from './scannedContactsService';

export interface ContactData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  notes?: string;
}

export class ContactAutoCreation {
  /**
   * Récupère le user_id du propriétaire d'une carte
   */
  private static async getCardOwnerId(cardId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('business_cards')
        .select('user_id')
        .eq('id', cardId)
        .single();

      if (error || !data) {
        // Error log removed
        return null;
      }

      return data.user_id;
    } catch (error) {
      // Error log removed
      return null;
    }
  }

  /**
   * Crée automatiquement un contact lors de la création d'une commande
   */
  static async createContactFromOrder(
    cardId: string,
    orderData: {
      client_name: string;
      client_email: string;
      client_phone?: string;
      notes?: string;
      product_id?: string;
      card_id?: string;
    }
  ): Promise<void> {
    try {
      // Récupérer le user_id du propriétaire de la carte (le vendeur)
      const userId = await this.getCardOwnerId(cardId);
      if (!userId) {
        // Error log removed
        return;
      }

      // Vérifier si le contact existe déjà
      const existingContacts = await ScannedContactsService.searchContacts(userId, orderData.client_email);
      
      if (existingContacts.length > 0) {
        // Le contact existe déjà, on peut ajouter des tags ou mettre à jour
        const existingContact = existingContacts[0];
        const updatedTags = [...(existingContact.tags || []), 'commande'];
        const uniqueTags = Array.from(new Set(updatedTags));
        
        await ScannedContactsService.addTags(existingContact.id, uniqueTags);
        return;
      }

      // Créer un nouveau contact
      const contactData = {
        first_name: orderData.client_name.split(' ')[0] || '',
        last_name: orderData.client_name.split(' ').slice(1).join(' ') || '',
        full_name: orderData.client_name,
        email: orderData.client_email,
        phone: orderData.client_phone || '',
        company: '',
        title: '',
        website: '',
        address: '',
        city: '',
        postal_code: '',
        country: '',
        social_media: {},
        scan_confidence: 0.9,
        raw_ocr_text: `Commande: ${orderData.client_name} - ${orderData.client_email}`,
        tags: ['commande', 'automatique'],
        notes: orderData.notes || ''
      };

      await ScannedContactsService.createContact(userId, contactData, 'order');
    } catch (error) {
      // Error log removed
      // Ne pas faire échouer la commande si la création du contact échoue
    }
  }

  /**
   * Crée automatiquement un contact lors de la création d'un RDV
   */
  static async createContactFromAppointment(
    cardId: string,
    appointmentData: {
      client_name: string;
      client_email: string;
      client_phone?: string;
      notes?: string;
      date: string;
      card_id?: string;
    }
  ): Promise<void> {
    try {
      // Récupérer le user_id du propriétaire de la carte (le vendeur)
      const userId = await this.getCardOwnerId(cardId);
      if (!userId) {
        // Error log removed
        return;
      }

      // Vérifier si le contact existe déjà
      const existingContacts = await ScannedContactsService.searchContacts(userId, appointmentData.client_email);
      
      if (existingContacts.length > 0) {
        // Le contact existe déjà, on peut ajouter des tags ou mettre à jour
        const existingContact = existingContacts[0];
        const updatedTags = [...(existingContact.tags || []), 'rdv'];
        const uniqueTags = Array.from(new Set(updatedTags));
        
        await ScannedContactsService.addTags(existingContact.id, uniqueTags);
        return;
      }

      // Créer un nouveau contact
      const contactData = {
        first_name: appointmentData.client_name.split(' ')[0] || '',
        last_name: appointmentData.client_name.split(' ').slice(1).join(' ') || '',
        full_name: appointmentData.client_name,
        email: appointmentData.client_email,
        phone: appointmentData.client_phone || '',
        company: '',
        title: '',
        website: '',
        address: '',
        city: '',
        postal_code: '',
        country: '',
        social_media: {},
        scan_confidence: 0.9,
        raw_ocr_text: `RDV: ${appointmentData.client_name} - ${appointmentData.client_email}`,
        tags: ['rdv', 'automatique'],
        notes: appointmentData.notes || ''
      };

      await ScannedContactsService.createContact(userId, contactData, 'appointment');
    } catch (error) {
      // Error log removed
      // Ne pas faire échouer le RDV si la création du contact échoue
    }
  }

  /**
   * Crée automatiquement un contact lors de la création d'une commande digitale
   */
  static async createContactFromDigitalOrder(
    cardId: string,
    digitalOrderData: {
      client_name: string;
      client_email: string;
      client_phone?: string;
      notes?: string;
      digital_product_id?: string;
      card_id?: string;
    }
  ): Promise<void> {
    try {
      // Récupérer le user_id du propriétaire de la carte (le vendeur)
      const userId = await this.getCardOwnerId(cardId);
      if (!userId) {
        // Error log removed
        return;
      }

      // Vérifier si le contact existe déjà
      const existingContacts = await ScannedContactsService.searchContacts(userId, digitalOrderData.client_email);
      
      if (existingContacts.length > 0) {
        // Le contact existe déjà, on peut ajouter des tags ou mettre à jour
        const existingContact = existingContacts[0];
        const updatedTags = [...(existingContact.tags || []), 'commande-digitale'];
        const uniqueTags = Array.from(new Set(updatedTags));
        
        await ScannedContactsService.addTags(existingContact.id, uniqueTags);
        return;
      }

      // Créer un nouveau contact
      const contactData = {
        first_name: digitalOrderData.client_name.split(' ')[0] || '',
        last_name: digitalOrderData.client_name.split(' ').slice(1).join(' ') || '',
        full_name: digitalOrderData.client_name,
        email: digitalOrderData.client_email,
        phone: digitalOrderData.client_phone || '',
        company: '',
        title: '',
        website: '',
        address: '',
        city: '',
        postal_code: '',
        country: '',
        social_media: {},
        scan_confidence: 0.9,
        raw_ocr_text: `Commande digitale: ${digitalOrderData.client_name} - ${digitalOrderData.client_email}`,
        tags: ['commande-digitale', 'automatique'],
        notes: digitalOrderData.notes || ''
      };

      await ScannedContactsService.createContact(userId, contactData, 'order');
    } catch (error) {
      // Error log removed
      // Ne pas faire échouer la commande si la création du contact échoue
    }
  }

  /**
   * Crée automatiquement un contact lors d'une demande de devis
   */
  static async createContactFromQuoteRequest(
    cardId: string,
    quoteData: {
      client_name: string;
      client_email: string;
      client_phone?: string;
      client_company?: string;
      service_requested?: string;
      budget_range?: string;
      notes?: string;
    }
  ): Promise<void> {
    try {
      // Récupérer le user_id du propriétaire de la carte (le vendeur)
      const userId = await this.getCardOwnerId(cardId);
      if (!userId) {
        // Error log removed
        return;
      }

      // Vérifier si le contact existe déjà
      const existingContacts = await ScannedContactsService.searchContacts(userId, quoteData.client_email);
      
      if (existingContacts.length > 0) {
        // Le contact existe déjà, on peut ajouter des tags ou mettre à jour
        const existingContact = existingContacts[0];
        const updatedTags = [...(existingContact.tags || []), 'devis'];
        const uniqueTags = Array.from(new Set(updatedTags));
        
        // Mettre à jour avec les nouvelles infos si disponibles
        const updates: any = { tags: uniqueTags };
        if (quoteData.client_company && !existingContact.company) {
          updates.company = quoteData.client_company;
        }
        if (quoteData.client_phone && !existingContact.phone) {
          updates.phone = quoteData.client_phone;
        }
        
        await ScannedContactsService.updateContact(existingContact.id, updates);
        return;
      }

      // Créer un nouveau contact
      const contactData = {
        first_name: quoteData.client_name.split(' ')[0] || '',
        last_name: quoteData.client_name.split(' ').slice(1).join(' ') || '',
        full_name: quoteData.client_name,
        email: quoteData.client_email,
        phone: quoteData.client_phone || '',
        company: quoteData.client_company || '',
        title: '',
        website: '',
        address: '',
        city: '',
        postal_code: '',
        country: '',
        social_media: {},
        scan_confidence: 0.95, // Haute confiance car données saisies manuellement
        raw_ocr_text: `Demande de devis: ${quoteData.service_requested || 'Service non spécifié'}`,
        tags: ['devis', 'automatique', 'prospect'],
        notes: `Service demandé: ${quoteData.service_requested || 'N/A'}\nBudget: ${quoteData.budget_range || 'Non spécifié'}\n${quoteData.notes || ''}`
      };

      await ScannedContactsService.createContact(userId, contactData, 'appointment');
    } catch (error) {
      // Error log removed
      // Ne pas faire échouer la demande de devis si la création du contact échoue
    }
  }
}
