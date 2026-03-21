# Configuration du Système de Vues des Cartes

## Problème
L'erreur `404 (Not Found)` pour la fonction RPC `record_card_view` indique que cette fonction n'existe pas dans la base de données Supabase.

**Erreur possible :** `function name "public.record_card_view" is not unique`
- Cela signifie qu'il existe déjà une fonction avec ce nom mais avec une signature différente
- PostgreSQL ne peut pas déterminer quelle fonction utiliser

## Solution

### Option 1 : Script de Nettoyage Complet (Recommandé)
Exécutez le script SQL `cleanup_and_setup_card_views.sql` qui :
1. **Supprime** toutes les anciennes versions de la fonction
2. **Recrée** la table `card_views` avec la bonne structure
3. **Ajoute** les colonnes `view_count` et `last_viewed_at` dans `business_cards`
4. **Crée** la fonction RPC `record_card_view` avec la bonne signature
5. **Configure** les politiques RLS

### Option 2 : Script de Mise à Jour
Si vous préférez garder les données existantes, utilisez `setup_card_views.sql` qui :
1. **Supprime** seulement les anciennes fonctions
2. **Met à jour** la structure existante
3. **Crée** la fonction RPC avec la bonne signature

## Instructions

### 1. Accéder à Supabase
1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor** dans le menu de gauche

### 2. Exécuter le Script
1. **Pour un nettoyage complet** : Copiez le contenu de `cleanup_and_setup_card_views.sql`
2. **Pour une mise à jour** : Copiez le contenu de `setup_card_views.sql`
3. Collez-le dans l'éditeur SQL
4. Cliquez sur **Run** pour exécuter le script

### 3. Vérification
Le script affichera des messages de confirmation :
- ✅ Tables créées
- ✅ Fonction créée
- ✅ Colonnes ajoutées

## Fonctionnalités Ajoutées

### Table `card_views`
- **Enregistrement des vues** : IP, user agent, referrer, timestamp
- **Compteur de vues** : Évite les doublons avec contrainte unique
- **Performance** : Index sur `card_id` et `viewed_at`

### Colonnes `business_cards`
- **`view_count`** : Nombre total de vues de la carte
- **`last_viewed_at`** : Timestamp de la dernière vue

### Fonction RPC `record_card_view`
- **Paramètres** : `card_uuid`, `ip`, `user_agent`, `referrer`
- **Logique** : Met à jour ou insère une nouvelle vue
- **Sécurité** : Fonction `SECURITY DEFINER` avec permissions appropriées

## Utilisation

Une fois le script exécuté, les vues des cartes seront automatiquement enregistrées quand :
- Un utilisateur visite une carte publique
- La fonction `recordCardView()` est appelée dans le code

## Dépannage

### Erreur "function name is not unique"
- **Cause** : Il existe déjà une fonction avec ce nom mais une signature différente
- **Solution** : Utilisez le script `cleanup_and_setup_card_views.sql` qui supprime toutes les anciennes versions

### Erreur "relation does not exist"
- **Cause** : La table `business_cards` n'existe pas
- **Solution** : Vérifiez que votre base de données est correctement configurée

### Erreur de permissions
- **Cause** : Vous n'avez pas les permissions d'administrateur
- **Solution** : Connectez-vous avec un compte administrateur

### Autres erreurs
1. Vérifiez que vous êtes connecté à Supabase
2. Assurez-vous d'avoir les permissions d'administrateur
3. Vérifiez que la table `business_cards` existe
4. Consultez les logs SQL pour plus de détails
