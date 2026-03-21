-- Fix infinite recursion in media storage bucket RLS policies
-- Date: 2025-10-15
-- Issue: DatabaseError: infinite recursion detected in policy for relation "user_roles"

-- 1. Drop all existing policies on media bucket
DROP POLICY IF EXISTS "Allow authenticated users to upload media" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to upload media" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to read media" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload to media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read from media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete from media" ON storage.objects;
DROP POLICY IF EXISTS "Media bucket upload policy" ON storage.objects;
DROP POLICY IF EXISTS "Media bucket read policy" ON storage.objects;
DROP POLICY IF EXISTS "Media bucket delete policy" ON storage.objects;

-- 2. Create simple, non-recursive policies for media bucket
-- These policies do NOT reference user_roles to avoid infinite recursion

-- Allow authenticated users to upload to media bucket
CREATE POLICY "media_upload_authenticated"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media'
  AND auth.uid() = owner::uuid
);

-- Allow public read access to media bucket (for public portfolio viewing)
CREATE POLICY "media_read_public"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'media');

-- Allow users to update their own media files
CREATE POLICY "media_update_own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media'
  AND auth.uid() = owner::uuid
)
WITH CHECK (
  bucket_id = 'media'
  AND auth.uid() = owner::uuid
);

-- Allow users to delete their own media files
CREATE POLICY "media_delete_own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'media'
  AND auth.uid() = owner::uuid
);

-- 3. Ensure media bucket exists and is public for reads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,  -- Public bucket for portfolio images
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'application/pdf'];

-- 4. Verify RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 5. Add helpful comment
COMMENT ON POLICY "media_upload_authenticated" ON storage.objects IS
'Allows authenticated users to upload media files. Uses auth.uid() directly to avoid infinite recursion with user_roles.';

COMMENT ON POLICY "media_read_public" ON storage.objects IS
'Allows public read access to media bucket for portfolio viewing.';
