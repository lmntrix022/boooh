-- Migration pour corriger l'accès public aux produits numériques
-- Date: 2024-12-05
-- Permet l'accès public aux aperçus de produits numériques

-- 1. Rendre le bucket digital-products public pour les aperçus
UPDATE storage.buckets 
SET public = true 
WHERE id = 'digital-products';

-- 2. Ajouter une politique pour permettre l'accès public aux aperçus
CREATE POLICY "Anyone can view digital product previews" ON storage.objects
FOR SELECT USING (
  bucket_id = 'digital-products' 
  AND name LIKE '%/preview-%'
);

-- 3. Ajouter une politique pour permettre l'accès public aux fichiers principaux
CREATE POLICY "Anyone can view digital product files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'digital-products' 
  AND (name LIKE '%/file-%' OR name LIKE '%/preview-%')
);
