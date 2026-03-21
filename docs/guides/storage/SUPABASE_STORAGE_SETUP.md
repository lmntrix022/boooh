# 🗂️ Configuration Supabase Storage pour l'Upload d'Images

## 📋 Prérequis

Avant de pouvoir uploader des images, vous devez configurer les buckets Supabase Storage.

## 🚀 Étapes de Configuration

### 1. Accéder au Dashboard Supabase

1. Connectez-vous à [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Storage** dans le menu de gauche

### 2. Créer les Buckets Requis

#### Bucket `avatars`
- **Nom** : `avatars`
- **Public** : ✅ Oui
- **File size limit** : 50MB
- **Allowed MIME types** : `image/jpeg, image/jpg, image/png, image/webp`

#### Bucket `card-covers`
- **Nom** : `card-covers`
- **Public** : ✅ Oui
- **File size limit** : 50MB
- **Allowed MIME types** : `image/jpeg, image/jpg, image/png, image/webp`

### 3. Configurer les Politiques RLS

#### Pour le bucket `avatars` :

```sql
-- Politique pour permettre l'upload à tous les utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Politique pour permettre la lecture publique
CREATE POLICY "Public can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Politique pour permettre la suppression par le propriétaire
CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Pour le bucket `card-covers` :

```sql
-- Politique pour permettre l'upload à tous les utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload card covers" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'card-covers' 
  AND auth.role() = 'authenticated'
);

-- Politique pour permettre la lecture publique
CREATE POLICY "Public can view card covers" ON storage.objects
FOR SELECT USING (bucket_id = 'card-covers');

-- Politique pour permettre la suppression par le propriétaire
CREATE POLICY "Users can delete their own card covers" ON storage.objects
FOR DELETE USING (
  bucket_id = 'card-covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 4. Vérifier la Configuration

Après avoir créé les buckets et les politiques, l'application devrait automatiquement :

1. ✅ Détecter les buckets existants
2. ✅ Permettre l'upload d'images
3. ✅ Afficher les images uploadées
4. ✅ Gérer les erreurs d'upload

## 🔧 Dépannage

### Erreur : "Bucket not found"
- Vérifiez que les buckets `avatars` et `card-covers` existent
- Vérifiez que les noms sont exactement `avatars` et `card-covers`

### Erreur : "Permission denied"
- Vérifiez que les politiques RLS sont correctement configurées
- Vérifiez que l'utilisateur est authentifié

### Erreur : "File too large"
- Vérifiez la limite de taille du bucket (recommandé : 50MB)
- Vérifiez la validation côté client (5MB pour avatars, 10MB pour covers)

### Images ne s'affichent pas
- Vérifiez que les buckets sont publics
- Vérifiez que les politiques de lecture sont configurées
- Vérifiez les URLs générées dans la console

## 📱 Test de l'Upload

Pour tester l'upload d'images :

1. Allez sur la page de création/modification de carte
2. Cliquez sur l'étape "Médias"
3. Essayez d'uploader une image
4. Vérifiez que l'image s'affiche correctement
5. Sauvegardez la carte et vérifiez que l'image persiste

## 🎯 Types d'Images Supportés

- **Photo de profil** : `avatars` bucket, max 5MB
- **Logo d'entreprise** : `avatars` bucket, max 5MB  
- **Image de couverture** : `card-covers` bucket, max 10MB

## 📊 Monitoring

Vous pouvez surveiller l'utilisation du storage dans :
- **Supabase Dashboard** > **Storage** > **Usage**
- **Console du navigateur** pour les logs d'upload
- **Network tab** pour voir les requêtes d'upload

## 🔒 Sécurité

- ✅ Tous les uploads sont authentifiés
- ✅ Validation des types de fichiers
- ✅ Validation de la taille des fichiers
- ✅ Noms de fichiers uniques avec timestamp
- ✅ Politiques RLS pour la sécurité
