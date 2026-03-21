# Instructions pour appliquer la correction des paramètres de facturation

## Problème résolu
Les champs "Informations d'entreprise" dans les Paramètres de Facturation n'étaient pas sauvegardés car :
1. Les inputs n'étaient pas liés au state React (manquait `value` et `onChange`)
2. La table `invoice_settings` ne contenait pas les colonnes nécessaires

## Corrections effectuées

### 1. Code Frontend - ✅ DÉJÀ CORRIGÉ
Le fichier `src/components/invoice/InvoiceSettings.tsx` a été mis à jour pour lier correctement les champs :
- `company_name` (Nom de l'entreprise)
- `company_siret` (SIRET / Numéro d'entreprise)
- `company_address` (Adresse)
- `company_phone` (Téléphone)
- `company_email` (Email)
- `company_website` (Site web)

### 2. Migration Base de Données - ⚠️ À EXÉCUTER

Vous devez appliquer la migration SQL pour ajouter ces colonnes à la base de données.

#### Option A : Via Supabase Dashboard (RECOMMANDÉ)
1. Connectez-vous à votre projet Supabase : https://app.supabase.com
2. Allez dans **SQL Editor** (menu de gauche)
3. Cliquez sur **+ New query**
4. Copiez-collez le contenu du fichier :
   ```
   supabase/migrations/20250113_add_company_info_to_invoice_settings.sql
   ```
5. Cliquez sur **Run** pour exécuter la migration
6. Vérifiez qu'il n'y a pas d'erreurs

#### Option B : Via Supabase CLI (si vous utilisez un projet local)
```bash
# Dans le terminal, à la racine du projet
supabase db reset
```

## Vérification

Après avoir appliqué la migration :

1. Rechargez votre application (Ctrl+R ou Cmd+R)
2. Allez dans **Facturation** → **Paramètres**
3. Remplissez les champs "Informations d'entreprise"
4. Cliquez sur **Enregistrer**
5. Rechargez la page pour vérifier que les données sont bien sauvegardées

## Support

Si vous rencontrez des problèmes :
- Vérifiez que la migration s'est bien exécutée dans Supabase
- Vérifiez que les colonnes ont été ajoutées à la table `invoice_settings`
- Consultez la console du navigateur pour voir les erreurs éventuelles
