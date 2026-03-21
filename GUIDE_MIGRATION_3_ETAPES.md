# 🚀 Migration en 3 Étapes - SOLUTION FINALE

## ❌ Problème Résolu

L'erreur `unsafe use of new value "free" of enum type` est due à une **limitation de PostgreSQL** : on ne peut pas utiliser une valeur d'enum dans la même transaction où elle a été ajoutée.

**Solution :** Séparer la migration en 3 fichiers exécutés séparément.

---

## 📋 Les 3 Fichiers de Migration

| Fichier | Description | Ordre |
|---------|-------------|-------|
| `20260123_step1_create_enum.sql` | Créer l'enum (si n'existe pas) | 1️⃣ |
| `20260123_step2_add_values_to_enum.sql` | Ajouter toutes les valeurs | 2️⃣ |
| `20260123_step3_create_tables.sql` | Créer tables et insérer données | 3️⃣ |

---

## 🎯 Méthode d'Application

### Via Dashboard Supabase (RECOMMANDÉ)

#### ÉTAPE 1 : Créer/Vérifier l'Enum

1. Ouvrez https://supabase.com/dashboard
2. **SQL Editor**
3. Copiez tout le contenu de **`20260123_step1_create_enum.sql`**
4. Collez et **Run** 
5. Vérifiez le message : `✅ ÉTAPE 1 terminée`

---

#### ÉTAPE 2 : Ajouter les Valeurs

1. **Nouveau** tab SQL Editor (ou effacez le contenu)
2. Copiez tout le contenu de **`20260123_step2_add_values_to_enum.sql`**
3. Collez et **Run**
4. Vérifiez : `✅ ÉTAPE 2 terminée avec succès`
5. Doit afficher **7 valeurs** (free, business, magic, essentiel, connexions, commerce, opere)

---

#### ÉTAPE 3 : Créer les Tables

1. **Nouveau** tab SQL Editor
2. Copiez tout le contenu de **`20260123_step3_create_tables.sql`**
3. Collez et **Run**
4. Vérifiez : `✅✅✅ MIGRATION COMPLÈTE RÉUSSIE ✅✅✅`

---

## ✅ Vérification Finale

Après les 3 étapes, exécutez :

```sql
-- 1. Vérifier l'enum (doit retourner 7 lignes)
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = 'subscription_plan'::regtype
ORDER BY enumsortorder;

-- 2. Vérifier les commissions (doit retourner 7 lignes)
SELECT plan_type, monthly_fee_fcfa, commission_percentage 
FROM commission_tiers
ORDER BY is_legacy DESC, monthly_fee_fcfa;

-- 3. Vérifier les packages (doit retourner 4 lignes)
SELECT package_id, name, price_fcfa 
FROM opere_setup_packages
ORDER BY price_fcfa;

-- 4. Vérifier les tables (doit retourner 5 lignes)
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'commission_tiers',
    'opere_setup_packages',
    'opere_setup_payments',
    'plan_revenue_tracking',
    'subscription_migrations'
)
ORDER BY table_name;
```

**Résultats attendus :**
- ✅ 7 valeurs d'enum
- ✅ 7 configurations de commissions (3 legacy + 4 nouveaux)
- ✅ 4 packages Opéré (Standard, Business, Premium, Enterprise)
- ✅ 5 nouvelles tables

---

## 🤔 Pourquoi 3 Fichiers ?

### Limitation PostgreSQL

```sql
-- ❌ NE FONCTIONNE PAS (même transaction)
ALTER TYPE my_enum ADD VALUE 'new_value';
INSERT INTO my_table VALUES ('new_value'::my_enum);  -- ERREUR !

-- ✅ FONCTIONNE (transactions séparées)
-- Transaction 1:
ALTER TYPE my_enum ADD VALUE 'new_value';
COMMIT;

-- Transaction 2:
INSERT INTO my_table VALUES ('new_value'::my_enum);  -- OK !
```

Chaque fichier SQL dans le Dashboard Supabase = 1 transaction séparée.

---

## 📊 Détail des Étapes

### Étape 1 : Create Enum
- Vérifie si l'enum existe
- Si non : le crée avec toutes les valeurs
- Si oui : affiche les valeurs actuelles
- **Aucune insertion de données**

### Étape 2 : Add Values
- Ajoute chaque valeur manquante séparément
- Vérifie avant d'ajouter (pas de doublon)
- Affiche le résultat final
- **Chaque ADD VALUE est dans un DO block séparé**

### Étape 3 : Create Tables
- Vérifie que l'enum a bien 7 valeurs
- Crée les 5 tables
- Insère les données (maintenant les valeurs d'enum sont utilisables)
- Crée les fonctions, RLS, triggers

---

## ⚠️ Erreurs Possibles

### "L'enum n'a que X valeurs (7 requises)"
➡️ **Solution :** Réexécutez l'étape 2

### "Table already exists"
➡️ **OK** : C'est normal avec `CREATE TABLE IF NOT EXISTS`

### "Policy already exists"
➡️ **OK** : Le script utilise `DROP POLICY IF EXISTS` avant de créer

---

## 🎉 Après le Succès

Une fois les 3 étapes terminées :

```bash
# 1. Vérifier l'application
npm run dev

# 2. Naviguer vers
# - /pricing (voir les nouveaux plans)
# - /migrate (tester la migration)

# 3. Utiliser dans le code
import { useNewSubscription } from '@/hooks/useNewSubscription';
import { OperePackageSelector } from '@/components/subscription/OperePackageSelector';
```

---

## 📞 Besoin d'Aide ?

- **Step 1 échoue** : L'enum n'a probablement pas les permissions → Vérifiez les droits admin
- **Step 2 échoue** : Exécutez les DO blocks un par un manuellement
- **Step 3 échoue** : Vérifiez que step 2 a bien ajouté toutes les valeurs

---

## ✨ Résumé

| Étape | Fichier | Durée | Critique |
|-------|---------|-------|----------|
| 1 | `20260123_step1_create_enum.sql` | 2 sec | ⭐⭐⭐ |
| 2 | `20260123_step2_add_values_to_enum.sql` | 5 sec | ⭐⭐⭐ |
| 3 | `20260123_step3_create_tables.sql` | 10 sec | ⭐⭐⭐ |

**Temps total : ~20 secondes**

---

## 🎯 C'EST PARTI !

1. Ouvrez le Dashboard Supabase
2. Exécutez step1
3. Exécutez step2
4. Exécutez step3
5. ✅ C'est fini !

Le nouveau modèle de souscription est maintenant **prêt pour la production** ! 🚀
