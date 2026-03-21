/**
 * Service d'analyse des statistiques et user agents
 * Pour améliorer la fiabilité des données analytics
 */

// Types pour les analytics
export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  os: 'iOS' | 'Android' | 'Windows' | 'macOS' | 'Linux' | 'Other';
  browser: 'Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Other';
  platform: string;
}

export interface TrafficSource {
  type: 'direct' | 'social' | 'email' | 'search' | 'referral';
  platform?: string; // Ex: Facebook, LinkedIn, Google
  url?: string;
}

export interface ClickEvent {
  card_id: string;
  link_type: 'phone' | 'email' | 'social' | 'website' | 'vcard' | 'appointment' | 'marketplace' | 'other';
  link_label: string; // Ex: "WhatsApp", "Email principal", "Instagram"
  link_url?: string;
  viewer_ip?: string;
  user_agent?: string;
  referrer?: string;
  clicked_at: string;
}

/**
 * Analyse le User Agent pour extraire les informations sur l'appareil
 */
export const parseUserAgent = (userAgent: string | null): DeviceInfo => {
  if (!userAgent) {
    return {
      type: 'unknown',
      os: 'Other',
      browser: 'Other',
      platform: 'Unknown'
    };
  }

  const ua = userAgent.toLowerCase();

  // Détection du type d'appareil
  let type: DeviceInfo['type'] = 'desktop';
  if (/mobile|android|iphone|ipod/.test(ua)) {
    type = 'mobile';
  } else if (/ipad|tablet/.test(ua)) {
    type = 'tablet';
  }

  // Détection de l'OS
  let os: DeviceInfo['os'] = 'Other';
  if (/iphone|ipad|ipod/.test(ua)) {
    os = 'iOS';
  } else if (/android/.test(ua)) {
    os = 'Android';
  } else if (/windows/.test(ua)) {
    os = 'Windows';
  } else if (/mac os x/.test(ua)) {
    os = 'macOS';
  } else if (/linux/.test(ua)) {
    os = 'Linux';
  }

  // Détection du navigateur
  let browser: DeviceInfo['browser'] = 'Other';
  if (/chrome/.test(ua) && !/edg/.test(ua)) {
    browser = 'Chrome';
  } else if (/safari/.test(ua) && !/chrome/.test(ua)) {
    browser = 'Safari';
  } else if (/firefox/.test(ua)) {
    browser = 'Firefox';
  } else if (/edg/.test(ua)) {
    browser = 'Edge';
  }

  // Plateforme détaillée
  let platform = 'Unknown';
  if (os === 'iOS') {
    platform = type === 'tablet' ? 'iPad' : 'iPhone';
  } else if (os === 'Android') {
    platform = type === 'tablet' ? 'Android Tablet' : 'Android Phone';
  } else {
    platform = `${os} ${browser}`;
  }

  return {
    type,
    os,
    browser,
    platform
  };
};

/**
 * Analyse le referrer pour déterminer la source de trafic
 */
export const parseTrafficSource = (referrer: string | null, url: string): TrafficSource => {
  if (!referrer || referrer === url || referrer.includes(window.location.hostname)) {
    return {
      type: 'direct',
      url: referrer || undefined
    };
  }

  const refLower = referrer.toLowerCase();

  // Réseaux sociaux
  const socialPlatforms = [
    { pattern: /facebook\.com|fb\.com/i, name: 'Facebook' },
    { pattern: /instagram\.com/i, name: 'Instagram' },
    { pattern: /linkedin\.com/i, name: 'LinkedIn' },
    { pattern: /twitter\.com|x\.com/i, name: 'Twitter/X' },
    { pattern: /tiktok\.com/i, name: 'TikTok' },
    { pattern: /whatsapp\.com/i, name: 'WhatsApp' },
    { pattern: /t\.me|telegram/i, name: 'Telegram' },
    { pattern: /youtube\.com/i, name: 'YouTube' }
  ];

  for (const social of socialPlatforms) {
    if (social.pattern.test(refLower)) {
      return {
        type: 'social',
        platform: social.name,
        url: referrer
      };
    }
  }

  // Moteurs de recherche
  const searchEngines = [
    { pattern: /google\./i, name: 'Google' },
    { pattern: /bing\./i, name: 'Bing' },
    { pattern: /yahoo\./i, name: 'Yahoo' },
    { pattern: /duckduckgo\./i, name: 'DuckDuckGo' }
  ];

  for (const engine of searchEngines) {
    if (engine.pattern.test(refLower)) {
      return {
        type: 'search',
        platform: engine.name,
        url: referrer
      };
    }
  }

  // Email (souvent détecté par des paramètres UTM ou des domaines email)
  if (/utm_source=email|utm_medium=email|mail\.|email\./i.test(refLower)) {
    return {
      type: 'email',
      url: referrer
    };
  }

  // Autres sites (referral)
  return {
    type: 'referral',
    url: referrer
  };
};

/**
 * Génère un identifiant anonyme pour un visiteur
 * Basé sur IP + User Agent (hashé pour la confidentialité)
 */
export const generateVisitorId = async (ip: string | null, userAgent: string | null): Promise<string> => {
  const data = `${ip || 'unknown'}-${userAgent || 'unknown'}`;

  // Utiliser l'API Web Crypto pour hasher
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
};

/**
 * Obtient l'IP du visiteur (côté client, approximatif)
 * Note: Pour une vraie IP, il faut utiliser une API côté serveur
 * Utilise plusieurs services de fallback au cas où certains seraient bloqués
 */
export const getVisitorIP = async (): Promise<string | null> => {
  // Liste de services IP compatibles CORS (ordre par préférence)
  // Note: Certains peuvent être bloqués par AdBlock, d'où plusieurs alternatives
  // Désactivé : Les services IP publics sont souvent bloqués par AdBlock
  // et génèrent des erreurs dans la console. L'IP n'est pas nécessaire
  // pour le tracking (on utilise visitor_id hashé). C'est aussi mieux
  // pour la vie privée (RGPD).
  // 
  // Si besoin de l'IP réelle, utilisez une Edge Function Supabase côté serveur.
  return null;
  
  /* Code désactivé pour éviter les erreurs AdBlock :
  const ipServices: Array<{ url: string; type: 'json' | 'text' }> = [
    { url: 'https://api.ipify.org?format=json', type: 'json' },
    { url: 'https://icanhazip.com', type: 'text' },
    { url: 'https://api.ip.sb/ip', type: 'text' },
    { url: 'https://api.ipify.org?format=text', type: 'text' },
  ];

  for (const service of ipServices) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      let ip: string | null = null;

      try {
        if (service.type === 'json') {
          // Service JSON
          const response = await fetch(service.url, { 
            signal: controller.signal,
            headers: { 'Accept': 'application/json' },
            mode: 'cors'
          });
          
          if (response.ok) {
            const data = await response.json();
            ip = data.ip || data.query || null;
          }
        } else {
          // Service texte simple
          const response = await fetch(service.url, { 
            signal: controller.signal,
            headers: { 'Accept': 'text/plain' },
            mode: 'cors'
          });
          
          if (response.ok) {
            const text = await response.text();
            ip = text.trim() || null;
          }
        }
      } catch (fetchError: any) {
        // Capturer silencieusement toutes les erreurs (CORS, AdBlock, réseau, etc.)
        // Ne pas logger pour éviter le spam dans la console
        clearTimeout(timeoutId);
        continue;
      }

      clearTimeout(timeoutId);

      // Valider que c'est une IP IPv4 valide
      if (ip && /^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
        return ip;
      }
    } catch (error) {
      // Erreur silencieuse - passer au service suivant
      // Ne pas logger pour éviter le spam dans la console
      continue;
    }
  }

  // Si tous les services ont échoué, retourner null
  // Le tracking continuera sans IP (c'est acceptable et même préférable pour la vie privée)
  return null;
  */
};

/**
 * Statistiques calculées pour le tableau de bord
 */
export interface AnalyticsStats {
  totalViews: number;
  uniqueViews: number;
  deviceBreakdown: {
    mobile: number;
    tablet: number;
    desktop: number;
    unknown: number;
  };
  osBreakdown: {
    [key: string]: number;
  };
  browserBreakdown: {
    [key: string]: number;
  };
  trafficSources: {
    direct: number;
    social: number;
    email: number;
    search: number;
    referral: number;
  };
  topSocialPlatforms: Array<{ platform: string; count: number }>;
  topReferrers: Array<{ url: string; count: number }>;
}

/**
 * Calcule les statistiques à partir des données brutes de card_views
 */
export const calculateAnalytics = (views: any[]): AnalyticsStats => {
  // Sum the 'count' column for total views instead of counting array length
  const totalViews = views.reduce((sum, view) => sum + (view.count || 1), 0);

  const stats: AnalyticsStats = {
    totalViews,
    uniqueViews: 0,
    deviceBreakdown: { mobile: 0, tablet: 0, desktop: 0, unknown: 0 },
    osBreakdown: {},
    browserBreakdown: {},
    trafficSources: { direct: 0, social: 0, email: 0, search: 0, referral: 0 },
    topSocialPlatforms: [],
    topReferrers: []
  };

  // Pour calculer les vues uniques (par IP ou visitor_id unique)
  const uniqueIPs = new Set<string>();
  const socialPlatforms: { [key: string]: number } = {};
  const referrers: { [key: string]: number } = {};

  views.forEach(view => {
    const viewCount = view.count || 1;

    // Vues uniques
    if (view.viewer_ip) {
      uniqueIPs.add(view.viewer_ip);
    }

    // Analyse de l'appareil (weighted by count)
    const deviceInfo = parseUserAgent(view.user_agent);
    stats.deviceBreakdown[deviceInfo.type] += viewCount;

    // OS (weighted by count)
    stats.osBreakdown[deviceInfo.os] = (stats.osBreakdown[deviceInfo.os] || 0) + viewCount;

    // Navigateur (weighted by count)
    stats.browserBreakdown[deviceInfo.browser] = (stats.browserBreakdown[deviceInfo.browser] || 0) + viewCount;

    // Source de trafic (weighted by count)
    const source = parseTrafficSource(view.referrer, view.card_id);
    stats.trafficSources[source.type] += viewCount;

    // Top plateformes sociales (weighted by count)
    if (source.type === 'social' && source.platform) {
      socialPlatforms[source.platform] = (socialPlatforms[source.platform] || 0) + viewCount;
    }

    // Top referrers (weighted by count)
    if (source.url && source.type !== 'direct') {
      referrers[source.url] = (referrers[source.url] || 0) + viewCount;
    }
  });

  stats.uniqueViews = uniqueIPs.size;

  // Top 5 plateformes sociales
  stats.topSocialPlatforms = Object.entries(socialPlatforms)
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top 5 referrers
  stats.topReferrers = Object.entries(referrers)
    .map(([url, count]) => ({ url, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return stats;
};

/**
 * Statistiques de clics (CTR)
 */
export interface ClickStats {
  totalClicks: number;
  clicksByType: {
    phone: number;
    email: number;
    social: number;
    website: number;
    vcard: number;
    appointment: number;
    marketplace: number;
    other: number;
  };
  topLinks: Array<{ label: string; type: string; count: number }>;
  ctr: number; // Click-Through Rate (clics / vues)
}

/**
 * Calcule les statistiques de clics
 */
export const calculateClickStats = (clicks: ClickEvent[], totalViews: number): ClickStats => {
  const stats: ClickStats = {
    totalClicks: clicks.length,
    clicksByType: {
      phone: 0,
      email: 0,
      social: 0,
      website: 0,
      vcard: 0,
      appointment: 0,
      marketplace: 0,
      other: 0
    },
    topLinks: [],
    ctr: totalViews > 0 ? (clicks.length / totalViews) * 100 : 0
  };

  const linkCounts: { [key: string]: { label: string; type: string; count: number } } = {};

  clicks.forEach(click => {
    // Par type
    stats.clicksByType[click.link_type]++;

    // Par lien
    const key = `${click.link_type}-${click.link_label}`;
    if (!linkCounts[key]) {
      linkCounts[key] = { label: click.link_label, type: click.link_type, count: 0 };
    }
    linkCounts[key].count++;
  });

  // Top 10 liens les plus cliqués
  stats.topLinks = Object.values(linkCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return stats;
};
