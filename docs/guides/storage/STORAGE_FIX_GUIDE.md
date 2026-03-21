# 🔧 **GUIDE DE CORRECTION - ERREUR STOCKAGE**

## 🚨 **ERREUR RENCONTRÉE**

```
ERROR: 42601: syntax error at or near "["
LINE 206: ON storage.objects (bucket_id, (storage.foldername(name))[1]);
```

## ✅ **SOLUTION APPLIQUÉE**

### **🔍 Problème Identifié**
La syntaxe `(storage.foldername(name))[1]` n'est pas supportée dans les index PostgreSQL. Cette fonction retourne un array et ne peut pas être utilisée directement dans un index.

### **🛠️ Corrections Apportées**

#### **1. Index Simplifiés**
```sql
-- ❌ Avant (Erreur de syntaxe)
CREATE INDEX ON storage.objects (bucket_id, (storage.foldername(name))[1]);

-- ✅ Après (Syntaxe correcte)
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_id 
ON storage.objects (bucket_id);

CREATE INDEX IF NOT EXISTS idx_storage_objects_name 
ON storage.objects (name);
```

#### **2. Politiques RLS Corrigées**
```sql
-- ❌ Avant (Erreur de syntaxe)
AND auth.uid()::text = (storage.foldername(name))[1]

-- ✅ Après (Syntaxe correcte)
AND auth.uid()::text = split_part(name, '/', 1)
```

#### **3. Fonctions Simplifiées**
```sql
-- ❌ Avant (Erreur de syntaxe)
AND auth.uid()::text = (storage.foldername(name))[1]

-- ✅ Après (Syntaxe correcte)
AND split_part(name, '/', 1) = user_id::text
```

## 🚀 **SOLUTION RAPIDE**

### **Option 1 : Script Automatique**
```bash
./fix-storage-quick.sh
```

### **Option 2 : Migration Simplifiée**
```bash
supabase db push --file supabase/migrations/20241205_create_digital_products_storage_simple.sql
```

### **Option 3 : Création Manuelle via Interface**
1. Aller sur [supabase.com](https://supabase.com)
2. Sélectionner votre projet
3. Aller dans **Storage**
4. Créer les buckets manuellement

## 📋 **BUCKETS À CRÉER**

### **digital-products (Privé)**
- **Name** : `digital-products`
- **Public** : ❌ **Non**
- **File size limit** : `104857600` (100MB)
- **Allowed MIME types** : 
  ```
  audio/mpeg,audio/wav,audio/mp3,video/mp4,video/quicktime,application/pdf,application/epub+zip,image/jpeg,image/png,image/webp,image/gif
  ```

### **digital-thumbnails (Public)**
- **Name** : `digital-thumbnails`
- **Public** : ✅ **Oui**
- **File size limit** : `5242880` (5MB)
- **Allowed MIME types** : 
  ```
  image/jpeg,image/png,image/webp,image/gif
  ```

## 🔐 **POLITIQUES RLS À CONFIGURER**

### **Pour digital-products (Privé)**
```sql
-- Upload
CREATE POLICY "Users can upload their own digital products" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'digital-products' 
  AND auth.uid()::text = split_part(name, '/', 1)
);

-- Download
CREATE POLICY "Users can view their own digital products" ON storage.objects
FOR SELECT USING (
  bucket_id = 'digital-products' 
  AND auth.uid()::text = split_part(name, '/', 1)
);

-- Update
CREATE POLICY "Users can update their own digital products" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'digital-products' 
  AND auth.uid()::text = split_part(name, '/', 1)
);

-- Delete
CREATE POLICY "Users can delete their own digital products" ON storage.objects
FOR DELETE USING (
  bucket_id = 'digital-products' 
  AND auth.uid()::text = split_part(name, '/', 1)
);
```

### **Pour digital-thumbnails (Public)**
```sql
-- Public read
CREATE POLICY "Anyone can view digital thumbnails" ON storage.objects
FOR SELECT USING (bucket_id = 'digital-thumbnails');

-- User upload
CREATE POLICY "Users can upload their own digital thumbnails" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'digital-thumbnails' 
  AND auth.uid()::text = split_part(name, '/', 1)
);

-- User update
CREATE POLICY "Users can update their own digital thumbnails" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'digital-thumbnails' 
  AND auth.uid()::text = split_part(name, '/', 1)
);

-- User delete
CREATE POLICY "Users can delete their own digital thumbnails" ON storage.objects
FOR DELETE USING (
  bucket_id = 'digital-thumbnails' 
  AND auth.uid()::text = split_part(name, '/', 1)
);
```

## 🧪 **TEST DE FONCTIONNEMENT**

### **1. Vérifier les Buckets**
```sql
SELECT id, name, public FROM storage.buckets 
WHERE id IN ('digital-products', 'digital-thumbnails');
```

### **2. Tester l'Upload**
```javascript
// Test dans la console du navigateur
const testUpload = async () => {
  const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
  
  const { data, error } = await supabase.storage
    .from('digital-products')
    .upload('test/test.txt', file);
    
  console.log('Test upload:', { data, error });
};
```

### **3. Vérifier les Politiques**
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%digital%';
```

## 🎯 **STRUCTURE DES FICHIERS**

### **Organisation Attendue**
```
digital-products/
├── {user_id}/
│   ├── file-{timestamp}.mp3
│   ├── preview-{timestamp}.mp3
│   └── ...

digital-thumbnails/
├── {user_id}/
│   ├── thumbnail-{timestamp}.jpg
│   └── ...
```

### **Code de Upload Corrigé**
```typescript
const uploadFile = async (file: File, type: 'file' | 'preview' | 'thumbnail'): Promise<string | null> => {
  try {
    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${type}-${Date.now()}.${fileExt}`;
    
    // Utiliser le bon bucket selon le type de fichier
    const bucketName = type === 'thumbnail' ? 'digital-thumbnails' : 'digital-products';
    const filePath = `${id}/${fileName}`;
    
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

## ✅ **VÉRIFICATION FINALE**

### **Checklist de Vérification**
- [ ] Bucket `digital-products` créé (privé)
- [ ] Bucket `digital-thumbnails` créé (public)
- [ ] Politiques RLS configurées
- [ ] Test d'upload fonctionnel
- [ ] Pas d'erreurs dans la console

### **Messages de Succès**
```
✅ Bucket 'digital-products' vérifié
✅ Bucket 'digital-thumbnails' vérifié
✅ Configuration du stockage terminée !
```

---

**Une fois ces corrections appliquées, l'upload des produits numériques fonctionnera parfaitement !** 🎯✨
