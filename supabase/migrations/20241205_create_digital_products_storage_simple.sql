-- Migration simplifiée pour créer le stockage des produits numériques
-- Date: 2024-12-05

-- 1. Créer le bucket digital-products
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'digital-products',
  'digital-products',
  false, -- Bucket privé pour la sécurité
  104857600, -- 100MB par fichier
  ARRAY[
    'audio/mpeg',
    'audio/wav',
    'audio/mp3',
    'video/mp4',
    'video/quicktime',
    'application/pdf',
    'application/epub+zip',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Créer le bucket digital-thumbnails
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'digital-thumbnails',
  'digital-thumbnails',
  true, -- Bucket public pour les images
  5242880, -- 5MB par image
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 3. Politiques RLS pour le bucket digital-products
CREATE POLICY "Users can upload their own digital products" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'digital-products' 
  AND auth.uid()::text = split_part(name, '/', 1)
);

CREATE POLICY "Users can view their own digital products" ON storage.objects
FOR SELECT USING (
  bucket_id = 'digital-products' 
  AND auth.uid()::text = split_part(name, '/', 1)
);

CREATE POLICY "Users can update their own digital products" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'digital-products' 
  AND auth.uid()::text = split_part(name, '/', 1)
);

CREATE POLICY "Users can delete their own digital products" ON storage.objects
FOR DELETE USING (
  bucket_id = 'digital-products' 
  AND auth.uid()::text = split_part(name, '/', 1)
);

-- 4. Politiques RLS pour le bucket digital-thumbnails
CREATE POLICY "Anyone can view digital thumbnails" ON storage.objects
FOR SELECT USING (bucket_id = 'digital-thumbnails');

CREATE POLICY "Users can upload their own digital thumbnails" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'digital-thumbnails' 
  AND auth.uid()::text = split_part(name, '/', 1)
);

CREATE POLICY "Users can update their own digital thumbnails" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'digital-thumbnails' 
  AND auth.uid()::text = split_part(name, '/', 1)
);

CREATE POLICY "Users can delete their own digital thumbnails" ON storage.objects
FOR DELETE USING (
  bucket_id = 'digital-thumbnails' 
  AND auth.uid()::text = split_part(name, '/', 1)
);

-- 5. Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_id 
ON storage.objects (bucket_id);

CREATE INDEX IF NOT EXISTS idx_storage_objects_created_at 
ON storage.objects (created_at);

CREATE INDEX IF NOT EXISTS idx_storage_objects_name 
ON storage.objects (name);
