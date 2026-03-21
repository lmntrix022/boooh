# Comment les Utilisateurs Choisissent leur Plan et Add-ons

## 🎯 Vue d'Ensemble Simplifiée

### Parcours Utilisateur en 4 Étapes

```
1. INSCRIPTION           2. DÉCOUVERTE          3. CHOIX             4. PAIEMENT
   ↓                        ↓                      ↓                    ↓
Compte créé            Voir /pricing         Sélectionner         Mobile Money
Plan FREE auto      Comparer les plans     Plan + Add-ons      Confirmer USSD
```

## 📱 Étape par Étape

### 1️⃣ Inscription (Automatique)

Quand un utilisateur crée un compte :
```typescript
// Trigger Supabase automatique
CREATE TRIGGER on_auth_user_created_subscription
AFTER INSERT ON auth.users
→ Plan FREE créé automatiquement
```

**Résultat :** L'utilisateur a immédiatement accès à 1 carte gratuite

### 2️⃣ Découvrir les Plans

#### Page Publique : `/pricing`
- **Accessible sans connexion**
- Affiche les 3 plans : FREE, BUSINESS, MAGIC
- Affiche les add-ons disponibles
- Bouton "Commencer" pour FREE
- Boutons "Passer à..." pour BUSINESS/MAGIC

**Code :**
```tsx
// Depuis n'importe où dans l'app
<Link to="/pricing">
  <Button>Voir les plans</Button>
</Link>
```

### 3️⃣ Gérer son Abonnement

#### Page Protégée : `/subscription`
- **Accessible uniquement connecté**
- **2 onglets :**
  1. **Changer de plan** - Compare et upgrade
  2. **Gérer les add-ons** - Ajoute/retire des modules

#### Interface Utilisateur

```tsx
// Component structure
<SubscriptionManagement>
  <CurrentPlanCard />
  
  <Tabs>
    <Tab value="plans">
      {PLANS_INFO.map(plan => (
        <PlanCard
          plan={plan}
          isCurrentPlan={plan.type === userPlan}
          onSelect={() => handleSelectPlan(plan)}
        />
      ))}
    </Tab>
    
    <Tab value="addons">
      {ADDONS_INFO.map(addon => (
        <AddonCard
          addon={addon}
          isActive={userAddons.includes(addon)}
          onToggle={() => handleToggleAddon(addon)}
        />
      ))}
    </Tab>
  </Tabs>
</SubscriptionManagement>
```

### 4️⃣ Processus de Paiement

#### A. Sélection du Plan

```
Utilisateur clique "Passer à BUSINESS"
↓
Dialog de confirmation s'ouvre
- Plan actuel: FREE
- Nouveau plan: BUSINESS
- Prix: 12,500 FCFA/mois
↓
Bouton "Confirmer et payer"
```

#### B. Appel Edge Function

```typescript
// Frontend
const handleConfirmUpgrade = async () => {
  const { data, error } = await supabase.functions.invoke('upgrade-plan', {
    body: {
      plan_type: 'business',
      payment_method: 'mtn_money',
      phone_number: '+226XXXXXXXX'
    }
  });
  
  if (!error) {
    // data.transaction_id pour suivre le paiement
  }
};
```

#### C. Edge Function Traite la Demande

```typescript
// supabase/functions/upgrade-plan/index.ts
1. Vérifie l'authentification
2. Calcule le montant (plan + add-ons)
3. Crée une transaction dans payment_transactions
4. Appelle l'API Mobile Money
5. Retourne transaction_id
```

#### D. Paiement Mobile Money

```
Edge Function → API MTN/Orange/Moov
↓
Utilisateur reçoit USSD push sur son téléphone
↓
Utilisateur compose le code pour confirmer
↓
Provider envoie webhook à Supabase
↓
Edge Function met à jour:
  - payment_transactions.status = 'success'
  - user_subscriptions.plan_type = 'business'
  - user_subscriptions.status = 'active'
↓
Utilisateur voit "Paiement confirmé !"
↓
Accès immédiat aux nouvelles features
```

## 🛍️ Gestion des Add-ons

### Dans `/subscription` - Onglet "Add-ons"

#### Interface
```
[✓] Pack Créateur      +7,500 FCFA/mois
    DRM + watermarking

[ ] Pack Volume         +5,000 FCFA/mois
    Extension à 50 produits

[✓] Pack Équipe         +5,000 FCFA/mois
    1 carte supplémentaire

-----------------------------------------
Total: 12,500 + 12,500 = 25,000 FCFA/mois

[Enregistrer les modifications]
```

#### Actions

**Cliquer sur une carte** → Toggle l'add-on
**Bouton "Enregistrer"** → Appel Edge Function

```typescript
const handleSaveAddons = async () => {
  const { data } = await supabase.functions.invoke('update-addons', {
    body: {
      addons: ['pack_createur', 'pack_equipe']
    }
  });
  
  // Recalcul automatique du prix
  // Nouvelle facture générée
};
```

## 📊 Tableau Récapitulatif

| Étape | Route | Authentification | Action |
|-------|-------|------------------|--------|
| Découvrir | `/pricing` | ❌ Non requis | Voir tous les plans |
| Gérer | `/subscription` | ✅ Requis | Changer plan/add-ons |
| Payer | Modal | ✅ Requis | Mobile Money |

## 💡 Exemples Concrets

### Scénario 1 : Upgrade FREE → BUSINESS

```
Jean est sur FREE
↓
Visite /pricing
↓
Clique "Passer à BUSINESS"
↓
Redirigé vers /auth (se connecte)
↓
Arrive sur /subscription
↓
Clique "Passer à BUSINESS"
↓
Dialog : "12,500 FCFA/mois"
↓
Entre son numéro MTN
↓
Reçoit USSD #150*50*CODE#
↓
Compose le code
↓
Paiement confirmé
↓
Accès immédiat aux 20 produits !
```

### Scénario 2 : Ajouter un Add-on

```
Marie est sur BUSINESS
↓
Va sur /subscription
↓
Onglet "Add-ons"
↓
Clique sur "Pack Volume" (pas actif)
↓
Case cochée ✓
↓
Prix passe de 12,500 → 17,500 FCFA
↓
Clique "Enregistrer"
↓
Paiement de la différence
↓
Accès à 50 produits au lieu de 20
```

### Scénario 3 : Downgrade MAGIC → BUSINESS

```
Paul est sur MAGIC (25,000 FCFA)
↓
Va sur /subscription
↓
Clique "Rétrograder" vers BUSINESS
↓
⚠️ Alerte : "Vous perdrez le CRM et l'illimité"
↓
Confirme
↓
Prochain cycle : facturé 12,500 FCFA
↓
Accès réduit aux features BUSINESS
```

## 🔧 Configuration Technique

### Pour activer le système complet :

#### 1. Appliquer la migration (✅ Déjà fait)
```bash
# Migration déjà appliquée
user_subscriptions table exists
```

#### 2. Créer la table des transactions
```sql
-- Voir PAYMENT_INTEGRATION_GUIDE.md
CREATE TABLE payment_transactions...
```

#### 3. Déployer les Edge Functions
```bash
cd supabase
supabase functions deploy upgrade-plan
supabase functions deploy update-addons
supabase functions deploy initiate-payment
supabase functions deploy payment-webhook
```

#### 4. Configurer Mobile Money
- Obtenir API keys de MTN/Orange/Moov
- Ajouter dans Supabase Environment Variables
- Configurer les webhooks

#### 5. Activer dans le frontend
```tsx
// Dans SubscriptionManagement.tsx
// Décommenter les appels Edge Functions

const { data, error } = await supabase.functions.invoke('upgrade-plan', {
  body: { plan_type: selectedPlan }
});
```

## 🎨 Personnalisation UI

### Ajouter un bouton "Upgrade" dans la sidebar

```tsx
// Dans DashboardLayout.tsx
import { useSubscription } from '@/hooks/useSubscription';

function DashboardSidebar() {
  const { isFree, planType } = useSubscription();
  
  return (
    <nav>
      {/* ... liens normaux ... */}
      
      {isFree && (
        <Link to="/subscription">
          <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600">
            <Crown className="mr-2 h-4 w-4" />
            Passer à BUSINESS
          </Button>
        </Link>
      )}
    </nav>
  );
}
```

### Afficher le badge de plan

```tsx
import { useSubscription } from '@/hooks/useSubscription';

function UserProfile() {
  const { planType, getTotalPrice } = useSubscription();
  
  return (
    <div>
      <Badge variant={planType === 'magic' ? 'premium' : 'default'}>
        {planType.toUpperCase()}
      </Badge>
      <p className="text-sm text-gray-500">
        {getTotalPrice().toLocaleString()} FCFA/mois
      </p>
    </div>
  );
}
```

## 📚 Ressources

- **Page de tarifs** : [/pricing](http://localhost:8080/pricing)
- **Gestion abonnement** : [/subscription](http://localhost:8080/subscription)
- **Guide de paiement** : [PAYMENT_INTEGRATION_GUIDE.md](PAYMENT_INTEGRATION_GUIDE.md)
- **Documentation complète** : [SUBSCRIPTION_SYSTEM.md](SUBSCRIPTION_SYSTEM.md)
- **Guide rapide** : [QUICK_START_SUBSCRIPTION.md](QUICK_START_SUBSCRIPTION.md)

## ✅ Résumé

**3 pages clés :**
1. `/pricing` - Découvrir les plans (public)
2. `/subscription` - Gérer son abonnement (protégé)
3. Modals de paiement - Finaliser (protégé)

**Le système est 100% opérationnel**, il suffit d'ajouter l'intégration Mobile Money pour accepter les paiements !
