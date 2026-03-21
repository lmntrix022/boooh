/**
 * 📝 Fichier de configuration d'exemple pour sw-lifecycle.js
 * 
 * Copiez les configurations qui vous intéressent dans sw-lifecycle.js
 */

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 CONFIGURATION 1 : EXPÉRIENCE UTILISATEUR OPTIMALE (Recommandé)
// ═══════════════════════════════════════════════════════════════════════════
const CONFIG_UX_OPTIMAL = {
  UPDATE_CHECK_INTERVAL: 60000,       // Vérifier chaque minute
  SHOW_UPDATE_NOTIFICATION: true,      // Afficher notification
  AUTO_RELOAD_DELAY: 10000,            // Auto-reload après 10s
  
  MESSAGES: {
    updateAvailable: '🎉 Une nouvelle version est disponible !',
    updateButton: 'Mettre à jour maintenant',
    updateLater: 'Plus tard',
    updating: 'Mise à jour en cours...'
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 🚀 CONFIGURATION 2 : MISE À JOUR IMMÉDIATE (Pour dashboards, apps critiques)
// ═══════════════════════════════════════════════════════════════════════════
const CONFIG_IMMEDIATE = {
  UPDATE_CHECK_INTERVAL: 30000,        // Vérifier toutes les 30s
  SHOW_UPDATE_NOTIFICATION: false,     // Pas de notification
  AUTO_RELOAD_DELAY: 0,                // N/A (rechargement immédiat)
  
  MESSAGES: {} // N/A
};

// ═══════════════════════════════════════════════════════════════════════════
// ⏱️ CONFIGURATION 3 : INTERVALLE LONG (Économiser la bande passante)
// ═══════════════════════════════════════════════════════════════════════════
const CONFIG_LONG_INTERVAL = {
  UPDATE_CHECK_INTERVAL: 300000,       // Vérifier toutes les 5 minutes
  SHOW_UPDATE_NOTIFICATION: true,
  AUTO_RELOAD_DELAY: 20000,            // 20s pour lire la notification
  
  MESSAGES: {
    updateAvailable: '✨ Nouvelle version disponible',
    updateButton: 'Actualiser',
    updateLater: 'Ignorer',
    updating: 'Actualisation...'
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 🔕 CONFIGURATION 4 : NOTIFICATION DISCRÈTE (Sans auto-reload)
// ═══════════════════════════════════════════════════════════════════════════
const CONFIG_DISCRETE = {
  UPDATE_CHECK_INTERVAL: 60000,
  SHOW_UPDATE_NOTIFICATION: true,
  AUTO_RELOAD_DELAY: 0,                // Pas d'auto-reload, utilisateur décide
  
  MESSAGES: {
    updateAvailable: 'Mise à jour disponible',
    updateButton: 'Recharger',
    updateLater: 'Pas maintenant',
    updating: 'Chargement...'
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 🌍 CONFIGURATION 5 : MULTI-LANGUES
// ═══════════════════════════════════════════════════════════════════════════
const CONFIG_I18N = {
  UPDATE_CHECK_INTERVAL: 60000,
  SHOW_UPDATE_NOTIFICATION: true,
  AUTO_RELOAD_DELAY: 10000,
  
  // Détection automatique de la langue
  MESSAGES: (() => {
    const lang = navigator.language || navigator.userLanguage;
    
    const translations = {
      'fr': {
        updateAvailable: '🎉 Une nouvelle version est disponible !',
        updateButton: 'Mettre à jour',
        updateLater: 'Plus tard',
        updating: 'Mise à jour...'
      },
      'en': {
        updateAvailable: '🎉 A new version is available!',
        updateButton: 'Update now',
        updateLater: 'Later',
        updating: 'Updating...'
      },
      'es': {
        updateAvailable: '🎉 ¡Nueva versión disponible!',
        updateButton: 'Actualizar',
        updateLater: 'Más tarde',
        updating: 'Actualizando...'
      },
      'de': {
        updateAvailable: '🎉 Neue Version verfügbar!',
        updateButton: 'Jetzt aktualisieren',
        updateLater: 'Später',
        updating: 'Wird aktualisiert...'
      }
    };
    
    // Retourner la traduction ou l'anglais par défaut
    return translations[lang.split('-')[0]] || translations['en'];
  })()
};

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 CONFIGURATION 6 : STYLE PERSONNALISÉ
// ═══════════════════════════════════════════════════════════════════════════
const CONFIG_CUSTOM_STYLE = {
  UPDATE_CHECK_INTERVAL: 60000,
  SHOW_UPDATE_NOTIFICATION: true,
  AUTO_RELOAD_DELAY: 15000,
  
  MESSAGES: {
    updateAvailable: '🚀 Nouvelle version !',
    updateButton: 'Installer',
    updateLater: 'Annuler',
    updating: 'Installation...'
  },
  
  // Style personnalisé pour la notification
  NOTIFICATION_STYLE: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    maxWidth: '360px'
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 🔬 CONFIGURATION 7 : MODE DEBUG (Développement)
// ═══════════════════════════════════════════════════════════════════════════
const CONFIG_DEBUG = {
  UPDATE_CHECK_INTERVAL: 10000,        // Vérifier toutes les 10s pour dev
  SHOW_UPDATE_NOTIFICATION: true,
  AUTO_RELOAD_DELAY: 5000,             // 5s en dev pour itérer rapidement
  
  MESSAGES: {
    updateAvailable: '[DEBUG] Nouvelle version détectée',
    updateButton: '[DEBUG] Recharger',
    updateLater: '[DEBUG] Ignorer',
    updating: '[DEBUG] Rechargement...'
  },
  
  // Logs verbeux
  DEBUG: true,
  LOG_LEVEL: 'verbose' // 'quiet', 'normal', 'verbose'
};

// ═══════════════════════════════════════════════════════════════════════════
// ⚡ CONFIGURATION 8 : PERFORMANCE MAXIMALE
// ═══════════════════════════════════════════════════════════════════════════
const CONFIG_PERFORMANCE = {
  UPDATE_CHECK_INTERVAL: 120000,       // Vérifier toutes les 2 minutes (moins de requêtes)
  SHOW_UPDATE_NOTIFICATION: false,     // Pas de notification (pas de DOM)
  AUTO_RELOAD_DELAY: 0,
  
  MESSAGES: {},
  
  // Vérifier uniquement quand l'utilisateur est actif
  CHECK_ONLY_WHEN_ACTIVE: true,
  
  // Ne pas vérifier si l'utilisateur est en mobile avec économie de données
  RESPECT_SAVE_DATA: true
};

// ═══════════════════════════════════════════════════════════════════════════
// 🛡️ CONFIGURATION 9 : SÉCURITÉ MAXIMALE (Pour apps sensibles)
// ═══════════════════════════════════════════════════════════════════════════
const CONFIG_SECURITY = {
  UPDATE_CHECK_INTERVAL: 30000,        // Vérifier fréquemment (30s)
  SHOW_UPDATE_NOTIFICATION: false,     // Rechargement immédiat sans choix
  AUTO_RELOAD_DELAY: 0,
  
  MESSAGES: {},
  
  // Forcer la mise à jour même si l'utilisateur a du contenu non sauvegardé
  FORCE_UPDATE: true,
  
  // Logs minimaux pour la sécurité
  SILENT_MODE: true
};

// ═══════════════════════════════════════════════════════════════════════════
// 📱 CONFIGURATION 10 : ADAPTATIF (Mobile vs Desktop)
// ═══════════════════════════════════════════════════════════════════════════
const CONFIG_ADAPTIVE = {
  // Détecter si mobile ou desktop
  UPDATE_CHECK_INTERVAL: (() => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    return isMobile ? 120000 : 60000;  // 2 min mobile, 1 min desktop
  })(),
  
  SHOW_UPDATE_NOTIFICATION: true,
  
  AUTO_RELOAD_DELAY: (() => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    return isMobile ? 15000 : 10000;   // Plus de temps sur mobile
  })(),
  
  MESSAGES: {
    updateAvailable: '📲 Mise à jour disponible',
    updateButton: 'OK',
    updateLater: 'Pas maintenant',
    updating: 'Chargement...'
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 CONFIGURATION 11 : CONTEXTE-AWARE (Basé sur l'heure et l'activité)
// ═══════════════════════════════════════════════════════════════════════════
const CONFIG_CONTEXT_AWARE = {
  // Vérifier moins souvent la nuit
  UPDATE_CHECK_INTERVAL: (() => {
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 22;
    return isNight ? 300000 : 60000;   // 5 min nuit, 1 min jour
  })(),
  
  SHOW_UPDATE_NOTIFICATION: true,
  
  // Plus de temps de réaction si l'utilisateur semble occupé
  AUTO_RELOAD_DELAY: (() => {
    // Si l'utilisateur a beaucoup scrollé récemment = occupé
    const recentActivity = window.__USER_ACTIVITY__ || 0;
    return recentActivity > 100 ? 20000 : 10000;
  })(),
  
  MESSAGES: {
    updateAvailable: '✨ Mise à jour prête',
    updateButton: 'Installer',
    updateLater: 'Plus tard',
    updating: 'Installation...'
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 📊 CONFIGURATION 12 : AVEC ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════
const CONFIG_WITH_ANALYTICS = {
  UPDATE_CHECK_INTERVAL: 60000,
  SHOW_UPDATE_NOTIFICATION: true,
  AUTO_RELOAD_DELAY: 10000,
  
  MESSAGES: {
    updateAvailable: '🎉 Nouvelle version !',
    updateButton: 'Installer',
    updateLater: 'Plus tard',
    updating: 'Installation...'
  },
  
  // Hooks pour analytics
  HOOKS: {
    onUpdateDetected: () => {
      // Google Analytics
      if (window.gtag) {
        gtag('event', 'sw_update_detected', {
          event_category: 'PWA',
          event_label: 'Update Available'
        });
      }
    },
    
    onUpdateAccepted: () => {
      if (window.gtag) {
        gtag('event', 'sw_update_accepted', {
          event_category: 'PWA',
          event_label: 'User Clicked Update'
        });
      }
    },
    
    onUpdateDismissed: () => {
      if (window.gtag) {
        gtag('event', 'sw_update_dismissed', {
          event_category: 'PWA',
          event_label: 'User Clicked Later'
        });
      }
    },
    
    onUpdateCompleted: () => {
      if (window.gtag) {
        gtag('event', 'sw_update_completed', {
          event_category: 'PWA',
          event_label: 'Page Reloaded'
        });
      }
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 💡 COMMENT UTILISER CES CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════

/*
1. Choisissez la configuration qui correspond à votre cas d'usage
2. Copiez-la dans sw-lifecycle.js
3. Remplacez l'objet CONFIG existant
4. Testez avec ./scripts/test-sw-update.sh

EXEMPLES :

// Pour une application grand public (recommandé)
const CONFIG = CONFIG_UX_OPTIMAL;

// Pour un dashboard admin
const CONFIG = CONFIG_IMMEDIATE;

// Pour une app multilingue
const CONFIG = CONFIG_I18N;

// Pour une app mobile
const CONFIG = CONFIG_ADAPTIVE;

// En développement
const CONFIG = CONFIG_DEBUG;
*/

// ═══════════════════════════════════════════════════════════════════════════
// 🔧 CONFIGURATION HYBRIDE PERSONNALISÉE
// ═══════════════════════════════════════════════════════════════════════════

// Vous pouvez aussi combiner plusieurs configs :
const CONFIG_HYBRID = {
  ...CONFIG_UX_OPTIMAL,                // Base
  ...CONFIG_I18N.MESSAGES,             // + Multi-langues
  HOOKS: CONFIG_WITH_ANALYTICS.HOOKS   // + Analytics
};

// Exporter pour utilisation
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CONFIG_UX_OPTIMAL,
    CONFIG_IMMEDIATE,
    CONFIG_LONG_INTERVAL,
    CONFIG_DISCRETE,
    CONFIG_I18N,
    CONFIG_CUSTOM_STYLE,
    CONFIG_DEBUG,
    CONFIG_PERFORMANCE,
    CONFIG_SECURITY,
    CONFIG_ADAPTIVE,
    CONFIG_CONTEXT_AWARE,
    CONFIG_WITH_ANALYTICS,
    CONFIG_HYBRID
  };
}

