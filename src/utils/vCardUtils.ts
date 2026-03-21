/**
 * Utility functions for generating vCards for contact information
 */

interface ContactInfo {
  name: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  avatar?: string;
  address?: string;
  description?: string;
  cardUrl?: string;
  socials?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    portfolio?: string;
    facebook?: string;
    youtube?: string;
    whatsapp?: string;
  };
}

/**
 * Convert an image URL to base64
 */
const getImageAsBase64 = async (imageUrl: string): Promise<string> => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert image to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    // Error log removed
    return '';
  }
};

/**
 * Generate a vCard string from contact information
 */
export const generateVCard = async (contact: ContactInfo): Promise<string> => {
  let vCard = 'BEGIN:VCARD\r\nVERSION:3.0\r\n';
  
  // Add name
  vCard += `FN:${contact.name}\r\n`;
  vCard += `N:${contact.name.split(' ').reverse().join(';')};\r\n`;
  
  // Add title if available
  if (contact.title) {
    vCard += `TITLE:${contact.title}\r\n`;
  }
  
  // Add company if available
  if (contact.company) {
    vCard += `ORG:${contact.company}\r\n`;
  }
  
  // Add email if available
  if (contact.email) {
    vCard += `EMAIL;TYPE=WORK:${contact.email}\r\n`;
  }
  
  // Add phone if available
  if (contact.phone) {
    vCard += `TEL;TYPE=CELL:${contact.phone}\r\n`;
  }
  
  // Add website if available
  if (contact.website) {
    vCard += `URL:${contact.website}\r\n`;
  }

  // Add business card URL if available
  if (contact.cardUrl) {
    vCard += `URL;TYPE=BUSINESS_CARD:${contact.cardUrl}\r\n`;
  }

  // Add address if available
  if (contact.address) {
    vCard += `ADR;TYPE=WORK:;;${contact.address};;;;\r\n`;
  }

  // Add description/note if available
  if (contact.description) {
    vCard += `NOTE:${contact.description}\r\n`;
  }

  // Add photo/avatar if available
  if (contact.avatar && contact.avatar.startsWith('http')) {
    try {
      const base64Image = await getImageAsBase64(contact.avatar);
      if (base64Image) {
        vCard += `PHOTO;ENCODING=b;TYPE=JPEG:${base64Image}\r\n`;
      }
    } catch (error) {
      // Error log removed
    }
  }

  // Add social media URLs
  if (contact.socials) {
    if (contact.socials.linkedin) {
      vCard += `X-SOCIALPROFILE;TYPE=linkedin:${contact.socials.linkedin}\r\n`;
    }
    if (contact.socials.twitter) {
      vCard += `X-SOCIALPROFILE;TYPE=twitter:${contact.socials.twitter}\r\n`;
    }
    if (contact.socials.instagram) {
      vCard += `X-SOCIALPROFILE;TYPE=instagram:${contact.socials.instagram}\r\n`;
    }
    if (contact.socials.facebook) {
      vCard += `X-SOCIALPROFILE;TYPE=facebook:${contact.socials.facebook}\r\n`;
    }
    if (contact.socials.youtube) {
      vCard += `X-SOCIALPROFILE;TYPE=youtube:${contact.socials.youtube}\r\n`;
    }
    if (contact.socials.whatsapp) {
      vCard += `X-SOCIALPROFILE;TYPE=whatsapp:https://wa.me/${contact.socials.whatsapp}\r\n`;
    }
    if (contact.socials.portfolio) {
      vCard += `X-SOCIALPROFILE;TYPE=portfolio:${contact.socials.portfolio}\r\n`;
    }
  }
  
  vCard += 'END:VCARD';
  return vCard;
};

/**
 * Construit un fichier .vcf à partir du contact (pour partage synchrone au clic).
 * À appeler en amont (ex. useEffect quand la carte est dispo) pour que le fichier
 * soit prêt lors du clic et respecte la contrainte "user gesture".
 */
export const buildVCardFile = async (contact: ContactInfo): Promise<File> => {
  const vCard = await generateVCard(contact);
  return new File([vCard], 'contact.vcf', { type: 'text/vcard' });
};

/**
 * Create a downloadable vCard file
 */
export const downloadVCard = async (contact: ContactInfo) => {
  const vCard = await generateVCard(contact);
  const blob = new Blob([vCard], { type: 'text/vcard' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${contact.name.replace(/\s+/g, '_')}.vcf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/** Taille max raisonnable pour partager un fichier (vCard + photo en base64 peut être lourd) */
const MAX_SHARE_FILE_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * Partage de la vCard via Web Share (AirDrop / menu natif).
 * Appel synchrone au clic : reçoit un getter qui retourne le fichier vCard pré-généré
 * (via buildVCardFile en amont) pour respecter la contrainte "user gesture".
 * Si le partage de fichier est impossible ou échoue, fallback sur downloadVCard (Enregistrer contact).
 *
 * @param getFile - Fonction synchrone qui retourne le File .vcf (ou null si pas encore prêt)
 * @param contact - Contact pour titre/text/url du share et pour le fallback download
 */
export function shareVCardViaAirDrop(
  getFile: () => File | null,
  contact: ContactInfo
): void {
  const file = getFile();
  const title = contact.name ? `${contact.name} – Carte Bööh` : 'Bööh – Carte';
  const text =
    contact.title || contact.company
      ? `${contact.title || ''}${contact.title && contact.company ? ' · ' : ''}${contact.company || ''}`.trim()
      : 'Ma carte de visite numérique Bööh';
  const url = contact.cardUrl || '';

  const fallbackDownload = () => {
    downloadVCard(contact);
  };

  if (!file) {
    fallbackDownload();
    return;
  }
  if (typeof navigator === 'undefined' || !navigator.share) {
    fallbackDownload();
    return;
  }
  if (!navigator.canShare || !navigator.canShare({ files: [file] })) {
    fallbackDownload();
    return;
  }

  navigator
    .share({ title, text, url, files: [file] })
    .catch((err: unknown) => {
      if ((err as { name?: string })?.name !== 'AbortError') {
        fallbackDownload();
      }
    });
}

export async function shareCardNative(contact: ContactInfo): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.share) {
    throw new Error('Web Share API non disponible');
  }

  const title = `${contact.name} – Carte Bööh`;
  const text = contact.title || contact.company ? `${contact.title || ''}${contact.title && contact.company ? ' · ' : ''}${contact.company || ''}`.trim() : 'Ma carte de visite numérique Bööh';
  const url = contact.cardUrl || '';

  const tryShareWithFile = async (): Promise<boolean> => {
    const vCard = await generateVCard(contact);
    const blob = new Blob([vCard], { type: 'text/vcard' });
    if (blob.size > MAX_SHARE_FILE_BYTES) return false;
    try {
      const file = new File([blob], `${contact.name.replace(/\s+/g, '_')}.vcf`, { type: 'text/vcard' });
      if (!navigator.canShare || !navigator.canShare({ files: [file] })) return false;
      await navigator.share({
        title,
        text,
        url,
        files: [file],
      });
      return true;
    } catch {
      return false;
    }
  };

  const shared = await tryShareWithFile();
  if (shared) return;

  await navigator.share({
    title,
    text: text ? `${text}\n${url}` : url,
    url: url || undefined,
  });
}

export type { ContactInfo };
