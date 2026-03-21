# 📋 Scripts SQL Portfolio - À Exécuter

**Date : 2025-10-15**

---

## 🎯 Scripts à Exécuter dans Supabase SQL Editor

### 1. **Fonction RPC increment** ⚠️ IMPORTANT
**Fichier :** `fix-increment-function-corrected.sql`

**Pourquoi :** Corriger l'erreur `404 Not Found` sur `/rpc/increment`

**À exécuter :**
```sql
CREATE OR REPLACE FUNCTION increment(row_id uuid, table_name text, column_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF table_name = 'portfolio_projects' AND column_name = 'view_count' THEN
    UPDATE portfolio_projects 
    SET view_count = COALESCE(view_count, 0) + 1
    WHERE id = row_id;
  END IF;
END;
$$;
```

---

### 2. **Fonction RPC get_per_card_view_counts** ⚠️ IMPORTANT
**Fichier :** `fix-get-per-card-view-counts.sql`

**Pourquoi :** Corriger l'erreur "Erreur de vérification du rôle admin" dans DashboardLayout

**À exécuter :**
```sql
CREATE OR REPLACE FUNCTION get_per_card_view_counts(card_ids uuid[])
RETURNS TABLE(card_id uuid, view_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cv.card_id,
    COALESCE(SUM(cv.count), 0) as view_count
  FROM card_views cv
  WHERE cv.card_id = ANY(card_ids)
  GROUP BY cv.card_id;
END;
$$;
```

---

### 3. **Lier les Settings aux Cartes** (Optionnel)
**Fichier :** `fix-portfolio-settings-links.sql`

**Pourquoi :** Associer automatiquement les settings portfolio existants aux cartes

**Quand l'exécuter :** Si vous avez des settings créés avant la mise à jour

---

### 4. **Lier les Projets aux Cartes** ⚠️ IMPORTANT
**Fichier :** `fix-portfolio-card-links.sql`

**Pourquoi :** Associer automatiquement les projets existants aux cartes

**À exécuter :** Si vous avez créé des projets AVANT la mise à jour (sans card_id)

**Ce que fait le script :**
```sql
-- Associe chaque projet à la première carte de son propriétaire
UPDATE portfolio_projects pp
SET card_id = (
  SELECT bc.id 
  FROM business_cards bc 
  WHERE bc.user_id = pp.user_id 
  ORDER BY bc.created_at ASC 
  LIMIT 1
)
WHERE pp.card_id IS NULL;
```

---

### 5. **Test du Flux Complet** (Diagnostic)
**Fichier :** `test-portfolio-flow.sql`

**Pourquoi :** Vérifier que tout fonctionne correctement

**Remplacer :**
- `USER_ID` par votre ID utilisateur
- `CARD_ID` par l'ID de votre carte

**Ce que ça vérifie :**
- ✅ Vos cartes
- ✅ Vos settings portfolio
- ✅ Vos projets liés
- ✅ Les images des projets
- ✅ Le nombre de projets publiés
- ✅ Diagnostic du bouton "Mon Univers"

---

### 6. **Vérifier les Images** (Diagnostic)
**Fichier :** `check-images-urls.sql`

**Pourquoi :** Vérifier que les URLs des images sont correctement stockées

---

### 7. **Configuration Bucket Media** (Optionnel)
**Fichier :** `fix-media-bucket.sql`

**Pourquoi :** S'assurer que le bucket `media` est public avec les bonnes politiques

**Quand l'exécuter :** Si les images ne s'affichent pas

---

## ✅ Scripts Déjà Exécutés (Normalement)

Ces scripts ont probablement déjà été exécutés lors de la création du module :

- ✅ `20251014_create_portfolio_services_tables.sql` - Création des tables
- ✅ Politiques RLS de base

---

## 🔍 Ordre d'Exécution Recommandé

### Pour une Installation Fraîche :
1. ✅ Migration principale (tables) - déjà fait
2. ⚠️ **`fix-increment-function-corrected.sql`** - OBLIGATOIRE
3. ⚠️ **`fix-get-per-card-view-counts.sql`** - OBLIGATOIRE (erreur DashboardLayout)
4. 🔄 `fix-portfolio-card-links.sql` - Si projets existants
5. 🔄 `fix-portfolio-settings-links.sql` - Si settings existants
6. 🔍 `test-portfolio-flow.sql` - Test et diagnostic

### Pour Résoudre des Problèmes :
- Images ne s'affichent pas → `fix-media-bucket.sql`
- Vérifier les données → `test-portfolio-flow.sql`
- Vérifier les images → `check-images-urls.sql`

---

## 🎯 Vérification Post-Exécution

Après avoir exécuté les scripts, vérifiez :

1. **Créer un nouveau projet** :
   - `/portfolio/projects` → "Nouveau Projet"
   - Sélectionner une carte ✅
   - Remplir le formulaire
   - Sauvegarder

2. **Vérifier sur la carte publique** :
   - `/card/:id` → Bouton "Mon Univers" visible ✅
   - Cliquer → `/card/:id/portfolio` → Projets affichés ✅

3. **Tester les vues** :
   - Cliquer sur un projet
   - Vérifier dans la console → Pas d'erreur 404 sur `/rpc/increment` ✅

---

## 📝 Notes

- Les scripts utilisent `ON CONFLICT` et `WHERE EXISTS` pour éviter les doublons
- Les scripts sont **idempotents** (peuvent être exécutés plusieurs fois sans problème)
- Tous les scripts incluent des requêtes de vérification après exécution

---

**Besoin d'aide ?** Consultez `FIX_PORTFOLIO_CARD_LINK.md` pour plus de détails.

