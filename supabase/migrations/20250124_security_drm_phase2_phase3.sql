-- ================================================================
-- 🔐 PHASE 2 & 3 - DRM SÉCURITÉ AVANCÉE
-- ================================================================
-- Date: 2025-01-24
-- Description: Watermarking forensique, Encryption at rest, Video DRM
-- ================================================================

-- ----------------------------------------------------------------
-- 1. TABLE DES WATERMARKS FORENSIQUES
-- ----------------------------------------------------------------
-- Enregistre chaque watermark unique appliqué (forensic tracking)
CREATE TABLE IF NOT EXISTS forensic_watermarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watermark_id UUID NOT NULL UNIQUE,
  inquiry_id UUID REFERENCES digital_inquiries(id) ON DELETE CASCADE,
  buyer_email TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  purchase_id TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'image', 'video', 'audio')),
  watermark_technique TEXT DEFAULT 'steganography',
  watermark_strength INTEGER DEFAULT 5 CHECK (watermark_strength BETWEEN 1 AND 10),
  is_detectable BOOLEAN DEFAULT true,
  detection_data JSONB DEFAULT '{}'::jsonb, -- Données pour détecter le watermark
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_forensic_watermarks_watermark_id ON forensic_watermarks(watermark_id);
CREATE INDEX idx_forensic_watermarks_inquiry_id ON forensic_watermarks(inquiry_id);
CREATE INDEX idx_forensic_watermarks_buyer_email ON forensic_watermarks(buyer_email);
CREATE INDEX idx_forensic_watermarks_created_at ON forensic_watermarks(created_at DESC);

-- RLS
ALTER TABLE forensic_watermarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own watermarks"
  ON forensic_watermarks
  FOR SELECT
  USING (
    buyer_email = auth.jwt() ->> 'email'
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Seul le système peut insérer
CREATE POLICY "System can insert watermarks"
  ON forensic_watermarks
  FOR INSERT
  WITH CHECK (true);

-- ----------------------------------------------------------------
-- 2. TABLE POUR ENCRYPTION AT REST (Supabase Vault)
-- ----------------------------------------------------------------
-- Stocke les références aux clés chiffrées dans Vault
CREATE TABLE IF NOT EXISTS vault_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_name TEXT NOT NULL UNIQUE,
  secret_type TEXT NOT NULL CHECK (secret_type IN (
    'encryption_key',
    'api_key',
    'signing_key',
    'master_key'
  )),
  product_id UUID REFERENCES digital_products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vault_key_id TEXT, -- ID dans Supabase Vault
  algorithm TEXT DEFAULT 'AES-256-GCM',
  key_version INTEGER DEFAULT 1,
  rotation_policy TEXT DEFAULT 'manual' CHECK (rotation_policy IN ('manual', 'auto_30d', 'auto_90d', 'auto_1y')),
  last_rotated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_vault_secrets_secret_name ON vault_secrets(secret_name);
CREATE INDEX idx_vault_secrets_product_id ON vault_secrets(product_id);
CREATE INDEX idx_vault_secrets_user_id ON vault_secrets(user_id);
CREATE INDEX idx_vault_secrets_active ON vault_secrets(is_active) WHERE is_active = true;

-- RLS
ALTER TABLE vault_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their vault secrets"
  ON vault_secrets
  FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all vault secrets"
  ON vault_secrets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- ----------------------------------------------------------------
-- 3. TABLE POUR HLS VIDEO SEGMENTS
-- ----------------------------------------------------------------
-- Stocke les métadonnées des segments vidéo HLS chiffrés
CREATE TABLE IF NOT EXISTS video_hls_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES digital_products(id) ON DELETE CASCADE,
  segment_index INTEGER NOT NULL,
  segment_url TEXT NOT NULL,
  segment_duration_seconds DECIMAL(10, 3),
  encryption_key_id UUID REFERENCES encryption_keys(id) ON DELETE SET NULL,
  encryption_iv TEXT, -- Initialization Vector en hex
  is_encrypted BOOLEAN DEFAULT true,
  resolution TEXT, -- 720p, 1080p, etc.
  bitrate_kbps INTEGER,
  codec TEXT DEFAULT 'H.264',
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(product_id, segment_index, resolution)
);

CREATE INDEX idx_video_hls_segments_product_id ON video_hls_segments(product_id);
CREATE INDEX idx_video_hls_segments_encryption_key ON video_hls_segments(encryption_key_id);

-- RLS
ALTER TABLE video_hls_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access segments for purchased products"
  ON video_hls_segments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM digital_inquiries di
      WHERE di.product_id = video_hls_segments.product_id
        AND di.user_id = auth.uid()
        AND di.payment_status = 'paid'
        AND di.status = 'completed'
        AND di.expires_at > now()
    )
  );

-- ----------------------------------------------------------------
-- 4. TABLE POUR PLAYREADY DRM LICENSES
-- ----------------------------------------------------------------
-- Gère les licences DRM pour PlayReady/Widevine
CREATE TABLE IF NOT EXISTS drm_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id TEXT NOT NULL UNIQUE,
  product_id UUID REFERENCES digital_products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  inquiry_id UUID REFERENCES digital_inquiries(id) ON DELETE CASCADE,
  drm_system TEXT NOT NULL CHECK (drm_system IN ('playready', 'widevine', 'fairplay')),
  license_url TEXT,
  key_id TEXT NOT NULL,
  content_key TEXT NOT NULL, -- Chiffré
  policy JSONB DEFAULT '{}'::jsonb, -- Politique de lecture (expiration, offline, etc.)
  device_limit INTEGER DEFAULT 3,
  issued_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT
);

CREATE INDEX idx_drm_licenses_license_id ON drm_licenses(license_id);
CREATE INDEX idx_drm_licenses_product_id ON drm_licenses(product_id);
CREATE INDEX idx_drm_licenses_user_id ON drm_licenses(user_id);
CREATE INDEX idx_drm_licenses_inquiry_id ON drm_licenses(inquiry_id);
CREATE INDEX idx_drm_licenses_expires_at ON drm_licenses(expires_at);
CREATE INDEX idx_drm_licenses_revoked ON drm_licenses(is_revoked) WHERE is_revoked = false;

-- RLS
ALTER TABLE drm_licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own licenses"
  ON drm_licenses
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can manage licenses"
  ON drm_licenses
  FOR ALL
  USING (true);

-- ----------------------------------------------------------------
-- 5. TABLE POUR STORAGE BUCKETS ENCRYPTION METADATA
-- ----------------------------------------------------------------
-- Track quel fichier est chiffré et avec quelle clé
CREATE TABLE IF NOT EXISTS storage_encryption_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  encryption_key_id UUID REFERENCES encryption_keys(id) ON DELETE SET NULL,
  encryption_algorithm TEXT DEFAULT 'AES-256-GCM',
  is_encrypted BOOLEAN DEFAULT true,
  encrypted_at TIMESTAMPTZ DEFAULT now(),
  file_size_bytes BIGINT,
  file_hash_sha256 TEXT, -- Pour intégrité

  UNIQUE(bucket_name, file_path)
);

CREATE INDEX idx_storage_encryption_bucket ON storage_encryption_metadata(bucket_name);
CREATE INDEX idx_storage_encryption_key ON storage_encryption_metadata(encryption_key_id);

-- RLS
ALTER TABLE storage_encryption_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view encryption metadata"
  ON storage_encryption_metadata
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- ----------------------------------------------------------------
-- 6. CRÉER LES STORAGE BUCKETS SÉCURISÉS
-- ----------------------------------------------------------------
-- Note: Ces buckets doivent être créés via l'interface Supabase ou API

-- digital-products-encrypted: Fichiers chiffrés (privé)
-- digital-products-watermarked: Fichiers avec watermark (privé)
-- video-hls-segments: Segments vidéo HLS (privé, signed URLs uniquement)

-- ----------------------------------------------------------------
-- 7. FONCTION POUR GÉNÉRER UNE LICENCE DRM
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_drm_license(
  p_product_id UUID,
  p_user_id UUID,
  p_inquiry_id UUID,
  p_drm_system TEXT DEFAULT 'playready',
  p_expires_in_hours INTEGER DEFAULT 48
)
RETURNS TABLE (
  license_id TEXT,
  license_url TEXT,
  key_id TEXT,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_license_id TEXT;
  v_key_id TEXT;
  v_content_key TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Générer des IDs uniques
  v_license_id := gen_random_uuid()::TEXT;
  v_key_id := gen_random_uuid()::TEXT;

  -- Générer une clé de contenu (32 bytes hex)
  v_content_key := encode(gen_random_bytes(32), 'hex');

  -- Calculer expiration
  v_expires_at := now() + (p_expires_in_hours || ' hours')::INTERVAL;

  -- Insérer la licence
  INSERT INTO drm_licenses (
    license_id,
    product_id,
    user_id,
    inquiry_id,
    drm_system,
    key_id,
    content_key,
    expires_at,
    policy
  ) VALUES (
    v_license_id,
    p_product_id,
    p_user_id,
    p_inquiry_id,
    p_drm_system,
    v_key_id,
    v_content_key,
    v_expires_at,
    jsonb_build_object(
      'allow_offline', false,
      'allow_airplay', false,
      'allow_screenshot', false
    )
  );

  -- Générer l'URL de licence
  RETURN QUERY SELECT
    v_license_id,
    format('%s/functions/v1/drm-license?license_id=%s',
      current_setting('app.settings.supabase_url', true),
      v_license_id
    ),
    v_key_id,
    v_expires_at;
END;
$$;

-- ----------------------------------------------------------------
-- 8. FONCTION POUR VÉRIFIER UNE LICENCE DRM
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION verify_drm_license(
  p_license_id TEXT,
  p_device_fingerprint TEXT DEFAULT NULL
)
RETURNS TABLE (
  is_valid BOOLEAN,
  key_id TEXT,
  content_key TEXT,
  policy JSONB,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_license RECORD;
BEGIN
  -- Récupérer la licence
  SELECT
    dl.key_id,
    dl.content_key,
    dl.policy,
    dl.expires_at,
    dl.is_revoked,
    dl.device_limit,
    di.download_token
  INTO v_license
  FROM drm_licenses dl
  JOIN digital_inquiries di ON di.id = dl.inquiry_id
  WHERE dl.license_id = p_license_id;

  -- Vérifier existence
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, NULL::JSONB, 'License not found';
    RETURN;
  END IF;

  -- Vérifier révocation
  IF v_license.is_revoked THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, NULL::JSONB, 'License revoked';
    RETURN;
  END IF;

  -- Vérifier expiration
  IF v_license.expires_at < now() THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, NULL::JSONB, 'License expired';
    RETURN;
  END IF;

  -- ✅ Licence valide
  RETURN QUERY SELECT
    true,
    v_license.key_id,
    v_license.content_key,
    v_license.policy,
    NULL::TEXT;
END;
$$;

-- ----------------------------------------------------------------
-- 9. FONCTION DE ROTATION AUTOMATIQUE DES CLÉS
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION rotate_encryption_keys()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rotated_count INTEGER := 0;
  v_key RECORD;
BEGIN
  -- Parcourir les clés qui nécessitent une rotation
  FOR v_key IN
    SELECT id, product_id, user_id, key_version
    FROM encryption_keys
    WHERE is_active = true
      AND (
        (rotation_policy = 'auto_30d' AND created_at < now() - interval '30 days')
        OR (rotation_policy = 'auto_90d' AND created_at < now() - interval '90 days')
        OR (rotation_policy = 'auto_1y' AND created_at < now() - interval '1 year')
      )
  LOOP
    -- Désactiver l'ancienne clé
    UPDATE encryption_keys
    SET is_active = false, updated_at = now()
    WHERE id = v_key.id;

    -- Créer une nouvelle clé
    INSERT INTO encryption_keys (
      product_id,
      user_id,
      key_hash,
      algorithm,
      key_version,
      is_active
    ) VALUES (
      v_key.product_id,
      v_key.user_id,
      encode(gen_random_bytes(32), 'hex'),
      'AES-256-GCM',
      v_key.key_version + 1,
      true
    );

    v_rotated_count := v_rotated_count + 1;
  END LOOP;

  -- Logger l'événement
  IF v_rotated_count > 0 THEN
    INSERT INTO security_audit_logs (
      event_type,
      metadata,
      severity
    ) VALUES (
      'file_encrypted',
      jsonb_build_object('rotated_keys', v_rotated_count),
      'info'
    );
  END IF;

  RETURN v_rotated_count;
END;
$$;

-- ----------------------------------------------------------------
-- 10. GRANTS
-- ----------------------------------------------------------------
GRANT EXECUTE ON FUNCTION generate_drm_license TO authenticated;
GRANT EXECUTE ON FUNCTION verify_drm_license TO authenticated;
GRANT EXECUTE ON FUNCTION rotate_encryption_keys TO postgres;

-- ================================================================
-- FIN DE LA MIGRATION PHASE 2 & 3
-- ================================================================

-- Note: Pour activer l'encryption at rest dans Supabase:
-- 1. Activer Supabase Vault dans le dashboard
-- 2. Configurer les politiques de rotation des clés
-- 3. Migrer les fichiers existants vers des versions chiffrées
