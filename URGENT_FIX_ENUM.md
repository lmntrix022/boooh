# 🚨 FIX URGENT : Erreur Enum subscription_plan

## Problème

```
ERROR: invalid input value for enum subscription_plan: "free"
```

L'enum `subscription_plan` existe mais **n'a pas les valeurs 'free', 'business', 'magic'**.

---

## ✅ Solution Immédiate (3 Options)

### Option 1 : Migration SAFE (RECOMMANDÉ)

J'ai créé une version simplifiée et plus robuste :

```bash
# Utiliser la version SAFE
supabase db push supabase/migrations/20260123_add_new_subscription_plans_SAFE.sql
```

Cette version :
- ✅ Vérifie l'état actuel de l'enum
- ✅ Ajoute les valeurs une par une avec gestion d'erreur
- ✅ Affiche des messages de debug détaillés
- ✅ Insère les données avec protection d'erreur

---

### Option 2 : Reset de l'Enum (Si Option 1 échoue)

```sql
-- ATTENTION : Cette commande supprime l'enum et ses dépendances
-- À exécuter UNIQUEMENT si vous êtes sûr

-- 1. Vérifier ce qui utilise l'enum
SELECT 
    n.nspname as schema,
    c.relname as table,
    a.attname as column
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid
JOIN pg_type t ON a.atttypid = t.oid
WHERE t.typname = 'subscription_plan'
AND a.attnum > 0
AND NOT a.attisdropped;

-- 2. Si aucune table critique n'utilise l'enum, le supprimer
DROP TYPE IF EXISTS subscription_plan CASCADE;

-- 3. Recréer proprement
CREATE TYPE subscription_plan AS ENUM (
    'free', 
    'business', 
    'magic',
    'essentiel',
    'connexions',
    'commerce',
    'opere'
);

-- 4. Réexécuter la migration
```

---

### Option 3 : Ajout Manuel des Valeurs

```sql
-- Ajouter les valeurs manquantes manuellement
-- Exécuter ligne par ligne dans SQL Editor

ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'free';
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'business';
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'magic';
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'essentiel';
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'connexions';
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'commerce';
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'opere';

-- Vérifier que toutes les valeurs sont là
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = 'subscription_plan'::regtype
ORDER BY enumsortorder;
```

**NOTE :** `IF NOT EXISTS` n'existe que dans PostgreSQL 12+. Si version plus ancienne :

```sql
-- Version compatible toutes versions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'free' 
        AND enumtypid = 'subscription_plan'::regtype
    ) THEN
        ALTER TYPE subscription_plan ADD VALUE 'free';
    END IF;
END $$;

-- Répéter pour chaque valeur...
```

---

## 🔍 Diagnostic : Comprendre le Problème

### Vérifier l'état actuel de l'enum

```sql
-- Afficher toutes les valeurs de l'enum
SELECT 
    enumlabel,
    enumsortorder
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan')
ORDER BY enumsortorder;

-- Si aucun résultat : l'enum n'a pas de valeurs
-- Si résultats mais pas 'free', 'business', 'magic' : il faut les ajouter
```

### Vérifier si l'enum existe

```sql
SELECT 
    typname,
    typtype,
    typarray
FROM pg_type 
WHERE typname = 'subscription_plan';

-- Si résultat : l'enum existe
-- Si aucun résultat : l'enum n'existe pas
```

---

## 📋 Ordre d'Exécution Recommandé

1. **Diagnostic** : Vérifier l'état actuel
```sql
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = 'subscription_plan'::regtype;
```

2. **Option la plus simple d'abord** : Migration SAFE
```bash
supabase db push supabase/migrations/20260123_add_new_subscription_plans_SAFE.sql
```

3. **Si échec** : Ajout manuel (Option 3)

4. **Si échec** : Reset de l'enum (Option 2) - ⚠️ ATTENTION

---

## 🎯 Résultat Attendu

Après l'une de ces solutions, vous devriez avoir :

```sql
-- Vérification
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = 'subscription_plan'::regtype
ORDER BY enumsortorder;

-- Résultat attendu :
-- free
-- business
-- magic
-- essentiel
-- connexions
-- commerce
-- opere

-- 7 valeurs au total
```

---

## 💡 Pourquoi Cette Erreur ?

L'enum `subscription_plan` a probablement été créé dans une migration précédente SANS les valeurs 'free', 'business', 'magic'. Peut-être créé vide ou avec d'autres valeurs.

PostgreSQL ne permet pas d'insérer des valeurs qui n'existent pas dans l'enum, même avec un cast `::subscription_plan`.

---

## ✅ Après le Fix

Une fois l'enum corrigé, la migration principale fonctionnera parfaitement !

```bash
supabase db push
```

---

**Recommandation Finale :** Utilisez la **Migration SAFE** (Option 1). Elle est spécialement conçue pour gérer ce problème avec des messages de debug détaillés.
