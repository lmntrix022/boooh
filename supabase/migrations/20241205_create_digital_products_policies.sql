-- Migration pour créer les politiques RLS des produits numériques
-- Date: 2024-12-05
-- Configure les politiques RLS pour les buckets de stockage

-- 1. Politiques RLS pour le bucket digital-products (PRIVÉ)
-- Supprimer les politiques existantes s'il y en a
DROP POLICY IF EXISTS "Users can upload their own digital products" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own digital products" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own digital products" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own digital products" ON storage.objects;

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

-- 2. Politiques RLS pour le bucket digital-thumbnails (PUBLIC)
-- Supprimer les politiques existantes s'il y en a
DROP POLICY IF EXISTS "Anyone can view digital thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own digital thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own digital thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own digital thumbnails" ON storage.objects;

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

-- 3. Fonction pour vérifier les permissions d'upload
CREATE OR REPLACE FUNCTION check_upload_permission(
  bucket_name TEXT,
  file_path TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Vérifier que l'utilisateur est authentifié
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Vérifier que le fichier appartient à l'utilisateur
  IF bucket_name = 'digital-products' OR bucket_name = 'digital-thumbnails' THEN
    RETURN split_part(file_path, '/', 1) = auth.uid()::text;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fonction pour générer des URLs sécurisées
CREATE OR REPLACE FUNCTION generate_secure_download_url(
  bucket_name TEXT,
  file_path TEXT,
  expires_in INTEGER DEFAULT 3600
) RETURNS TEXT AS $$
DECLARE
  signed_url TEXT;
BEGIN
  -- Vérifier les permissions
  IF NOT check_upload_permission(bucket_name, file_path) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Générer une URL signée avec expiration
  SELECT storage.create_signed_url(bucket_name, file_path, expires_in) INTO signed_url;
  RETURN signed_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Fonction pour nettoyer les fichiers orphelins
CREATE OR REPLACE FUNCTION cleanup_orphaned_files()
RETURNS void AS $$
BEGIN
  -- Supprimer les fichiers qui ne sont plus référencés dans digital_products
  DELETE FROM storage.objects 
  WHERE bucket_id IN ('digital-products', 'digital-thumbnails')
  AND name NOT IN (
    SELECT DISTINCT 
      CASE 
        WHEN file_url IS NOT NULL THEN split_part(file_url, '/', 4)
        WHEN preview_url IS NOT NULL THEN split_part(preview_url, '/', 4)
        WHEN thumbnail_url IS NOT NULL THEN split_part(thumbnail_url, '/', 4)
      END
    FROM digital_products 
    WHERE file_url IS NOT NULL OR preview_url IS NOT NULL OR thumbnail_url IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger pour nettoyer les fichiers lors de la suppression d'un produit
CREATE OR REPLACE FUNCTION cleanup_product_files()
RETURNS TRIGGER AS $$
BEGIN
  -- Supprimer les fichiers associés au produit supprimé
  IF OLD.file_url IS NOT NULL THEN
    DELETE FROM storage.objects 
    WHERE bucket_id = 'digital-products' 
    AND name = split_part(OLD.file_url, '/', 4);
  END IF;
  
  IF OLD.preview_url IS NOT NULL THEN
    DELETE FROM storage.objects 
    WHERE bucket_id = 'digital-products' 
    AND name = split_part(OLD.preview_url, '/', 4);
  END IF;
  
  IF OLD.thumbnail_url IS NOT NULL THEN
    DELETE FROM storage.objects 
    WHERE bucket_id = 'digital-thumbnails' 
    AND name = split_part(OLD.thumbnail_url, '/', 4);
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger existant s'il existe
DROP TRIGGER IF EXISTS cleanup_product_files_trigger ON digital_products;

-- Créer le trigger
CREATE TRIGGER cleanup_product_files_trigger
  BEFORE DELETE ON digital_products
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_product_files();

-- 7. Fonction pour obtenir les statistiques de stockage
CREATE OR REPLACE FUNCTION get_storage_stats(user_id UUID)
RETURNS TABLE (
  total_files BIGINT,
  total_size BIGINT,
  file_types JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_files,
    COALESCE(SUM(metadata->>'size')::BIGINT, 0) as total_size,
    jsonb_object_agg(
      COALESCE(metadata->>'mimetype', 'unknown'),
      file_count
    ) as file_types
  FROM (
    SELECT 
      metadata,
      COUNT(*) as file_count
    FROM storage.objects 
    WHERE bucket_id IN ('digital-products', 'digital-thumbnails')
    AND split_part(name, '/', 1) = user_id::text
    GROUP BY metadata->>'mimetype'
  ) stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Fonction pour vérifier les limites de stockage
CREATE OR REPLACE FUNCTION check_storage_limits(user_id UUID, file_size BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
  current_usage BIGINT;
  max_usage BIGINT;
BEGIN
  -- Récupérer l'usage actuel
  SELECT COALESCE(SUM(metadata->>'size')::BIGINT, 0) INTO current_usage
  FROM storage.objects 
  WHERE bucket_id IN ('digital-products', 'digital-thumbnails')
  AND split_part(name, '/', 1) = user_id::text;
  
  -- Définir la limite (100MB par défaut, peut être ajustée selon le plan)
  max_usage := 104857600; -- 100MB
  
  -- Vérifier si l'ajout du fichier dépasse la limite
  RETURN (current_usage + file_size) <= max_usage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
