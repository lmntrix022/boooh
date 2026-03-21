import { supabase } from '@/integrations/supabase/client';
import { VCardService } from './vCardService';

// Type local pour éviter les problèmes d'import
interface AIParsingResult {
  name?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: {
    full?: string;
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  socialMedia?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };
  confidence: number;
  rawData: {
    rawText: string;
    detectedLanguage?: string;
  };
  suggestions: string[];
}

export interface ScannedContact {
  id?: string;
  user_id?: string;
  source_type?: 'scanner' | 'manual' | 'import' | 'order' | 'appointment' | 'digital_order';
  first_name?: string;
  last_name?: string;
  full_name?: string;
  title?: string;
  company?: string;
  email?: string;
  email_alt?: string;  // Nouveau: email alternatif
  phone?: string;
  phone_alt?: string;  // Nouveau: téléphone alternatif
  website?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  social_media?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    github?: string;
  };
  scan_confidence?: number;
  scan_source_image_url?: string;
  raw_ocr_text?: string;
  tags?: string[];
  notes?: string;
  status?: 'active' | 'archived' | 'deleted';
  created_at?: string;
  updated_at?: string;
}

export interface CreateScannedContactData {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  title?: string;
  company?: string;
  email?: string;
  email_alt?: string;  // Nouveau: email alternatif
  phone?: string;
  phone_alt?: string;  // Nouveau: téléphone alternatif
  website?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  social_media?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    github?: string;
  };
  scan_confidence?: number;
  scan_source_image_url?: string;
  raw_ocr_text?: string;
  tags?: string[];
  notes?: string;
}

export class ScannedContactsService {
  /**
   * Crée un nouveau contact scanné
   */
  static async createContact(
    userId: string, 
    contactData: CreateScannedContactData,
    sourceType: 'scanner' | 'manual' | 'order' | 'appointment' = 'scanner'
  ): Promise<ScannedContact> {
    try {
      // Vérifier que l'utilisateur est valide
      if (!userId || userId === 'undefined' || userId === 'null') {
        throw new Error('ID utilisateur invalide');
      }

      // Vérifier l'authentification
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      // Vérifier que l'userId correspond à l'utilisateur authentifié
      if (userId !== user.id) {
        throw new Error('ID utilisateur ne correspond pas à l\'utilisateur authentifié');
      }

      const { data, error } = await supabase
        .from('scanned_contacts') 
        .insert({
          user_id: userId,
          source_type: sourceType,
          ...contactData
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Erreur lors de la création du contact: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crée un contact automatiquement à partir d'une commande ou d'un RDV
   */
  static async createFromOrderOrAppointment(
    userId: string,
    contactInfo: {
      name: string;
      email: string;
      phone?: string;
      source: 'order' | 'appointment';
      sourceId: string;
      notes?: string;
    }
  ): Promise<ScannedContact | null> {
    try {
      // Vérifier si le contact existe déjà
      const { data: existingContact } = await supabase
        .from('scanned_contacts')
        .select('id')
        .eq('user_id', userId)
        .eq('email', contactInfo.email)
        .single();

      if (existingContact) {
        return null; // Ne pas créer de doublon
      }

      // Extraire prénom et nom
      const nameParts = contactInfo.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const contactData: CreateScannedContactData = {
        first_name: firstName,
        last_name: lastName,
        full_name: contactInfo.name,
        email: contactInfo.email,
        phone: contactInfo.phone,
        notes: contactInfo.notes,
        tags: [contactInfo.source === 'order' ? 'commande' : 'rdv']
      };

      const { data, error } = await supabase
        .from('scanned_contacts')
        .insert({
          user_id: userId,
          source_type: 'scanner', // Utiliser 'scanner' temporairement
          ...contactData
        })
        .select()
        .single();

      if (error) {
        return null;
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Crée un contact à partir des données du scanner
   */
  static async createFromScannerData(
    userId: string,
    scannerData: AIParsingResult,
    imageUrl?: string
  ): Promise<ScannedContact> {
    try {
      const contactData: CreateScannedContactData = {
        first_name: scannerData.firstName,
        last_name: scannerData.lastName,
        full_name: scannerData.name || (scannerData.firstName && scannerData.lastName 
          ? `${scannerData.firstName} ${scannerData.lastName}` 
          : undefined),
        title: scannerData.title,
        company: scannerData.company,
        email: scannerData.email,
        email_alt: scannerData.emailAlt,  // Nouveau: email alternatif
        phone: scannerData.phone,
        phone_alt: scannerData.phoneAlt,  // Nouveau: téléphone alternatif
        website: scannerData.website,
        address: scannerData.address?.full,
        city: scannerData.address?.city,
        postal_code: scannerData.address?.postalCode,
        country: scannerData.address?.country,
        social_media: scannerData.socialMedia,
        scan_confidence: scannerData.confidence,
        scan_source_image_url: imageUrl,
        raw_ocr_text: scannerData.rawData.rawText,
        tags: ['scanner', 'imported'],
        notes: scannerData.suggestions.length > 0 
          ? `Suggestions: ${scannerData.suggestions.join(', ')}`
          : undefined
      };

      return await this.createContact(userId, contactData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère tous les contacts d'un utilisateur
   */
  static async getUserContacts(userId: string): Promise<ScannedContact[]> {
    try {
      const { data, error } = await supabase
        .from('scanned_contacts')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erreur lors de la récupération des contacts: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Met à jour un contact
   */
  static async updateContact(
    contactId: string,
    updates: Partial<CreateScannedContactData>
  ): Promise<ScannedContact> {
    try {
      const { data, error } = await supabase
        .from('scanned_contacts')
        .update(updates)
        .eq('id', contactId)
        .select()
        .single();

      if (error) {
        throw new Error(`Erreur lors de la mise à jour du contact: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Supprime un contact (soft delete)
   */
  static async deleteContact(contactId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('scanned_contacts')
        .update({ status: 'deleted' })
        .eq('id', contactId);

      if (error) {
        throw new Error(`Erreur lors de la suppression du contact: ${error.message}`);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Recherche des contacts
   */
  static async searchContacts(
    userId: string,
    query: string
  ): Promise<ScannedContact[]> {
    try {
      // Nettoyer et échapper la requête pour éviter les erreurs SQL
      const cleanQuery = query.trim().replace(/[%_\\]/g, '\\$&');
      
      const { data, error } = await supabase
        .from('scanned_contacts')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .or(`full_name.ilike.%${cleanQuery}%,company.ilike.%${cleanQuery}%,email.ilike.%${cleanQuery}%,phone.ilike.%${cleanQuery}%`)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erreur lors de la recherche des contacts: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Ajoute des tags à un contact
   */
  static async addTags(contactId: string, tags: string[]): Promise<ScannedContact> {
    try {
      // Récupérer les tags existants
      const { data: contact, error: fetchError } = await supabase
        .from('scanned_contacts')
        .select('tags')
        .eq('id', contactId)
        .single();

      if (fetchError) {
        throw new Error(`Erreur lors de la récupération du contact: ${fetchError.message}`);
      }

      // Fusionner les tags
      const existingTags = contact.tags || [];
      const allTags = [...existingTags, ...tags];
      const newTags = Array.from(new Set(allTags));

      // Mettre à jour
      const { data, error } = await supabase
        .from('scanned_contacts')
        .update({ tags: newTags })
        .eq('id', contactId)
        .select()
        .single();

      if (error) {
        throw new Error(`Erreur lors de l'ajout des tags: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Exporte les contacts en CSV
   */
  static async exportContacts(userId: string): Promise<string> {
    try {
      const contacts = await this.getUserContacts(userId);
      return this.exportContactsCSV(contacts);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Exporte des contacts spécifiques en CSV
   */
  static exportContactsCSV(contacts: ScannedContact[]): string {
    try {
      const headers = [
        'Nom complet',
        'Prénom',
        'Nom',
        'Titre',
        'Entreprise',
        'Email',
        'Téléphone',
        'Site web',
        'Adresse',
        'Ville',
        'Code postal',
        'Pays',
        'LinkedIn',
        'Twitter',
        'Facebook',
        'Instagram',
        'Confiance scan',
        'Date création',
        'Tags',
        'Notes'
      ];

      const csvRows = [
        headers.join(','),
        ...contacts.map(contact => [
          contact.full_name || '',
          contact.first_name || '',
          contact.last_name || '',
          contact.title || '',
          contact.company || '',
          contact.email || '',
          contact.phone || '',
          contact.website || '',
          contact.address || '',
          contact.city || '',
          contact.postal_code || '',
          contact.country || '',
          contact.social_media?.linkedin || '',
          contact.social_media?.twitter || '',
          contact.social_media?.facebook || '',
          contact.social_media?.instagram || '',
          contact.scan_confidence || '',
          contact.created_at || '',
          (contact.tags || []).join(';'),
          contact.notes || ''
        ].map(field => `"${(field || '').toString().replace(/"/g, '""')}"`).join(','))
      ];

      return csvRows.join('\n');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Exporte les contacts en vCard
   */
  static async exportContactsVCard(userId: string): Promise<string> {
    try {
      const contacts = await this.getUserContacts(userId);
      return VCardService.contactsToVCard(contacts);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Exporte des contacts spécifiques en vCard
   */
  static exportContactsVCardFromArray(contacts: ScannedContact[]): string {
    try {
      return VCardService.contactsToVCard(contacts);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Exporte un contact spécifique en vCard
   */
  static exportContactVCard(contact: ScannedContact): string {
    return VCardService.contactToVCard(contact);
  }
}
