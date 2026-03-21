-- Migration pour créer le bucket de stockage des thèmes
-- Date: 2024-12-06

-- Créer le bucket pour les images de thèmes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'themes',
  'themes',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Politique RLS pour le bucket themes
CREATE POLICY "Les utilisateurs authentifiés peuvent voir les images de thèmes" ON storage.objects
  FOR SELECT USING (bucket_id = 'themes');

CREATE POLICY "Les admins peuvent uploader des images de thèmes" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'themes' AND
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Les admins peuvent mettre à jour les images de thèmes" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'themes' AND
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Les admins peuvent supprimer les images de thèmes" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'themes' AND
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );
