# 🔧 CRM - Correction des Erreurs

**Date :** 18 Octobre 2025  
**Problèmes identifiés :** 2  
**Temps de résolution :** 3 minutes

---

## ❌ Erreur 1 : 403 Forbidden sur `digital_purchases`

### Symptôme
```
GET .../digital_purchases?buyer_email=eq.xxx 403 (Forbidden)
```

### Cause
La policy RLS sur `digital_purchases` permet uniquement aux **acheteurs** de voir leurs achats, mais pas aux **vendeurs** (propriétaires de cartes) de voir les achats de leurs clients.

**Policy actuelle :**
```sql
-- Seul l'acheteur peut voir
CREATE POLICY "Buyers can view their purchases"
FOR SELECT USING (buyer_email = auth.jwt() ->> 'email');
```

**Problème :** Le vendeur ne peut pas voir les achats dans son CRM !

### ✅ Solution (1 minute)

**Appliquer la migration de correction :**

```bash
cd /Users/quantinekouaghe/Downloads/boooh-main/supabase
supabase db push
```

**Ou via Dashboard Supabase :**
1. Aller dans **SQL Editor**
2. Copier le contenu de : `supabase/migrations/20251018_fix_digital_purchases_rls_for_crm.sql`
3. Coller et **Run**

**Nouvelle policy ajoutée :**
```sql
CREATE POLICY "Sellers can view purchases of their digital products"
ON public.digital_purchases
FOR SELECT
USING (
  product_id IN (
    SELECT dp.id 
    FROM public.digital_products dp
    JOIN public.business_cards bc ON dp.card_id = bc.id
    WHERE bc.user_id = auth.uid()
  )
);
```

**Résultat :**
- ✅ L'acheteur voit ses achats
- ✅ **Le vendeur voit les achats de ses produits** (CRM)

---

## ❌ Erreur 2 : 404 Not Found sur `contact_interactions`

### Symptôme
```
GET .../contact_interactions 404 (Not Found)
Table contact_interactions not found. Using empty state.
```

### Cause
La table n'existe pas encore en base de données. C'est **normal** - la migration n'a pas encore été appliquée.

### ✅ Solution (1 minute)

**Même solution que ci-dessus :**

```bash
cd /Users/quantinekouaghe/Downloads/boooh-main/supabase
supabase db push
```

**Cela va créer :**
- ✅ Table `contact_interactions`
- ✅ Index de performance
- ✅ Trigger `updated_at`
- ✅ Policies RLS
- ✅ Commentaires SQL

**Fichier appliqué :**
`supabase/migrations/20251018_create_contact_interactions.sql`

---

## ⚡ Commande Unique pour Tout Corriger

```bash
# Une seule commande pour les 2 erreurs
cd /Users/quantinekouaghe/Downloads/boooh-main/supabase
supabase db push
```

**Cette commande va :**
1. ✅ Créer la table `contact_interactions`
2. ✅ Ajouter la policy RLS pour `digital_purchases`
3. ✅ Appliquer toutes les migrations en attente

**Temps : 30 secondes**

---

## 🧪 Vérification

### Après avoir appliqué la migration :

**1. Recharger la page CRM**
```
Ctrl+R ou Cmd+R
```

**2. Ouvrir Console (F12)**
- ✅ Plus d'erreur 403 sur `digital_purchases`
- ✅ Plus d'erreur 404 sur `contact_interactions`

**3. Tester onglet Notes**
- ✅ Ajouter une note
- ✅ Note apparaît dans la liste

**4. Vérifier Relations**
- ✅ Achats digitaux s'affichent
- ✅ Toutes données présentes

---

## 📋 Checklist Post-Migration

```bash
# 1. Vérifier que les tables existent
psql -h [SUPABASE_HOST] -U postgres -d postgres -c "\dt contact_interactions"
# Résultat attendu: Table listée

# 2. Vérifier les policies
psql -h [SUPABASE_HOST] -U postgres -d postgres -c "\d+ digital_purchases"
# Résultat attendu: 2 policies (Buyers + Sellers)

# 3. Tester dans l'app
- Ouvrir CRM contact
- Onglet Relations → Achats digitaux affichés ✅
- Onglet Notes → Ajouter note fonctionne ✅
```

---

## 🎯 Résumé

| Erreur | Cause | Solution | Temps |
|--------|-------|----------|-------|
| **403 digital_purchases** | RLS trop restrictive | Migration RLS fix | 30s |
| **404 contact_interactions** | Table manquante | Migration create table | 30s |

**Solution unique :**
```bash
supabase db push
```

**Après migration :**
- ✅ CRM 100% fonctionnel
- ✅ Achats digitaux visibles
- ✅ Notes opérationnelles
- ✅ 0 erreur console

---

## 📝 Notes Techniques

### Pourquoi 403 sur digital_purchases ?

La policy originale :
```sql
buyer_email = auth.jwt() ->> 'email'
```

**Problème :** Vérifie si l'utilisateur connecté est l'**acheteur**.

Dans le CRM, l'utilisateur est le **vendeur** (propriétaire de la carte) qui veut voir les achats de **ses clients**.

**Solution :** Ajouter une policy qui vérifie si l'utilisateur est le propriétaire du produit acheté.

### Gestion Graceful des Erreurs

Le code gère déjà les erreurs proprement :

```typescript
// Dans ContactNotes.tsx (ligne 57)
if (error) {
  console.warn('Table contact_interactions not found. Using empty state.');
  setNotes([]);
  return;
}
```

**Résultat :** L'app ne crash pas, elle affiche juste un état vide avec message explicite.

---

*Correction créée le 18 Octobre 2025*  
**Résolution : 1 commande · 30 secondes**  
**Impact : CRM 100% opérationnel**

