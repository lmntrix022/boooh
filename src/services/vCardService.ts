import { ScannedContact } from './scannedContactsService';

export class VCardService {
  /**
   * Convertit un contact en format vCard
   */
  static contactToVCard(contact: ScannedContact): string {
    const lines: string[] = [];
    
    // En-tête vCard
    lines.push('BEGIN:VCARD');
    lines.push('VERSION:3.0');
    
    // Nom complet
    if (contact.full_name) {
      lines.push(`FN:${this.escapeVCardValue(contact.full_name)}`);
    }
    
    // Nom structuré (prénom, nom)
    if (contact.first_name || contact.last_name) {
      const structuredName = [
        contact.first_name || '',
        contact.last_name || '',
        '', // middle name
        '', // prefix
        ''  // suffix
      ].join(';');
      lines.push(`N:${structuredName}`);
    }
    
    // Organisation
    if (contact.company) {
      lines.push(`ORG:${this.escapeVCardValue(contact.company)}`);
    }
    
    // Titre
    if (contact.title) {
      lines.push(`TITLE:${this.escapeVCardValue(contact.title)}`);
    }
    
    // Téléphone
    if (contact.phone) {
      lines.push(`TEL:${contact.phone}`);
    }
    
    // Email
    if (contact.email) {
      lines.push(`EMAIL:${contact.email}`);
    }
    
    // Site web
    if (contact.website) {
      const url = contact.website.startsWith('http') ? contact.website : `https://${contact.website}`;
      lines.push(`URL:${url}`);
    }
    
    // Adresse
    if (contact.address || contact.city || contact.postal_code || contact.country) {
      const addressParts = [
        contact.address || '',
        contact.city || '',
        '', // region/state
        contact.postal_code || '',
        contact.country || ''
      ].join(';');
      lines.push(`ADR:;;${addressParts}`);
    }
    
    // Réseaux sociaux
    if (contact.social_media) {
      if (contact.social_media.linkedin) {
        const linkedinUrl = contact.social_media.linkedin.startsWith('http') 
          ? contact.social_media.linkedin 
          : `https://${contact.social_media.linkedin}`;
        lines.push(`URL:${linkedinUrl}`);
      }
      
      if (contact.social_media.twitter) {
        const twitterUrl = contact.social_media.twitter.startsWith('http') 
          ? contact.social_media.twitter 
          : `https://${contact.social_media.twitter}`;
        lines.push(`URL:${twitterUrl}`);
      }
      
      if (contact.social_media.facebook) {
        const facebookUrl = contact.social_media.facebook.startsWith('http') 
          ? contact.social_media.facebook 
          : `https://${contact.social_media.facebook}`;
        lines.push(`URL:${facebookUrl}`);
      }
      
      if (contact.social_media.instagram) {
        const instagramUrl = contact.social_media.instagram.startsWith('http') 
          ? contact.social_media.instagram 
          : `https://${contact.social_media.instagram}`;
        lines.push(`URL:${instagramUrl}`);
      }
    }
    
    // Notes
    if (contact.notes) {
      lines.push(`NOTE:${this.escapeVCardValue(contact.notes)}`);
    }
    
    // Métadonnées
    if (contact.created_at) {
      const date = new Date(contact.created_at).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      lines.push(`REV:${date}`);
    }
    
    // Fin vCard
    lines.push('END:VCARD');
    
    return lines.join('\r\n');
  }
  
  /**
   * Convertit plusieurs contacts en vCard
   */
  static contactsToVCard(contacts: ScannedContact[]): string {
    return contacts.map(contact => this.contactToVCard(contact)).join('\r\n\r\n');
  }
  
  /**
   * Exporte un contact en fichier vCard
   */
  static exportContact(contact: ScannedContact, filename?: string): void {
    const vcardContent = this.contactToVCard(contact);
    const defaultFilename = `${contact.full_name || 'contact'}_${new Date().toISOString().split('T')[0]}.vcf`;
    
    this.downloadFile(vcardContent, filename || defaultFilename, 'text/vcard');
  }
  
  /**
   * Exporte plusieurs contacts en fichier vCard
   */
  static exportContacts(contacts: ScannedContact[], filename?: string): void {
    const vcardContent = this.contactsToVCard(contacts);
    const defaultFilename = `contacts_${new Date().toISOString().split('T')[0]}.vcf`;
    
    this.downloadFile(vcardContent, filename || defaultFilename, 'text/vcard');
  }
  
  /**
   * Échappe les valeurs vCard
   */
  private static escapeVCardValue(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '');
  }
  
  /**
   * Télécharge un fichier
   */
  private static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Nettoyer l'URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
  
  /**
   * Parse un fichier vCard
   */
  static parseVCard(vcardContent: string): Partial<ScannedContact> {
    const lines = vcardContent.split(/\r?\n/);
    const contact: Partial<ScannedContact> = {};
    
    for (const line of lines) {
      if (line.startsWith('FN:')) {
        contact.full_name = this.unescapeVCardValue(line.substring(3));
      } else if (line.startsWith('N:')) {
        const nameParts = line.substring(2).split(';');
        contact.first_name = this.unescapeVCardValue(nameParts[0] || '');
        contact.last_name = this.unescapeVCardValue(nameParts[1] || '');
      } else if (line.startsWith('ORG:')) {
        contact.company = this.unescapeVCardValue(line.substring(4));
      } else if (line.startsWith('TITLE:')) {
        contact.title = this.unescapeVCardValue(line.substring(6));
      } else if (line.startsWith('TEL:')) {
        contact.phone = line.substring(4);
      } else if (line.startsWith('EMAIL:')) {
        contact.email = line.substring(6);
      } else if (line.startsWith('URL:')) {
        const url = line.substring(4);
        if (!contact.website) {
          contact.website = url;
        } else {
          // Gérer les URLs multiples (réseaux sociaux)
          if (!contact.social_media) {
            contact.social_media = {};
          }
          
          if (url.includes('linkedin.com')) {
            contact.social_media.linkedin = url;
          } else if (url.includes('twitter.com')) {
            contact.social_media.twitter = url;
          } else if (url.includes('facebook.com')) {
            contact.social_media.facebook = url;
          } else if (url.includes('instagram.com')) {
            contact.social_media.instagram = url;
          }
        }
      } else if (line.startsWith('ADR:')) {
        const addressParts = line.substring(4).split(';');
        if (addressParts.length >= 6) {
          contact.address = this.unescapeVCardValue(addressParts[2] || '');
          contact.city = this.unescapeVCardValue(addressParts[3] || '');
          contact.postal_code = this.unescapeVCardValue(addressParts[5] || '');
          contact.country = this.unescapeVCardValue(addressParts[6] || '');
        }
      } else if (line.startsWith('NOTE:')) {
        contact.notes = this.unescapeVCardValue(line.substring(5));
      }
    }
    
    return contact;
  }
  
  /**
   * Déséchappe les valeurs vCard
   */
  private static unescapeVCardValue(value: string): string {
    return value
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\n/g, '\n')
      .replace(/\\\\/g, '\\');
  }
}
