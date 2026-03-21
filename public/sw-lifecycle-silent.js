/**
 * 🔇 Version SILENCIEUSE du gestionnaire de cycle de vie du Service Worker
 * 
 * Cette version recharge automatiquement la page sans notification utilisateur
 * dès qu'une nouvelle version est détectée.
 * 
 * UTILISATION :
 * Remplacer dans index.html :
 *   <script src="/sw-lifecycle.js"></script>
 * par :
 *   <script src="/sw-lifecycle-silent.js"></script>
 * 
 * AVANTAGES :
 * - Pas d'interruption de l'expérience utilisateur
 * - Mise à jour transparente
 * - Moins de code
 * 
 * INCONVÉNIENTS :
 * - L'utilisateur peut perdre des données non sauvegardées
 * - Rechargement inattendu peut être perturbant
 * 
 * RECOMMANDATION :
 * Utiliser cette version uniquement si :
 * - Votre app sauvegarde automatiquement (pas de formulaires longs)
 * - Les mises à jour sont critiques (bugs de sécurité)
 * - Vous préférez forcer les utilisateurs à voir la dernière version
 */

// Configuration simplifiée
const CONFIG = {
  UPDATE_CHECK_INTERVAL: 60000, // Vérifier toutes les minutes
  ENABLE_LOGS: true // Afficher les logs dans la console
};

/**
 * Logger conditionnel
 */
function log(emoji, ...args) {
  if (CONFIG.ENABLE_LOGS) {
    console.log(`${emoji}`, ...args);
  }
}

/**
 * Active immédiatement le nouveau Service Worker et recharge la page
 */
function activateNewServiceWorker(worker) {
  log('⚡', 'Activation du nouveau Service Worker...');
  
  // Envoyer le message SKIP_WAITING
  worker.postMessage({ type: 'SKIP_WAITING' });
  
  // Écouter le changement de contrôleur et recharger
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    log('✅', 'Nouveau Service Worker activé, rechargement...');
    window.location.reload();
  }, { once: true });
}

/**
 * Gère la détection d'un nouveau Service Worker
 */
function handleUpdate(registration) {
  const worker = registration.waiting || registration.installing;
  
  if (!worker) return;
  
  log('🆕', 'Nouvelle version détectée');
  
  if (registration.waiting) {
    // Le SW est déjà installé, activer immédiatement
    activateNewServiceWorker(registration.waiting);
  } else {
    // Le SW est en cours d'installation, attendre qu'il soit prêt
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) {
        activateNewServiceWorker(worker);
      }
    });
  }
}

/**
 * Vérifie les mises à jour
 */
async function checkForUpdates(registration) {
  try {
    log('🔍', 'Vérification des mises à jour...');
    await registration.update();
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

/**
 * Initialisation du Service Worker
 */
async function init() {
  if (!('serviceWorker' in navigator)) {
    console.warn('⚠️ Service Workers non supportés');
    return;
  }
  
  try {
    // Attendre le chargement complet
    await new Promise(resolve => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve, { once: true });
      }
    });
    
    log('🚀', 'Enregistrement du Service Worker...');
    
    // Enregistrer le SW
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none'
    });
    
    log('✅', 'Service Worker enregistré');
    
    // Gérer les SW en attente
    if (registration.waiting) {
      handleUpdate(registration);
    }
    
    // Écouter les nouveaux SW
    registration.addEventListener('updatefound', () => {
      log('📦', 'Nouveau Service Worker en cours d\'installation...');
      handleUpdate(registration);
    });
    
    // Vérifications périodiques
    checkForUpdates(registration);
    setInterval(() => checkForUpdates(registration), CONFIG.UPDATE_CHECK_INTERVAL);
    
    // Vérifier au retour sur l'onglet
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        checkForUpdates(registration);
      }
    });
    
    log('⏰', `Vérifications configurées (intervalle: ${CONFIG.UPDATE_CHECK_INTERVAL / 1000}s)`);
    
    // Méthode de debug
    window.checkForSWUpdate = () => checkForUpdates(registration);
    
  } catch (error) {
    console.error('❌ Erreur d\'enregistrement:', error);
  }
}

// Lancer l'initialisation
init();

