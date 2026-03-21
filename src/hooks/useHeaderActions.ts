import { useMemo } from 'react';
import { 
  Mail, Phone, MapPin, Instagram, Linkedin, Facebook, Twitter, Youtube,
  MessageCircle, Music
} from 'lucide-react';

interface ContactInfo {
  phone?: string;
  email?: string;
  address?: string;
}

interface Socials {
  instagram?: string;
  linkedin?: string;
  facebook?: string;
  twitter?: string;
  youtube?: string;
  whatsapp?: string;
  tiktok?: string;
}

interface ActionConfig {
  href: string;
  icon: any;
  label: string;
  color: string;
  hoverColor: string;
  target?: string;
  rel?: string;
}

export const useHeaderActions = (contactInfo: ContactInfo, socials?: Socials) => {
  const primaryActions = useMemo((): ActionConfig[] => {
    const actions: ActionConfig[] = [];

    if (contactInfo.phone) {
      actions.push({
        href: `tel:${contactInfo.phone}`,
        icon: Phone,
        label: 'Appeler',
        color: 'gray',
        hoverColor: 'hover:bg-gray-500/20'
      });
    }

    if (contactInfo.email) {
      actions.push({
        href: `mailto:${contactInfo.email}`,
        icon: Mail,
        label: 'Envoyer un email',
        color: 'gray',
        hoverColor: 'hover:bg-gray-500/20'
      });
    }

    if (contactInfo.address) {
      actions.push({
        href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactInfo.address)}`,
        icon: MapPin,
        label: 'Voir sur la carte',
        color: 'gray',
        hoverColor: 'hover:bg-gray-500/20',
        target: '_blank',
        rel: 'noopener noreferrer'
      });
    }

    return actions;
  }, [contactInfo]);

  const socialActions = useMemo((): ActionConfig[] => {
    if (!socials) return [];

    const actions: ActionConfig[] = [];

    if (socials.instagram) {
      actions.push({
        href: socials.instagram,
        icon: Instagram,
        label: 'Instagram',
        color: 'gray',
        hoverColor: 'hover:bg-gray-500/20',
        target: '_blank',
        rel: 'noopener noreferrer'
      });
    }

    if (socials.youtube) {
      actions.push({
        href: socials.youtube,
        icon: Youtube,
        label: 'YouTube',
        color: 'gray',
        hoverColor: 'hover:bg-gray-500/20',
        target: '_blank',
        rel: 'noopener noreferrer'
      });
    }

    if (socials.whatsapp) {
      actions.push({
        href: `https://wa.me/${socials.whatsapp}`,
        icon: MessageCircle,
        label: 'WhatsApp',
        color: 'gray',
        hoverColor: 'hover:bg-gray-500/20',
        target: '_blank',
        rel: 'noopener noreferrer'
      });
    }

    if (socials.linkedin) {
      actions.push({
        href: socials.linkedin,
        icon: Linkedin,
        label: 'LinkedIn',
        color: 'gray',
        hoverColor: 'hover:bg-gray-500/20',
        target: '_blank',
        rel: 'noopener noreferrer'
      });
    }

    if (socials.facebook) {
      actions.push({
        href: socials.facebook,
        icon: Facebook,
        label: 'Facebook',
        color: 'gray',
        hoverColor: 'hover:bg-gray-500/20',
        target: '_blank',
        rel: 'noopener noreferrer'
      });
    }

    if (socials.twitter) {
      actions.push({
        href: socials.twitter,
        icon: Twitter,
        label: 'Twitter',
        color: 'gray',
        hoverColor: 'hover:bg-gray-500/20',
        target: '_blank',
        rel: 'noopener noreferrer'
      });
    }

    if (socials.tiktok) {
      actions.push({
        href: socials.tiktok,
        icon: Music,
        label: 'TikTok',
        color: 'gray',
        hoverColor: 'hover:bg-gray-500/20',
        target: '_blank',
        rel: 'noopener noreferrer'
      });
    }

    return actions;
  }, [socials]);

  return {
    primaryActions,
    socialActions,
    allActions: [...primaryActions, ...socialActions]
  };
};
