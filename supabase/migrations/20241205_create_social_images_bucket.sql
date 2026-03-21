-- Créer le bucket pour les images des réseaux sociaux
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'social-images',
  'social-images',
  true,
  1048576, -- 1MB en bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Politique pour permettre l'upload des images sociales
CREATE POLICY "Users can upload social images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'social-images' AND
  auth.role() = 'authenticated'
);

-- Politique pour permettre la lecture des images sociales
CREATE POLICY "Anyone can view social images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'social-images'
);

-- Politique pour permettre la suppression des images sociales
CREATE POLICY "Users can delete their social images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'social-images' AND
  auth.role() = 'authenticated'
);
