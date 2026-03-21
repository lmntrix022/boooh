# 🔄 Guide de Gestion des Mises à Jour du Service Worker

## 📋 Table des matières
- [Problème résolu](#problème-résolu)
- [Architecture de la solution](#architecture-de-la-solution)
- [Configuration](#configuration)
- [Comment ça marche](#comment-ça-marche)
- [Tests](#tests)
- [Dépannage](#dépannage)
- [Options avancées](#options-avancées)

---

## 🎯 Problème résolu

### Symptôme
Après un déploiement, les utilisateurs continuent de voir l'ancienne version de l'application. Ils doivent vider manuellement le cache ou faire Ctrl+F5 pour voir la nouvelle version.

### Cause
Le cycle de vie du Service Worker n'était pas géré correctement :
1. Le nouveau Service Worker s'installe mais reste en état **"waiting"**
2. L'ancien Service Worker reste actif
3. Le navigateur ne passe pas automatiquement à la nouvelle version
4. Aucun rechargement automatique n'est déclenché

### Solution implémentée
Un gestionnaire de cycle de vie personnalisé (`sw-lifecycle.js`) qui :
- ✅ Détecte automatiquement les nouvelles versions
- ✅ Force l'activation du nouveau Service Worker avec `skipWaiting()`
- ✅ Recharge automatiquement la page après activation
- ✅ Vérifie périodiquement les mises à jour (toutes les minutes par défaut)
- ✅ Vérifie au retour de l'utilisateur sur l'onglet
- ✅ Affiche une notification utilisateur (optionnel)

---

## 🏗️ Architecture de la solution

```
┌─────────────────────────────────────────────────────────────┐
│                    Cycle de vie PWA                         │
└─────────────────────────────────────────────────────────────┘

1. DÉPLOIEMENT
   ↓
   Nouveau fichier sw.js sur le serveur
   
2. DÉTECTION (sw-lifecycle.js)
   ↓
   - Vérification automatique toutes les 60s
   - Vérification au retour sur l'onglet
   - Événement 'updatefound' du SW
   
3. INSTALLATION
   ↓
   Nouveau SW téléchargé et installé
   État: "installed" → "waiting"
   
4. ACTIVATION FORCÉE
   ↓
   Message SKIP_WAITING envoyé au SW
   État: "waiting" → "activating" → "activated"
   
5. RECHARGEMENT
   ↓
   window.location.reload()
   Nouvelle version visible par l'utilisateur

┌─────────────────────────────────────────────────────────────┐
│                    Fichiers impliqués                       │
└─────────────────────────────────────────────────────────────┘

/public/sw-lifecycle.js        → Gestionnaire principal
/dist/sw.js                    → Service Worker (généré par Vite)
/index.html                    → Charge sw-lifecycle.js
/vite.config.ts                → Config PWA (injectRegister: null)
```

---

## ⚙️ Configuration

### Configuration par défaut

Le fichier `/public/sw-lifecycle.js` contient un objet `CONFIG` personnalisable :

```javascript
const CONFIG = {
  // Intervalle de vérification des mises à jour (ms)
  UPDATE_CHECK_INTERVAL: 60000, // 1 minute
  
  // Afficher une notification avant le rechargement
  SHOW_UPDATE_NOTIFICATION: true,
  
  // Délai avant rechargement auto (si notification activée)
  AUTO_RELOAD_DELAY: 10000, // 10 secondes
  
  // Textes personnalisables
  MESSAGES: {
    updateAvailable: '🎉 Une nouvelle version est disponible !',
    updateButton: 'Mettre à jour maintenant',
    updateLater: 'Plus tard',
    updating: 'Mise à jour en cours...'
  }
};
```

### Modes disponibles

#### Mode 1 : Avec notification (par défaut)
```javascript
SHOW_UPDATE_NOTIFICATION: true
```
- Affiche une notification élégante en bas à droite
- Boutons : "Mettre à jour maintenant" / "Plus tard"
- Rechargement automatique après 10s si l'utilisateur ne clique pas
- **Recommandé pour une meilleure UX**

#### Mode 2 : Silencieux (rechargement immédiat)
```javascript
SHOW_UPDATE_NOTIFICATION: false
```
- Aucune notification
- Rechargement immédiat dès qu'une nouvelle version est détectée
- **Recommandé pour des mises à jour critiques**

---

## 🔧 Comment ça marche

### 1. Détection des mises à jour

Le script vérifie automatiquement les mises à jour dans 3 situations :

**A. Au chargement de la page**
```javascript
// Vérifie immédiatement au chargement
checkForUpdates(registration);
```

**B. Périodiquement**
```javascript
// Toutes les 60 secondes (configurable)
setInterval(() => {
  checkForUpdates(registration);
}, CONFIG.UPDATE_CHECK_INTERVAL);
```

**C. Retour sur l'onglet**
```javascript
// Quand l'utilisateur revient sur l'onglet
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    checkForUpdates(registration);
  }
});
```

### 2. Gestion du nouveau Service Worker

**Cas 1 : SW en attente au chargement**
```javascript
if (registration.waiting) {
  handleServiceWorkerUpdate(registration);
}
```

**Cas 2 : SW détecté pendant l'exécution**
```javascript
registration.addEventListener('updatefound', () => {
  const newWorker = registration.installing;
  newWorker.addEventListener('statechange', () => {
    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
      handleServiceWorkerUpdate(registration);
    }
  });
});
```

### 3. Activation et rechargement

```javascript
function activateNewVersion() {
  // 1. Envoyer SKIP_WAITING au nouveau SW
  waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  
  // 2. Écouter le changement de contrôleur
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // 3. Recharger la page
    window.location.reload();
  }, { once: true });
}
```

---

## 🧪 Tests

### Test 1 : Simulation d'une mise à jour

**Étape 1 : Préparer l'environnement**
```bash
# Build de production
npm run build

# Servir localement
npx serve dist -p 3000
```

**Étape 2 : Charger l'application**
1. Ouvrir http://localhost:3000
2. Ouvrir DevTools → Application → Service Workers
3. Vérifier qu'un SW est actif

**Étape 3 : Modifier le code**
```bash
# Faire un petit changement dans le code
echo "// Update test" >> src/main.tsx

# Rebuild
npm run build
```

**Étape 4 : Observer la mise à jour**
1. Attendre max 60 secondes (ou recharger l'onglet)
2. Observer dans la console :
   ```
   🔍 Vérification des mises à jour du Service Worker...
   📦 Installation d'un nouveau Service Worker détectée...
   🆕 Nouveau Service Worker détecté !
   ```
3. Si notification activée : popup apparaît
4. Après clic ou 10s : rechargement automatique
5. Observer dans DevTools : nouveau SW est actif

### Test 2 : Vérification manuelle

Dans la console du navigateur :
```javascript
// Vérifier manuellement les mises à jour
window.checkForSWUpdate();
```

### Test 3 : Mode hors ligne

1. Mettre le navigateur en mode hors ligne (DevTools → Network → Offline)
2. Recharger la page → devrait fonctionner (grâce au SW)
3. Repasser en ligne
4. Déclencher une mise à jour
5. Vérifier que la notification apparaît et que le rechargement fonctionne

### Test 4 : Cas limites

**Test A : Onglet en arrière-plan**
1. Ouvrir l'application dans un onglet
2. Déployer une nouvelle version
3. Passer sur un autre onglet pendant > 1 minute
4. Revenir sur l'onglet de l'application
5. ✅ Devrait détecter la mise à jour et afficher la notification

**Test B : Multiples onglets**
1. Ouvrir l'application dans 2 onglets
2. Déployer une nouvelle version
3. Le premier onglet détecte la mise à jour
4. Cliquer sur "Mettre à jour"
5. ✅ Le premier onglet se recharge
6. ✅ Le deuxième onglet devrait aussi se mettre à jour

---

## 🔍 Dépannage

### Problème 1 : Les mises à jour ne sont pas détectées

**Vérifications :**
1. Vérifier que `sw-lifecycle.js` est chargé :
   ```javascript
   // Dans la console
   console.log(window.checkForSWUpdate);
   // Devrait afficher: function checkForSWUpdate()
   ```

2. Vérifier les logs dans la console :
   ```
   🚀 Initialisation du Service Worker...
   ✅ Service Worker enregistré avec succès
   ⏰ Vérification périodique configurée (intervalle: 60s)
   ```

3. Vérifier dans DevTools → Application → Service Workers :
   - Status du SW actuel
   - Présence d'un SW "waiting"

**Solution :**
- Si pas de logs : vérifier que le script est bien chargé dans index.html
- Si SW en "waiting" : forcer manuellement avec `window.checkForSWUpdate()`

### Problème 2 : La page ne se recharge pas

**Vérifications :**
1. Vérifier que le message SKIP_WAITING est bien reçu :
   ```javascript
   // Dans sw.js (ligne 1)
   self.addEventListener("message", e => {
     if (e.data && e.data.type === "SKIP_WAITING") {
       console.log("Message SKIP_WAITING reçu");
       self.skipWaiting();
     }
   });
   ```

2. Vérifier l'événement controllerchange :
   ```javascript
   navigator.serviceWorker.addEventListener('controllerchange', () => {
     console.log('✅ Contrôleur changé, rechargement...');
   });
   ```

**Solution :**
- Ajouter des logs dans sw-lifecycle.js pour débugger
- Vérifier que le navigateur supporte les Service Workers

### Problème 3 : Notification n'apparaît pas

**Causes possibles :**
1. CSS bloqué par Content Security Policy
2. Z-index insuffisant
3. Script chargé trop tard

**Solution :**
1. Vérifier la console pour des erreurs CSP
2. Inspecter l'élément avec DevTools
3. Augmenter le z-index si nécessaire :
   ```javascript
   notification.style.cssText = `
     ...
     z-index: 999999;
   `;
   ```

### Problème 4 : Rechargements en boucle

**Cause :** Le SW se met à jour en continu

**Solution :**
1. Vérifier que `updateViaCache: 'none'` est bien configuré
2. Vérifier les headers de cache du serveur pour sw.js
3. Augmenter l'intervalle de vérification :
   ```javascript
   UPDATE_CHECK_INTERVAL: 300000, // 5 minutes au lieu de 1
   ```

---

## 🚀 Options avancées

### Option 1 : Notification personnalisée

Vous pouvez complètement personnaliser le style de la notification :

```javascript
// Dans sw-lifecycle.js, modifier la fonction showUpdateNotification
notification.style.cssText = `
  /* Votre style personnalisé */
  background: #your-brand-color;
  border: 2px solid #your-accent;
  /* etc. */
`;
```

### Option 2 : Intégration avec votre système de toast

Si vous avez déjà un système de notifications (ex: react-hot-toast, sonner, etc.) :

```javascript
// Remplacer showUpdateNotification par :
function showUpdateNotification(onUpdate) {
  // Exemple avec votre système existant
  yourToastSystem.show({
    title: 'Mise à jour disponible',
    action: {
      label: 'Mettre à jour',
      onClick: onUpdate
    }
  });
}
```

### Option 3 : Analytics

Suivre les mises à jour dans vos analytics :

```javascript
// Dans handleServiceWorkerUpdate, ajouter :
function handleServiceWorkerUpdate(registration) {
  // Votre code analytics
  if (window.gtag) {
    gtag('event', 'sw_update_detected', {
      event_category: 'PWA',
      event_label: 'Service Worker Update'
    });
  }
  
  // ... reste du code
}
```

### Option 4 : Mode debug

Activer des logs plus détaillés :

```javascript
// En haut de sw-lifecycle.js
const DEBUG_MODE = true;

function log(...args) {
  if (DEBUG_MODE) {
    console.log('[SW-Lifecycle]', ...args);
  }
}

// Utiliser log() au lieu de console.log() partout
```

### Option 5 : Stratégie de mise à jour par environnement

```javascript
// Configuration différente selon l'environnement
const CONFIG = {
  UPDATE_CHECK_INTERVAL: 
    window.location.hostname === 'localhost' 
      ? 10000  // 10s en dev
      : 60000, // 1min en prod
  
  SHOW_UPDATE_NOTIFICATION:
    window.location.hostname === 'localhost'
      ? false  // Silencieux en dev
      : true,  // Avec notification en prod
};
```

---

## 📊 Monitoring en production

### Logs à surveiller

**Logs normaux (tout va bien) :**
```
🚀 Initialisation du Service Worker...
✅ Service Worker enregistré avec succès
⏰ Vérification périodique configurée (intervalle: 60s)
🔍 Vérification des mises à jour du Service Worker...
✓ Vérification terminée
```

**Logs de mise à jour :**
```
📦 Installation d'un nouveau Service Worker détectée...
📊 État du Service Worker: installing
📊 État du Service Worker: installed
🔄 Nouveau Service Worker installé, en attente d'activation
🆕 Nouveau Service Worker détecté !
📨 Envoi du message SKIP_WAITING au Service Worker...
✅ Nouveau Service Worker activé !
🔄 Rechargement de la page pour appliquer la mise à jour...
```

**Logs d'erreur :**
```
❌ Erreur lors de l'enregistrement du Service Worker: [error]
❌ Erreur lors de la vérification des mises à jour: [error]
```

### Métriques à suivre

1. **Taux de mise à jour réussies** : % d'utilisateurs qui voient la nouvelle version dans les 5 minutes
2. **Temps moyen de détection** : Temps entre le déploiement et la détection par l'utilisateur
3. **Taux d'abandon** : % d'utilisateurs qui cliquent sur "Plus tard"
4. **Erreurs SW** : Nombre d'erreurs d'enregistrement ou de mise à jour

---

## ✅ Checklist de déploiement

Avant de déployer en production :

- [ ] Tests locaux réussis (simulation de mise à jour)
- [ ] Vérification que les logs apparaissent correctement
- [ ] Test du mode notification activé
- [ ] Test du mode notification désactivé
- [ ] Test avec multiples onglets ouverts
- [ ] Test du retour sur onglet après absence
- [ ] Vérification que sw.js n'est PAS mis en cache
- [ ] Configuration de l'intervalle de vérification appropriée
- [ ] Textes de notification personnalisés
- [ ] Analytics configurés (optionnel)
- [ ] Documentation de l'équipe mise à jour

---

## 📚 Ressources supplémentaires

- [Service Worker Lifecycle (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers#the_service_worker_lifecycle)
- [Workbox Update Strategies](https://developer.chrome.com/docs/workbox/handling-service-worker-updates/)
- [PWA Best Practices (web.dev)](https://web.dev/learn/pwa/)

---

## 🤝 Support

En cas de problème :
1. Consulter la section [Dépannage](#dépannage)
2. Activer le mode debug
3. Vérifier les logs de la console
4. Inspecter dans DevTools → Application → Service Workers

---

**Version:** 1.0.0  
**Dernière mise à jour:** 2 décembre 2025  
**Auteur:** Solution PWA Update Management

