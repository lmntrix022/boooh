# 🚀 **CONFIGURATION RAPIDE - STOCKAGE PRODUITS NUMÉRIQUES**

## ⚡ **SOLUTION IMMÉDIATE**

L'erreur `Bucket not found` indique que les buckets de stockage n'existent pas. Voici comment les créer rapidement :

## 🔧 **ÉTAPES DE CONFIGURATION**

### **1. Démarrer Supabase (si local)**
```bash
supabase start
```

### **2. Appliquer la Migration**
```bash
supabase db push
```

### **3. Créer les Buckets via l'Interface Supabase**

#### **Option A : Interface Web (Recommandée)**
1. Aller sur [supabase.com](https://supabase.com)
2. Sélectionner votre projet
3. Aller dans **Storage** dans le menu de gauche
4. Cliquer sur **"New bucket"**

#### **Créer le bucket `digital-products`**
- **Name** : `digital-products`
- **Public** : ❌ **Non** (privé)
- **File size limit** : `104857600` (100MB)
- **Allowed MIME types** : 
  ```
  audio/mpeg,audio/wav,audio/mp3,video/mp4,video/quicktime,application/pdf,application/epub+zip
  ```

#### **Créer le bucket `digital-thumbnails`**
- **Name** : `digital-thumbnails`
- **Public** : ✅ **Oui** (public)
- **File size limit** : `5242880` (5MB)
- **Allowed MIME types** : 
  ```
  image/jpeg,image/png,image/webp,image/gif
  ```

### **4. Configurer les Politiques RLS**

#### **Pour `digital-products` (Privé)**
```sql
-- Politique d'upload
CREATE POLICY "Users can upload their own digital products" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'digital-products' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique de lecture
CREATE POLICY "Users can view their own digital products" ON storage.objects
FOR SELECT USING (
  bucket_id = 'digital-products' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique de mise à jour
CREATE POLICY "Users can update their own digital products" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'digital-products' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique de suppression
CREATE POLICY "Users can delete their own digital products" ON storage.objects
FOR DELETE USING (
  bucket_id = 'digital-products' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### **Pour `digital-thumbnails` (Public)**
```sql
-- Politique de lecture publique
CREATE POLICY "Anyone can view digital thumbnails" ON storage.objects
FOR SELECT USING (bucket_id = 'digital-thumbnails');

-- Politique d'upload
CREATE POLICY "Users can upload their own digital thumbnails" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'digital-thumbnails' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique de mise à jour
CREATE POLICY "Users can update their own digital thumbnails" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'digital-thumbnails' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique de suppression
CREATE POLICY "Users can delete their own digital thumbnails" ON storage.objects
FOR DELETE USING (
  bucket_id = 'digital-thumbnails' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## 🎯 **SOLUTION ALTERNATIVE RAPIDE**

Si vous voulez une solution immédiate, modifiez temporairement le code pour utiliser un bucket existant :

### **Modifier `DigitalProductManager.tsx`**
```typescript
const uploadFile = async (file: File, type: 'file' | 'preview' | 'thumbnail'): Promise<string | null> => {
  try {
    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${type}-${Date.now()}.${fileExt}`;
    
    // Utiliser un bucket existant temporairement
    const bucketName = 'your-existing-bucket'; // Remplacez par un bucket existant
    const filePath = `digital-products/${id}/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file);
      
    if (error) {
      console.error("Storage error:", error);
      throw new Error(`Erreur de stockage: ${error.message}`);
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
      
    return publicUrl;
  } catch (error: any) {
    console.error("Error uploading file:", error);
    toast({
      title: "Erreur d'upload",
      description: `Impossible d'uploader le fichier ${file.name}. ${error.message}`,
      variant: "destructive",
    });
    return null;
  } finally {
    setIsUploading(false);
  }
};
```

## ✅ **VÉRIFICATION**

### **1. Vérifier que les buckets existent**
```sql
SELECT id, name, public FROM storage.buckets 
WHERE id IN ('digital-products', 'digital-thumbnails');
```

### **2. Tester l'upload**
```javascript
// Test rapide dans la console du navigateur
const testUpload = async () => {
  const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
  
  const { data, error } = await supabase.storage
    .from('digital-products')
    .upload('test/test.txt', file);
    
  console.log('Test upload:', { data, error });
};
```

## 🚨 **EN CAS D'URGENCE**

Si vous devez tester immédiatement, utilisez le bucket `avatars` existant :

```typescript
// Solution d'urgence - utiliser le bucket avatars
const bucketName = 'avatars';
const filePath = `digital-products/${id}/${fileName}`;
```

---

**Une fois les buckets créés, l'upload des produits numériques fonctionnera parfaitement !** 🎯✨
