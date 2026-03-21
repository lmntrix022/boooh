/**
 * 🔄 Gestionnaire du cycle de vie du Service Worker
 * 
 * Ce fichier résout le problème des utilisateurs qui voient l'ancienne version
 * après un déploiement en gérant correctement le cycle de vie du SW.
 * 
 * PROBLÈME RÉSOLU :
 * - Détection automatique des nouvelles versions
 * - Activation immédiate du nouveau Service Worker
 * - Rechargement automatique de la page pour les utilisateurs
 * - Notification optionnelle avant le rechargement
 */

// Configuration
const CONFIG = {
  // Intervalle de vérification des mises à jour (en millisecondes)
  // 60000 = 1 minute, 300000 = 5 minutes
  UPDATE_CHECK_INTERVAL: 60000, // Vérifier toutes les minutes
  
  // Afficher une notification avant de recharger (true = avec notification, false = rechargement immédiat)
  SHOW_UPDATE_NOTIFICATION: true,
  
  // Délai avant rechargement automatique si l'utilisateur ne clique pas (en millisecondes)
  AUTO_RELOAD_DELAY: 10000, // 10 secondes
  
  // Textes personnalisables
  MESSAGES: {
    updateAvailable: '🎉 Une nouvelle version est disponible !',
    updateButton: 'Mettre à jour maintenant',
    updateLater: 'Plus tard',
    updating: 'Mise à jour en cours...'
  }
};

// Désactiver en dev/local pour éviter les erreurs de MIME (sw.js servi en HTML)
const SW_DISABLED =
  typeof window !== 'undefined' &&
  (location.hostname === 'localhost' || location.protocol !== 'https:');

/**
 * Affiche une notification de mise à jour à l'utilisateur
 * @param {Function} onUpdate - Callback appelé quand l'utilisateur clique sur "Mettre à jour"
 */
function showUpdateNotification(onUpdate) {
  // Créer le conteneur de notification
  const notification = document.createElement('div');
  notification.id = 'sw-update-notification';
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 360px;
    animation: slideInUp 0.4s ease-out;
  `;
  
  notification.innerHTML = `
    <style>
      @keyframes slideInUp {
        from {
          transform: translateY(100px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      @keyframes fadeOut {
        to {
          opacity: 0;
          transform: translateY(20px);
        }
      }
      #sw-update-notification button {
        margin: 8px 8px 0 0;
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      #sw-update-notification .primary-btn {
        background: white;
        color: #667eea;
      }
      #sw-update-notification .primary-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(255, 255, 255, 0.3);
      }
      #sw-update-notification .secondary-btn {
        background: rgba(255, 255, 255, 0.2);
        color: white;
      }
      #sw-update-notification .secondary-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    </style>
    <div style="margin-bottom: 8px; font-size: 16px; font-weight: 600;">
      ${CONFIG.MESSAGES.updateAvailable}
    </div>
    <div style="font-size: 14px; opacity: 0.9; margin-bottom: 12px;">
      Cliquez sur "Mettre à jour" pour profiter des dernières améliorations.
    </div>
    <div>
      <button class="primary-btn" id="sw-update-btn">
        ${CONFIG.MESSAGES.updateButton}
      </button>
      <button class="secondary-btn" id="sw-dismiss-btn">
        ${CONFIG.MESSAGES.updateLater}
      </button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Gestion des boutons
  document.getElementById('sw-update-btn').addEventListener('click', () => {
    notification.querySelector('.primary-btn').textContent = CONFIG.MESSAGES.updating;
    notification.querySelector('.primary-btn').disabled = true;
    notification.querySelector('.secondary-btn').style.display = 'none';
    onUpdate();
  });
  
  document.getElementById('sw-dismiss-btn').addEventListener('click', () => {
    notification.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  });
  
  // Auto-reload après le délai configuré
  if (CONFIG.AUTO_RELOAD_DELAY > 0) {
    setTimeout(() => {
      if (document.getElementById('sw-update-notification')) {
        onUpdate();
      }
    }, CONFIG.AUTO_RELOAD_DELAY);
  }
}

/**
 * Envoie un message au Service Worker pour activer immédiatement la nouvelle version
 * @param {ServiceWorker} worker - Le Service Worker en attente
 */
function skipWaiting(worker) {
  console.log('📨 Envoi du message SKIP_WAITING au Service Worker...');
  worker.postMessage({ type: 'SKIP_WAITING' });
}

/**
 * Recharge la page de manière propre
 */
function reloadPage() {
  console.log('🔄 Rechargement de la page pour appliquer la mise à jour...');
  window.location.reload();
}

/**
 * Gère la découverte d'un nouveau Service Worker
 * @param {ServiceWorkerRegistration} registration
 */
function handleServiceWorkerUpdate(registration) {
  const waitingWorker = registration.waiting;
  
  if (!waitingWorker) {
    console.log('⚠️ Aucun Service Worker en attente trouvé');
    return;
  }
  
  console.log('🆕 Nouveau Service Worker détecté !');
  
  // Fonction pour activer le nouveau SW et recharger
  const activateNewVersion = () => {
    skipWaiting(waitingWorker);
    
    // Écouter l'événement controllerchange pour savoir quand recharger
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('✅ Nouveau Service Worker activé !');
      reloadPage();
    }, { once: true });
  };
  
  if (CONFIG.SHOW_UPDATE_NOTIFICATION) {
    // Afficher une notification à l'utilisateur
    showUpdateNotification(activateNewVersion);
  } else {
    // Rechargement immédiat sans notification
    activateNewVersion();
  }
}

/**
 * Vérifie manuellement s'il y a une mise à jour du Service Worker
 * @param {ServiceWorkerRegistration} registration
 */
async function checkForUpdates(registration) {
  try {
    console.log('🔍 Vérification des mises à jour du Service Worker...');
    await registration.update();
    console.log('✓ Vérification terminée');
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des mises à jour:', error);
  }
}

/**
 * Configure la vérification périodique des mises à jour
 * @param {ServiceWorkerRegistration} registration
 */
function setupPeriodicUpdateCheck(registration) {
  // Vérifier immédiatement au chargement
  checkForUpdates(registration);
  
  // Vérifier périodiquement selon l'intervalle configuré
  setInterval(() => {
    checkForUpdates(registration);
  }, CONFIG.UPDATE_CHECK_INTERVAL);
  
  // Vérifier quand l'utilisateur revient sur l'onglet
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      checkForUpdates(registration);
    }
  });
  
  console.log(`⏰ Vérification périodique configurée (intervalle: ${CONFIG.UPDATE_CHECK_INTERVAL / 1000}s)`);
}

/**
 * Initialise la gestion du Service Worker
 */
async function initServiceWorker() {
  if (SW_DISABLED) {
    console.info('[SW] Désactivé en environnement non sécurisé (dev/local)');
    return;
  }
  // Vérifier si les Service Workers sont supportés
  if (!('serviceWorker' in navigator)) {
    console.warn('⚠️ Les Service Workers ne sont pas supportés par ce navigateur');
    return;
  }
  
  try {
    console.log('🚀 Initialisation du Service Worker...');
    
    // Attendre que la page soit complètement chargée
    await new Promise(resolve => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve, { once: true });
      }
    });
    
    // Enregistrer le Service Worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none' // Important : ne pas mettre en cache le fichier sw.js
    });
    
    console.log('✅ Service Worker enregistré avec succès');
    
    // CAS 1 : Un Service Worker est déjà en attente au moment de l'enregistrement
    if (registration.waiting) {
      console.log('⚡ Service Worker en attente détecté immédiatement');
      handleServiceWorkerUpdate(registration);
    }
    
    // CAS 2 : Un Service Worker passe en attente pendant l'installation
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('📦 Installation d\'un nouveau Service Worker détectée...');
      
      newWorker.addEventListener('statechange', () => {
        console.log(`📊 État du Service Worker: ${newWorker.state}`);
        
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // Un nouveau SW est installé mais l'ancien est toujours actif
          console.log('🔄 Nouveau Service Worker installé, en attente d\'activation');
          handleServiceWorkerUpdate(registration);
        }
      });
    });
    
    // Configurer les vérifications périodiques
    setupPeriodicUpdateCheck(registration);
    
    // Exposer une méthode globale pour forcer une mise à jour (utile pour le debug)
    window.checkForSWUpdate = () => checkForUpdates(registration);
    console.log('💡 Astuce: Tapez window.checkForSWUpdate() dans la console pour vérifier manuellement les mises à jour');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'enregistrement du Service Worker:', error);
  }
}

// Lancer l'initialisation dès que le script est chargé
initServiceWorker();

// Exporter pour permettre une utilisation programmatique
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initServiceWorker,
    CONFIG
  };
}

