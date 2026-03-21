# 🔄 Guide de Migration : Système de Mise à Jour du Service Worker

Ce guide vous accompagne dans la migration de votre système existant vers notre solution de gestion des mises à jour du Service Worker.

---

## 📋 Scénarios de migration

### Scénario 1 : Vous n'avez aucun Service Worker

**Situation :** Première implémentation d'une PWA

**Migration :**
```bash
# Rien à faire, la solution est déjà intégrée !
# Vérifiez juste que tout fonctionne :
./scripts/test-sw-update.sh
```

✅ **Vous êtes prêt !**

---

### Scénario 2 : Vous avez un Service Worker basique (comme le registerSW.js initial)

**Situation :**
```javascript
// Votre code actuel
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

**Migration :**

1. **Supprimez** l'ancien code d'enregistrement

```html
<!-- index.html - AVANT -->
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
</script>
```

```html
<!-- index.html - APRÈS -->
<script src="/sw-lifecycle.js"></script>
```

2. **Testez** la migration

```bash
npm run build
npx serve dist -p 3000
# Ouvrir http://localhost:3000
# Vérifier les logs dans la console
```

3. **Déployez** en production

✅ **Migration terminée !**

**Temps estimé :** 5 minutes

---

### Scénario 3 : Vous avez déjà une gestion des mises à jour personnalisée

**Situation :**
```javascript
// Votre code actuel
navigator.serviceWorker.register('/sw.js').then(reg => {
  reg.addEventListener('updatefound', () => {
    const newWorker = reg.installing;
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed') {
        // Votre logique personnalisée
        if (confirm('Mise à jour disponible. Recharger ?')) {
          newWorker.postMessage({ type: 'SKIP_WAITING' });
        }
      }
    });
  });
});
```

**Migration :**

**Option A : Remplacer complètement** (recommandé)

```html
<!-- Remplacer tout votre code par : -->
<script src="/sw-lifecycle.js"></script>
```

**Option B : Intégrer progressivement**

Si vous avez des fonctionnalités spécifiques (analytics, logique métier), vous pouvez :

1. **Garder votre structure** mais utiliser nos fonctions :

```javascript
// Copier les fonctions de sw-lifecycle.js
import { skipWaiting, handleServiceWorkerUpdate } from './sw-lifecycle.js';

// Votre code personnalisé
navigator.serviceWorker.register('/sw.js').then(reg => {
  reg.addEventListener('updatefound', () => {
    // Votre analytics
    trackEvent('sw_update_detected');
    
    // Utiliser notre gestion
    handleServiceWorkerUpdate(reg);
  });
});
```

2. **Tester** les deux systèmes en parallèle

3. **Migrer progressivement** vers notre solution

**Temps estimé :** 15-30 minutes

---

### Scénario 4 : Vous utilisez Workbox directement

**Situation :**
```javascript
// Votre code actuel
import { Workbox } from 'workbox-window';

const wb = new Workbox('/sw.js');

wb.addEventListener('waiting', (event) => {
  // Votre logique
});

wb.register();
```

**Migration :**

**Option A : Remplacer par notre solution** (plus simple)

```html
<script src="/sw-lifecycle.js"></script>
```

**Option B : Garder Workbox + intégrer notre logique**

```javascript
import { Workbox } from 'workbox-window';

const wb = new Workbox('/sw.js');

// Notre logique de mise à jour
wb.addEventListener('waiting', (event) => {
  // Afficher notification
  showUpdateNotification(() => {
    // Activer le nouveau SW
    wb.messageSkipWaiting();
  });
});

// Recharger après activation
wb.addEventListener('controlling', (event) => {
  window.location.reload();
});

wb.register();
```

**Temps estimé :** 20 minutes

---

### Scénario 5 : Vous utilisez vite-plugin-pwa avec injectRegister

**Situation :**
```typescript
// vite.config.ts
VitePWA({
  registerType: 'autoUpdate',
  injectRegister: 'auto', // ou 'script'
})
```

**Migration :**

1. **Modifier** vite.config.ts

```typescript
// AVANT
VitePWA({
  registerType: 'autoUpdate',
  injectRegister: 'script', // ← Génère registerSW.js basique
})

// APRÈS
VitePWA({
  registerType: 'autoUpdate',
  injectRegister: null, // ← Désactivé, on utilise notre solution
})
```

2. **Ajouter** le script dans index.html

```html
<script src="/sw-lifecycle.js"></script>
```

3. **Rebuild et tester**

```bash
npm run build
./scripts/test-sw-update.sh
```

✅ **Migration terminée !**

**Temps estimé :** 5 minutes

---

### Scénario 6 : Vous avez un système de notification personnalisé

**Situation :** Vous voulez garder votre système de toast/notification existant

**Migration :**

**Option A : Utiliser votre système de notification**

Modifiez `sw-lifecycle.js` :

```javascript
// Dans sw-lifecycle.js, remplacer la fonction showUpdateNotification

function showUpdateNotification(onUpdate) {
  // Utiliser votre système existant
  yourToastSystem.show({
    title: CONFIG.MESSAGES.updateAvailable,
    description: 'Cliquez pour mettre à jour',
    action: {
      label: CONFIG.MESSAGES.updateButton,
      onClick: onUpdate
    },
    dismissAction: {
      label: CONFIG.MESSAGES.updateLater,
      onClick: () => yourToastSystem.dismiss()
    }
  });
}
```

**Option B : Utiliser les deux** (notre notification par défaut + vos hooks)

```javascript
// Dans sw-lifecycle.js, après showUpdateNotification

function handleServiceWorkerUpdate(registration) {
  const waitingWorker = registration.waiting;
  
  // Votre analytics/logging
  if (window.yourAnalytics) {
    window.yourAnalytics.track('sw_update_detected');
  }
  
  // Notre notification
  if (CONFIG.SHOW_UPDATE_NOTIFICATION) {
    showUpdateNotification(() => {
      // Votre hook
      if (window.yourAnalytics) {
        window.yourAnalytics.track('sw_update_accepted');
      }
      
      // Activation
      skipWaiting(waitingWorker);
      // ...
    });
  }
}
```

**Temps estimé :** 15 minutes

---

## 🧪 Checklist de migration

Quel que soit votre scénario, suivez cette checklist :

### Avant la migration

- [ ] Sauvegardez votre code actuel
- [ ] Documentez votre logique personnalisée (si applicable)
- [ ] Identifiez votre scénario dans la liste ci-dessus
- [ ] Lisez la documentation : `docs/pwa/SERVICE_WORKER_UPDATE_GUIDE.md`

### Pendant la migration

- [ ] Désactivez l'ancien système d'enregistrement
- [ ] Ajoutez `<script src="/sw-lifecycle.js"></script>` dans index.html
- [ ] Modifiez `vite.config.ts` : `injectRegister: null`
- [ ] Configurez `sw-lifecycle.js` selon vos besoins
- [ ] Testez localement avec `./scripts/test-sw-update.sh`

### Après la migration

- [ ] Vérifiez les logs dans la console
- [ ] Testez le rechargement avec notification
- [ ] Testez avec plusieurs onglets ouverts
- [ ] Vérifiez dans DevTools > Application > Service Workers
- [ ] Déployez sur un environnement de staging
- [ ] Testez en staging pendant 24h
- [ ] Déployez en production

### En production

- [ ] Surveillez les logs utilisateurs
- [ ] Vérifiez que les mises à jour sont détectées
- [ ] Suivez les métriques (taux de mise à jour, délai)
- [ ] Recueillez les retours utilisateurs

---

## 🔄 Rollback (Retour en arrière)

Si vous devez revenir à l'ancien système :

1. **Restaurez** votre ancien code

```bash
git checkout HEAD~1 index.html vite.config.ts
```

2. **Supprimez** sw-lifecycle.js

```bash
rm public/sw-lifecycle.js
```

3. **Rebuild et redéployez**

```bash
npm run build
# Déployer
```

**Note :** Les utilisateurs garderont l'ancienne version du SW jusqu'à ce qu'ils vident le cache ou ferment tous les onglets.

---

## ⚠️ Problèmes courants lors de la migration

### Problème 1 : Conflit entre deux systèmes

**Symptôme :** Deux Service Workers s'enregistrent ou rechargements multiples

**Cause :** L'ancien et le nouveau système coexistent

**Solution :**
```javascript
// Vérifier qu'il n'y a qu'un seul enregistrement
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Registrations actives:', registrations.length);
  // Devrait afficher: 1
});
```

Si > 1 :
```javascript
// Désinstaller tous les SW
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(r => r.unregister());
});
// Puis recharger la page
```

### Problème 2 : Le nouveau système ne démarre pas

**Symptôme :** Pas de logs dans la console

**Vérifications :**
1. Le script est-il chargé ?
   ```html
   <!-- Vérifier dans index.html -->
   <script src="/sw-lifecycle.js"></script>
   ```

2. Le fichier existe-t-il ?
   ```bash
   ls -la dist/sw-lifecycle.js
   ```

3. Y a-t-il des erreurs JS ?
   ```javascript
   // Console
   window.checkForSWUpdate
   // Devrait retourner: function
   ```

### Problème 3 : Les mises à jour ne sont pas détectées

**Symptôme :** Après déploiement, aucune mise à jour détectée

**Vérifications :**
1. Le SW a-t-il vraiment changé ?
   ```bash
   # Comparer les hashes
   md5 dist/sw.js
   ```

2. Le cache HTTP est-il désactivé ?
   ```javascript
   // Vérifier dans sw-lifecycle.js
   navigator.serviceWorker.register('/sw.js', {
     updateViaCache: 'none' // ← Important !
   });
   ```

3. Le serveur envoie-t-il les bons headers ?
   ```bash
   curl -I https://your-site.com/sw.js
   # Ne devrait PAS avoir de Cache-Control long
   ```

---

## 📊 Comparaison des approches

| Approche | Complexité | Flexibilité | Maintenance | Recommandé pour |
|----------|------------|-------------|-------------|-----------------|
| **Notre solution (sw-lifecycle.js)** | ⭐ Faible | ⭐⭐⭐⭐ Haute | ⭐⭐⭐⭐⭐ Très simple | 👍 La plupart des cas |
| **Workbox Window** | ⭐⭐⭐ Moyenne | ⭐⭐⭐⭐⭐ Très haute | ⭐⭐⭐ Moyenne | Apps complexes avec besoins spécifiques |
| **Code custom** | ⭐⭐⭐⭐ Haute | ⭐⭐⭐⭐⭐ Totale | ⭐ Difficile | Cas très spécifiques |
| **registerSW.js basique** | ⭐ Faible | ⭐ Très faible | ⭐⭐⭐ Facile | ❌ Ne résout pas le problème |

---

## 💡 Conseils de migration

1. **Testez d'abord en local**
   ```bash
   npm run build
   npx serve dist -p 3000
   # Tester les mises à jour
   ```

2. **Déployez sur staging d'abord**
   - Ne jamais déployer directement en production
   - Testez pendant au moins 24h

3. **Communiquez avec vos utilisateurs**
   ```javascript
   // Personnalisez le message
   const CONFIG = {
     MESSAGES: {
       updateAvailable: '🎉 Nous avons amélioré l\'application !'
     }
   };
   ```

4. **Surveillez les métriques**
   - Nombre d'utilisateurs qui mettent à jour
   - Délai moyen de mise à jour
   - Taux d'abandon de la notification

5. **Gardez une porte de sortie**
   - Gardez l'ancien code en commentaire pendant 1 semaine
   - Documentez comment revenir en arrière
   - Testez le rollback avant de déployer

---

## 📚 Ressources supplémentaires

- [Documentation complète](./SERVICE_WORKER_UPDATE_GUIDE.md)
- [Diagrammes du cycle de vie](./SW_LIFECYCLE_DIAGRAM.md)
- [README rapide](../../PWA_UPDATE_README.md)
- [Script de test](../../scripts/test-sw-update.sh)
- [Configurations exemple](../../public/sw-lifecycle.config.example.js)

---

## 🤝 Support

Si vous rencontrez des problèmes lors de la migration :

1. Consultez la [section Dépannage](./SERVICE_WORKER_UPDATE_GUIDE.md#dépannage)
2. Activez le mode debug dans `sw-lifecycle.js`
3. Vérifiez les logs de la console navigateur
4. Inspectez DevTools > Application > Service Workers

---

**Bonne migration ! 🚀**

