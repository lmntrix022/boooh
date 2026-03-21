# ⚡ Appliquer les Migrations SQL - MAINTENANT

**Temps requis :** 30 secondes  
**Impact :** Corrige toutes les erreurs CRM

---

## 🚀 Méthode 1 : Via Supabase CLI (Recommandé)

```bash
# 1. Aller dans le dossier
cd /Users/quantinekouaghe/Downloads/boooh-main/supabase

# 2. Appliquer toutes les migrations
supabase db push

# 3. Attendre confirmation
# ✅ "All migrations applied successfully"

# 4. Recharger la page CRM
# Ctrl+R ou Cmd+R
```

**Si erreur "supabase command not found" :**
```bash
# Installer Supabase CLI
npm install -g supabase

# Ou
brew install supabase/tap/supabase
```

---

## 🖥️ Méthode 2 : Via Dashboard Supabase (Alternative)

**Si vous n'avez pas Supabase CLI :**

### Étape 1 : Ouvrir Supabase Dashboard
1. Aller sur [https://supabase.com](https://supabase.com)
2. Se connecter
3. Sélectionner votre projet
4. Cliquer sur **"SQL Editor"** dans le menu gauche

---

### Étape 2 : Appliquer Migration 1 (contact_interactions)

**Copier ce SQL :**

```sql
-- Migration: Contact Interactions Table
CREATE TABLE IF NOT EXISTS public.contact_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.scanned_contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('note', 'email', 'call', 'meeting', 'whatsapp', 'sms')),
  subject TEXT,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contact_interactions_contact_id ON public.contact_interactions(contact_id);
CREATE INDEX idx_contact_interactions_user_id ON public.contact_interactions(user_id);
CREATE INDEX idx_contact_interactions_type ON public.contact_interactions(type);
CREATE INDEX idx_contact_interactions_created_at ON public.contact_interactions(created_at DESC);

CREATE OR REPLACE FUNCTION update_contact_interactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contact_interactions_updated_at
  BEFORE UPDATE ON public.contact_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_interactions_updated_at();

ALTER TABLE public.contact_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contact interactions"
  ON public.contact_interactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contact interactions"
  ON public.contact_interactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact interactions"
  ON public.contact_interactions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact interactions"
  ON public.contact_interactions
  FOR DELETE
  USING (auth.uid() = user_id);
```

**Puis cliquer "Run" (en bas à droite)**

---

### Étape 3 : Appliquer Migration 2 (digital_purchases RLS FIX) ⚠️ CRITIQUE

**Copier ce SQL :**

```sql
-- Migration: Fix RLS sur digital_purchases pour CRM
-- Permettre aux vendeurs de voir les achats de leurs produits

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

COMMENT ON POLICY "Sellers can view purchases of their digital products" ON public.digital_purchases IS
'Permet aux vendeurs (propriétaires de cartes) de voir tous les achats de leurs produits digitaux pour le CRM';
```

**Puis cliquer "Run"**

---

### Étape 4 : Vérifier

**Dans SQL Editor, exécuter :**

```sql
-- Vérifier que les policies existent
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'digital_purchases';

-- Résultat attendu:
-- 1. "Buyers can view their purchases"
-- 2. "Sellers can view purchases of their digital products"  ← Nouvelle
```

---

### Étape 5 : Recharger l'App

1. Retourner sur votre app
2. Recharger la page (Ctrl+R ou Cmd+R)
3. Ouvrir Console (F12)

**Résultat attendu :**
- ✅ Plus d'erreur 403
- ✅ Plus d'erreur 404
- ✅ Achats digitaux s'affichent dans Relations
- ✅ Notes fonctionnent

---

## 🎯 Pourquoi Cette Erreur ?

### Erreur 403 : digital_purchases

**Policy originale (trop restrictive) :**
```sql
-- Seul l'acheteur peut voir ses achats
buyer_email = auth.jwt() ->> 'email'
```

**Problème dans le CRM :**
```
Utilisateur connecté: jean@vendeur.com (vendeur)
Recherche: buyer_email = client@acheteur.com
RLS vérifie: client@acheteur.com == jean@vendeur.com
Résultat: FALSE → 403 Forbidden
```

**Solution (nouvelle policy) :**
```sql
-- Le vendeur peut voir les achats de SES produits
product_id IN (
  SELECT produits WHERE propriétaire = utilisateur_connecté
)
```

**Maintenant :**
```
Utilisateur connecté: jean@vendeur.com
Produit acheté: appartient à jean@vendeur.com
RLS vérifie: vendeur possède produit
Résultat: TRUE → 200 OK
```

---

## ✅ Après Migration

**Onglet Relations affichera :**

```
📦 Commandes Physiques (3)
💾 Commandes Digitales (2)      ✅
🛍️ Achats Digitaux Directs (1)  ✅ CORRIGÉ
📅 Rendez-vous (2)
💼 Devis (1)
🧾 Factures (4)
```

**Et dans Stats :**
```
Répartition du CA:
├── Produits physiques: 450K FCFA
├── Produits digitaux (commandes): 35K FCFA
├── Achats digitaux directs: 30K FCFA  ✅ CORRIGÉ
└── Total: 1.25M FCFA
```

---

*Guide créé le 18 Octobre 2025*  
**1 commande pour tout corriger**

