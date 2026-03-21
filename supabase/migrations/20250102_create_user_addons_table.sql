-- Migration: Create user_addons table for persistent addon storage
-- Date: 2025-01-02
-- Purpose: P2 - Persist user addons instead of storing in memory

CREATE TABLE IF NOT EXISTS public.user_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    addon_type VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    
    -- Lifecycle
    purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE, -- NULL = perpetual
    auto_renew BOOLEAN DEFAULT false,
    
    -- Metadata
    payment_id UUID REFERENCES public.payment_history(id) ON DELETE SET NULL,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_addons_user_id ON user_addons(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addons_expires_at ON user_addons(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_addons_addon_type ON user_addons(addon_type);

-- Enable RLS
ALTER TABLE user_addons ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own addons" ON user_addons;
CREATE POLICY "Users can view own addons"
  ON user_addons FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage addons" ON user_addons;
CREATE POLICY "Admins can manage addons"
  ON user_addons FOR ALL
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_addons_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_addons_timestamp_trigger ON user_addons;
CREATE TRIGGER update_user_addons_timestamp_trigger
  BEFORE UPDATE ON user_addons
  FOR EACH ROW
  EXECUTE FUNCTION update_user_addons_timestamp();

-- View to get only ACTIVE (non-expired) addons for a user
CREATE OR REPLACE VIEW user_active_addons AS
SELECT
    id,
    user_id,
    addon_type,
    quantity,
    purchased_at,
    expires_at,
    auto_renew,
    payment_id,
    notes,
    created_at,
    updated_at
FROM user_addons
WHERE expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP;

-- Function to get active addons for a user
CREATE OR REPLACE FUNCTION get_user_active_addons(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    addon_type VARCHAR,
    quantity INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT ua.id, ua.addon_type, ua.quantity
    FROM user_addons ua
    WHERE ua.user_id = p_user_id
      AND (ua.expires_at IS NULL OR ua.expires_at > CURRENT_TIMESTAMP);
END;
$$ LANGUAGE plpgsql;

-- Function to add an addon
CREATE OR REPLACE FUNCTION add_user_addon(
    p_user_id UUID,
    p_addon_type VARCHAR,
    p_quantity INTEGER DEFAULT 1,
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_payment_id UUID DEFAULT NULL
)
RETURNS user_addons AS $$
DECLARE
    v_addon user_addons;
BEGIN
    INSERT INTO user_addons (user_id, addon_type, quantity, expires_at, payment_id)
    VALUES (p_user_id, p_addon_type, p_quantity, p_expires_at, p_payment_id)
    RETURNING * INTO v_addon;
    
    RETURN v_addon;
END;
$$ LANGUAGE plpgsql;

-- Function to remove/expire an addon
CREATE OR REPLACE FUNCTION expire_user_addon(p_addon_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE user_addons
    SET expires_at = CURRENT_TIMESTAMP
    WHERE id = p_addon_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has specific addon
CREATE OR REPLACE FUNCTION user_has_addon(
    p_user_id UUID,
    p_addon_type VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM user_addons
    WHERE user_id = p_user_id
      AND addon_type = p_addon_type
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP);
    
    RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Migration comment
COMMENT ON TABLE user_addons IS 'Stores purchased addons for users with expiration tracking';
COMMENT ON COLUMN user_addons.expires_at IS 'NULL means perpetual (one-time purchase), otherwise expires at specified time';
COMMENT ON COLUMN user_addons.auto_renew IS 'If TRUE, addon will automatically renew on expiration';

