-- ================================================================
-- 🔐 PHASE 1 - DRM SÉCURITÉ CRITIQUE
-- ================================================================
-- Date: 2025-01-24
-- Description: Implémentation des protections DRM critiques
--   1. Table d'audit de sécurité
--   2. Table des clés de chiffrement
--   3. Table de révocation de devices
--   4. Table de rate limiting
--   5. Amélioration des tokens de téléchargement
-- ================================================================

-- ----------------------------------------------------------------
-- 1. TABLE D'AUDIT DE SÉCURITÉ
-- ----------------------------------------------------------------
-- Enregistre tous les événements de sécurité pour forensics
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'token_generated',
    'token_validated',
    'token_expired',
    'file_encrypted',
    'file_decrypted',
    'file_downloaded',
    'device_registered',
    'device_revoked',
    'watermark_applied',
    'unauthorized_access',
    'rate_limit_exceeded',
    'antivirus_scan',
    'suspicious_activity'
  )),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  inquiry_id UUID REFERENCES digital_inquiries(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour recherche rapide par type d'événement
CREATE INDEX idx_security_audit_logs_event_type ON security_audit_logs(event_type);
CREATE INDEX idx_security_audit_logs_user_id ON security_audit_logs(user_id);
CREATE INDEX idx_security_audit_logs_created_at ON security_audit_logs(created_at DESC);
CREATE INDEX idx_security_audit_logs_severity ON security_audit_logs(severity);

-- RLS: Admins seulement
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs"
  ON security_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- ----------------------------------------------------------------
-- 2. TABLE DES CLÉS DE CHIFFREMENT
-- ----------------------------------------------------------------
-- Stocke les clés de chiffrement pour chaque produit
-- Note: Dans un système production, utiliser Supabase Vault
CREATE TABLE IF NOT EXISTS encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES digital_products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL, -- Clé chiffrée (idéalement dans Vault)
  algorithm TEXT NOT NULL DEFAULT 'AES-256-GCM',
  key_version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(product_id, key_version)
);

CREATE INDEX idx_encryption_keys_product_id ON encryption_keys(product_id);
CREATE INDEX idx_encryption_keys_user_id ON encryption_keys(user_id);
CREATE INDEX idx_encryption_keys_active ON encryption_keys(is_active) WHERE is_active = true;

-- RLS: Propriétaires uniquement
ALTER TABLE encryption_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their encryption keys"
  ON encryption_keys
  FOR ALL
  USING (user_id = auth.uid());

-- ----------------------------------------------------------------
-- 3. TABLE DE RÉVOCATION DE DEVICES
-- ----------------------------------------------------------------
-- Permet de révoquer l'accès à des devices spécifiques
CREATE TABLE IF NOT EXISTS device_revocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_fingerprint TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  inquiry_id UUID REFERENCES digital_inquiries(id) ON DELETE CASCADE,
  reason TEXT,
  revoked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ, -- Révocation temporaire
  is_active BOOLEAN DEFAULT true,

  UNIQUE(device_fingerprint, inquiry_id)
);

CREATE INDEX idx_device_revocations_fingerprint ON device_revocations(device_fingerprint);
CREATE INDEX idx_device_revocations_user_id ON device_revocations(user_id);
CREATE INDEX idx_device_revocations_active ON device_revocations(is_active) WHERE is_active = true;

-- RLS
ALTER TABLE device_revocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can revoke their own devices"
  ON device_revocations
  FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Admins can revoke any device"
  ON device_revocations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- ----------------------------------------------------------------
-- 4. TABLE DE RATE LIMITING
-- ----------------------------------------------------------------
-- Track des requêtes pour prévenir brute force et abus
CREATE TABLE IF NOT EXISTS rate_limit_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  window_end TIMESTAMPTZ DEFAULT (now() + interval '1 minute'),
  is_blocked BOOLEAN DEFAULT false,
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(ip_address, endpoint, window_start)
);

CREATE INDEX idx_rate_limit_tracking_ip ON rate_limit_tracking(ip_address);
CREATE INDEX idx_rate_limit_tracking_window ON rate_limit_tracking(window_end);
CREATE INDEX idx_rate_limit_tracking_blocked ON rate_limit_tracking(is_blocked) WHERE is_blocked = true;

-- Pas de RLS (table système)
ALTER TABLE rate_limit_tracking ENABLE ROW LEVEL SECURITY;

-- Fonction pour nettoyer les anciennes entrées (appelée par cron)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limit_entries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM rate_limit_tracking
  WHERE window_end < now() - interval '1 hour';
END;
$$;

-- ----------------------------------------------------------------
-- 5. AMÉLIORATION DE LA TABLE digital_inquiries
-- ----------------------------------------------------------------
-- Ajouter des colonnes pour le tracking avancé
ALTER TABLE digital_inquiries
  ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_downloads INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS last_download_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS device_limit INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS encryption_key_id UUID REFERENCES encryption_keys(id) ON DELETE SET NULL;

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_digital_inquiries_download_token ON digital_inquiries(download_token);
CREATE INDEX IF NOT EXISTS idx_digital_inquiries_expires_at ON digital_inquiries(expires_at);
CREATE INDEX IF NOT EXISTS idx_digital_inquiries_payment_status ON digital_inquiries(payment_status);

-- ----------------------------------------------------------------
-- 6. TABLE DES DEVICES AUTORISÉS
-- ----------------------------------------------------------------
-- Track des devices qui ont accès à un produit
CREATE TABLE IF NOT EXISTS authorized_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_fingerprint TEXT NOT NULL,
  inquiry_id UUID REFERENCES digital_inquiries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_info JSONB DEFAULT '{}'::jsonb,
  first_access_at TIMESTAMPTZ DEFAULT now(),
  last_access_at TIMESTAMPTZ DEFAULT now(),
  access_count INTEGER DEFAULT 1,
  is_revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMPTZ,

  UNIQUE(device_fingerprint, inquiry_id)
);

CREATE INDEX idx_authorized_devices_fingerprint ON authorized_devices(device_fingerprint);
CREATE INDEX idx_authorized_devices_inquiry_id ON authorized_devices(inquiry_id);
CREATE INDEX idx_authorized_devices_user_id ON authorized_devices(user_id);
CREATE INDEX idx_authorized_devices_revoked ON authorized_devices(is_revoked) WHERE is_revoked = false;

-- RLS
ALTER TABLE authorized_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their authorized devices"
  ON authorized_devices
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert authorized devices"
  ON authorized_devices
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can revoke their devices"
  ON authorized_devices
  FOR UPDATE
  USING (user_id = auth.uid());

-- ----------------------------------------------------------------
-- 7. FONCTION DE VALIDATION DE TOKEN SÉCURISÉE
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_download_token_secure(
  p_download_token TEXT,
  p_device_fingerprint TEXT DEFAULT NULL
)
RETURNS TABLE (
  is_valid BOOLEAN,
  inquiry_id UUID,
  product_id UUID,
  file_url TEXT,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inquiry RECORD;
  v_device_count INTEGER;
  v_is_revoked BOOLEAN;
BEGIN
  -- 1. Récupérer l'inquiry
  SELECT
    di.id,
    di.product_id,
    di.expires_at,
    di.status,
    di.payment_status,
    di.download_count,
    di.max_downloads,
    di.device_limit,
    dp.file_url
  INTO v_inquiry
  FROM digital_inquiries di
  JOIN digital_products dp ON dp.id = di.product_id
  WHERE di.download_token = p_download_token;

  -- 2. Vérifier existence
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::TEXT, 'Invalid token';
    RETURN;
  END IF;

  -- 3. Vérifier expiration
  IF v_inquiry.expires_at < now() THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::TEXT, 'Token expired';
    RETURN;
  END IF;

  -- 4. Vérifier statut de paiement
  IF v_inquiry.payment_status != 'paid' OR v_inquiry.status != 'completed' THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::TEXT, 'Payment not completed';
    RETURN;
  END IF;

  -- 5. Vérifier limite de téléchargements
  IF v_inquiry.download_count >= v_inquiry.max_downloads THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::TEXT, 'Download limit exceeded';
    RETURN;
  END IF;

  -- 6. Vérifier device (si fourni)
  IF p_device_fingerprint IS NOT NULL THEN
    -- Vérifier si device est révoqué
    SELECT dr.is_active INTO v_is_revoked
    FROM device_revocations dr
    WHERE dr.device_fingerprint = p_device_fingerprint
      AND dr.inquiry_id = v_inquiry.id
      AND dr.is_active = true
      AND (dr.expires_at IS NULL OR dr.expires_at > now());

    IF v_is_revoked THEN
      RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::TEXT, 'Device revoked';
      RETURN;
    END IF;

    -- Vérifier limite de devices
    SELECT COUNT(DISTINCT device_fingerprint) INTO v_device_count
    FROM authorized_devices
    WHERE inquiry_id = v_inquiry.id
      AND is_revoked = false;

    IF v_device_count >= v_inquiry.device_limit THEN
      -- Vérifier si ce device est déjà autorisé
      IF NOT EXISTS (
        SELECT 1 FROM authorized_devices
        WHERE inquiry_id = v_inquiry.id
          AND device_fingerprint = p_device_fingerprint
          AND is_revoked = false
      ) THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::TEXT, 'Device limit exceeded';
        RETURN;
      END IF;
    END IF;
  END IF;

  -- ✅ Token valide
  RETURN QUERY SELECT
    true,
    v_inquiry.id,
    v_inquiry.product_id,
    v_inquiry.file_url,
    NULL::TEXT;
END;
$$;

-- ----------------------------------------------------------------
-- 8. FONCTION POUR ENREGISTRER UN TÉLÉCHARGEMENT
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION register_download_event(
  p_inquiry_id UUID,
  p_device_fingerprint TEXT,
  p_ip_address TEXT,
  p_user_agent TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Incrémenter le compteur de téléchargements
  UPDATE digital_inquiries
  SET
    download_count = download_count + 1,
    last_download_at = now(),
    updated_at = now()
  WHERE id = p_inquiry_id;

  -- Enregistrer ou mettre à jour le device
  INSERT INTO authorized_devices (
    device_fingerprint,
    inquiry_id,
    user_id,
    device_info,
    first_access_at,
    last_access_at,
    access_count
  )
  SELECT
    p_device_fingerprint,
    p_inquiry_id,
    di.user_id,
    jsonb_build_object(
      'ip_address', p_ip_address,
      'user_agent', p_user_agent
    ),
    now(),
    now(),
    1
  FROM digital_inquiries di
  WHERE di.id = p_inquiry_id
  ON CONFLICT (device_fingerprint, inquiry_id)
  DO UPDATE SET
    last_access_at = now(),
    access_count = authorized_devices.access_count + 1;

  RETURN true;
END;
$$;

-- ----------------------------------------------------------------
-- 9. TRIGGER POUR AUDIT AUTOMATIQUE
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_inquiry_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Logger les changements importants
    IF OLD.status != NEW.status OR OLD.payment_status != NEW.payment_status THEN
      INSERT INTO security_audit_logs (
        event_type,
        user_id,
        inquiry_id,
        metadata,
        severity
      ) VALUES (
        'token_validated',
        NEW.user_id,
        NEW.id,
        jsonb_build_object(
          'old_status', OLD.status,
          'new_status', NEW.status,
          'old_payment_status', OLD.payment_status,
          'new_payment_status', NEW.payment_status
        ),
        'info'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_inquiry_changes
  AFTER UPDATE ON digital_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION log_inquiry_changes();

-- ----------------------------------------------------------------
-- 10. GRANT PERMISSIONS
-- ----------------------------------------------------------------
-- Permettre aux utilisateurs authentifiés d'appeler les fonctions
GRANT EXECUTE ON FUNCTION validate_download_token_secure TO authenticated;
GRANT EXECUTE ON FUNCTION register_download_event TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_rate_limit_entries TO postgres;

-- ================================================================
-- FIN DE LA MIGRATION PHASE 1
-- ================================================================
