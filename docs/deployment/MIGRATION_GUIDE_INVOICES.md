# Guide de Migration : Intégration Factures ↔ Inquiries

## 🎯 Objectif

Ce guide vous aide à migrer le système de facturation pour qu'il fonctionne avec vos vraies tables `product_inquiries` et `digital_inquiries`.

---

## ✅ Prérequis

- [ ] Accès à votre projet Supabase
- [ ] Application en cours d'exécution
- [ ] Backup de la base de données (recommandé)

---

## 📋 Étapes de migration

### Étape 1 : Appliquer la migration SQL ⚡

#### Option A : Via Supabase CLI (Recommandé)

```bash
# 1. Se positionner dans le dossier du projet
cd /Users/quantinekouaghe/Downloads/boooh-main

# 2. Pousser les migrations vers Supabase
supabase db push
```

#### Option B : Via Dashboard Supabase

1. Aller sur [https://supabase.com](https://supabase.com)
2. Ouvrir votre projet
3. Cliquer sur **SQL Editor** dans le menu latéral
4. Créer une **New Query**
5. Copier-coller le contenu du fichier :
   `supabase/migrations/20250113_add_invoice_to_inquiries.sql`

6. Cliquer sur **Run** (ou Ctrl+Enter)

---

### Étape 2 : Vérifier l'application de la migration ✓

#### Dans le Dashboard Supabase

1. Aller dans **Table Editor**
2. Sélectionner la table `product_inquiries`
3. Vérifier que la colonne **`invoice_id`** existe
4. Répéter pour la table `digital_inquiries`

#### Via SQL

Exécuter cette requête dans SQL Editor :

```sql
-- Vérifier product_inquiries
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'product_inquiries'
AND column_name = 'invoice_id';

-- Vérifier digital_inquiries
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'digital_inquiries'
AND column_name = 'invoice_id';
```

**Résultat attendu :**
```
column_name | data_type | is_nullable | column_default
invoice_id  | uuid      | YES         | NULL
```

---

### Étape 3 : Vérifier les index 📊

```sql
-- Vérifier les index créés
SELECT
  indexname,
  tablename
FROM pg_indexes
WHERE tablename IN ('product_inquiries', 'digital_inquiries')
AND indexname LIKE '%invoice%';
```

**Résultat attendu :**
```
indexname                          | tablename
idx_product_inquiries_invoice_id   | product_inquiries
idx_digital_inquiries_invoice_id   | digital_inquiries
```

---

### Étape 4 : Tester l'application 🧪

#### 4.1 Démarrer le serveur de développement

```bash
npm run dev
```

#### 4.2 Aller sur la page factures

Ouvrir : [http://localhost:8080/facture](http://localhost:8080/facture)

#### 4.3 Créer une nouvelle facture

1. Cliquer sur **"+ Nouvelle facture"**
2. Vérifier que le sélecteur de demandes apparaît
3. Vérifier que vos demandes complétées s'affichent

**Si aucune demande n'apparaît** :
- Vérifiez que vous avez des `product_inquiries` ou `digital_inquiries` avec `status = 'completed'`
- Vérifiez que ces demandes n'ont pas déjà de `invoice_id`

#### 4.4 Tester la création de facture

1. Sélectionner une demande dans la liste
2. Vérifier que le formulaire se pré-remplit :
   - ✓ Nom du client
   - ✓ Email
   - ✓ Téléphone
   - ✓ Produit avec quantité et prix
   - ✓ Calculs HT/TVA/TTC
3. Cliquer sur **"Enregistrer"**
4. Vérifier qu'une facture est créée
5. Retourner à la liste : la demande ne doit plus apparaître comme "non facturée"

---

## 🔍 Vérifications post-migration

### 1. Vérifier la liaison inquiry → facture

```sql
-- Voir les inquiries facturées
SELECT
  pi.id,
  pi.client_name,
  pi.status,
  pi.invoice_id,
  i.invoice_number,
  i.total_ttc
FROM product_inquiries pi
LEFT JOIN invoices i ON pi.invoice_id = i.id
WHERE pi.invoice_id IS NOT NULL
LIMIT 10;
```

### 2. Vérifier les demandes non facturées

```sql
-- Compter les demandes complétées non facturées
SELECT
  'product_inquiries' as table_name,
  COUNT(*) as unbilled_count
FROM product_inquiries
WHERE status = 'completed'
AND invoice_id IS NULL

UNION ALL

SELECT
  'digital_inquiries' as table_name,
  COUNT(*) as unbilled_count
FROM digital_inquiries
WHERE status = 'completed'
AND invoice_id IS NULL;
```

### 3. Vérifier l'intégrité des données

```sql
-- Vérifier qu'il n'y a pas de factures orphelines
SELECT
  i.id,
  i.invoice_number,
  i.order_id,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM product_inquiries
      WHERE id = i.order_id
    ) THEN 'product_inquiry'
    WHEN EXISTS (
      SELECT 1 FROM digital_inquiries
      WHERE id = i.order_id
    ) THEN 'digital_inquiry'
    ELSE 'orphan'
  END as inquiry_type
FROM invoices i
WHERE i.order_id IS NOT NULL;
```

---

## 🐛 Résolution de problèmes

### Problème 1 : La migration échoue

**Erreur** : `relation "invoices" does not exist`

**Solution** : Appliquer d'abord la migration de création des tables de factures :
```bash
supabase db push --file supabase/migrations/20250112_create_invoice_tables.sql
```

### Problème 2 : Aucune demande ne s'affiche

**Causes possibles** :
1. Aucune demande avec `status = 'completed'`
2. Toutes les demandes sont déjà facturées
3. Les demandes n'appartiennent pas à vos cartes business

**Vérification** :
```sql
-- Voir toutes vos demandes complétées
SELECT
  pi.id,
  pi.client_name,
  pi.status,
  pi.invoice_id,
  bc.user_id
FROM product_inquiries pi
JOIN business_cards bc ON pi.card_id = bc.id
WHERE bc.user_id = 'VOTRE_USER_ID'  -- Remplacer par votre user_id
AND pi.status = 'completed';
```

### Problème 3 : Erreur "Cannot find name 'getUnbilledOrders'"

**Cause** : Cache TypeScript ou redémarrage nécessaire

**Solution** :
```bash
# Arrêter le serveur (Ctrl+C)
# Nettoyer le cache
rm -rf node_modules/.vite

# Redémarrer
npm run dev
```

### Problème 4 : Les prix ne s'affichent pas

**Cause** : Les produits n'ont pas de prix défini

**Vérification** :
```sql
-- Vérifier les prix des produits
SELECT
  p.id,
  p.name,
  p.price,
  COUNT(pi.id) as inquiry_count
FROM products p
LEFT JOIN product_inquiries pi ON p.id = pi.product_id
WHERE pi.status = 'completed'
GROUP BY p.id, p.name, p.price;
```

**Solution** : Mettre à jour les prix des produits via l'interface ou SQL :
```sql
UPDATE products
SET price = 10000  -- Prix en FCFA
WHERE id = 'product-id-here';
```

---

## 🔄 Rollback (en cas de problème)

### Supprimer les colonnes ajoutées

```sql
-- ATTENTION : Ceci supprime les liaisons factures ↔ inquiries
ALTER TABLE product_inquiries DROP COLUMN IF EXISTS invoice_id;
ALTER TABLE digital_inquiries DROP COLUMN IF EXISTS invoice_id;

-- Supprimer les index
DROP INDEX IF EXISTS idx_product_inquiries_invoice_id;
DROP INDEX IF EXISTS idx_digital_inquiries_invoice_id;
DROP INDEX IF EXISTS idx_product_inquiries_status;
DROP INDEX IF EXISTS idx_digital_inquiries_status;
```

---

## ✨ Après la migration

### Fonctionnalités disponibles

✅ **Page Factures** (`/facture`)
- Voir toutes vos factures
- Filtrer par statut, période, client
- Statistiques en temps réel

✅ **Créer une facture**
- Depuis une demande complétée
- Manuellement

✅ **Liaison automatique**
- Une demande → Une facture
- Traçabilité complète

### Prochaines étapes recommandées

1. **Configurer les paramètres de facturation**
   - Aller dans Paramètres (icône engrenage)
   - Définir le taux de TVA
   - Ajouter mentions légales
   - Configurer coordonnées bancaires

2. **Tester un workflow complet**
   - Créer une demande de produit (via carte publique)
   - Marquer comme `completed`
   - Générer la facture
   - Vérifier la liaison

3. **Implémenter génération PDF** (optionnel)
   - Voir [INVOICE_INQUIRY_INTEGRATION.md](./INVOICE_INQUIRY_INTEGRATION.md)

---

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifier les logs dans la console navigateur (F12)
2. Vérifier les logs Supabase (Dashboard > Logs)
3. Consulter [INVOICE_INQUIRY_INTEGRATION.md](./INVOICE_INQUIRY_INTEGRATION.md)
4. Créer une issue GitHub avec :
   - Message d'erreur complet
   - Étapes pour reproduire
   - Version de Node.js et npm

---

## 📚 Documentation

- [INVOICE_INQUIRY_INTEGRATION.md](./INVOICE_INQUIRY_INTEGRATION.md) - Documentation complète de l'intégration
- [CLAUDE.md](./CLAUDE.md) - Documentation générale du projet
- [supabase/migrations/](./supabase/migrations/) - Toutes les migrations SQL

---

**Bonne migration! 🚀**

Date : 13 janvier 2025
