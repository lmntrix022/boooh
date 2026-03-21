# Guide de correction du rôle Admin

## Problème

L'erreur 500 lors de la vérification du rôle admin est causée par une **récursion infinie** dans les politiques RLS de la table `user_roles`.

### Cause
La politique `"Admins can manage roles"` vérifie si l'utilisateur est admin en consultant la table `user_roles`, ce qui crée une boucle infinie :

```sql
-- ❌ Politique problématique (récursive)
USING (EXISTS (
  SELECT 1 FROM public.user_roles  -- Consulte la même table !
  WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'admin'
))
```

## Solution

### Étape 1 : Appliquer la migration SQL

**Via Supabase Dashboard :**

1. Connectez-vous à [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Cliquez sur **New Query**
5. Copiez et collez le contenu du fichier : `supabase/migrations/20250116_fix_user_roles_rls.sql`
6. Cliquez sur **RUN**

**Via Supabase CLI :**

```bash
cd /Users/valerie/Downloads/boooh-main
supabase db push
```

### Étape 2 : Vérifier que les politiques sont appliquées

Exécutez cette requête dans le SQL Editor pour vérifier :

```sql
-- Vérifier les politiques actuelles
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_roles';
```

Vous devriez voir :
- ✅ `users_can_read_own_role` (SELECT)
- ✅ `service_role_full_access` (ALL)

### Étape 3 : Tester la connexion

1. Rafraîchissez votre application (F5)
2. L'erreur 500 devrait disparaître
3. Si vous êtes connecté avec `user_id: 4ecb4b21-e78f-462f-967e-f4478e2c73e2`, vous devriez voir le bouton **Admin** dans le menu

## Vérification manuelle

Pour vérifier que votre utilisateur a bien le rôle admin :

```sql
SELECT * FROM user_roles WHERE user_id = '4ecb4b21-e78f-462f-967e-f4478e2c73e2';
```

Résultat attendu :
```
id: f4816281-f2b9-4a40-ad18-838973e41824
user_id: 4ecb4b21-e78f-462f-967e-f4478e2c73e2
role: admin
created_at: 2025-10-03 21:59:01.760745+00
```

## Comprendre les nouvelles politiques

### Politique 1 : Lecture de son propre rôle
```sql
CREATE POLICY "users_can_read_own_role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
```
- ✅ Permet à chaque utilisateur de lire **son propre** rôle
- ✅ Pas de récursion (compare directement avec `auth.uid()`)
- ✅ Nécessaire pour que l'application détecte les admins

### Politique 2 : Accès complet pour service_role
```sql
CREATE POLICY "service_role_full_access"
ON public.user_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```
- ✅ Permet les opérations admin via le service role
- ✅ Utilisé pour gérer les rôles depuis l'interface admin

## Problèmes potentiels

### Erreur : "policy already exists"
Si vous obtenez cette erreur, supprimez d'abord les anciennes politiques :

```sql
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Temporary unrestricted policy" ON public.user_roles;
```

### L'utilisateur ne voit toujours pas le bouton Admin
1. Vérifiez que l'utilisateur a bien le rôle dans la base :
   ```sql
   SELECT * FROM user_roles WHERE user_id = auth.uid();
   ```
2. Déconnectez-vous et reconnectez-vous
3. Videz le cache du navigateur (Ctrl+Shift+R)

## Ressources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth Functions](https://supabase.com/docs/guides/auth/auth-helpers/auth-ui)
