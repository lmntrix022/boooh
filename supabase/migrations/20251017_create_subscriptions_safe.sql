-- Migration SAFE pour créer la table des abonnements utilisateurs
-- Vérifie l'existence avant de créer chaque élément

-- Table des abonnements utilisateurs
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'business', 'magic')),
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'cancelled', 'trial')) DEFAULT 'active',
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  addons JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index (avec vérification)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_subscriptions_user_id') THEN
    CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_subscriptions_status') THEN
    CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_subscriptions_plan_type') THEN
    CREATE INDEX idx_user_subscriptions_plan_type ON user_subscriptions(plan_type);
  END IF;
END $$;

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_user_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at (DROP si existe puis CREATE)
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_user_subscriptions_updated_at();

-- RLS Policies
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop et recréer les policies pour être sûr
DROP POLICY IF EXISTS "Users can view their own subscription" ON user_subscriptions;
CREATE POLICY "Users can view their own subscription"
ON user_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON user_subscriptions;
CREATE POLICY "Admins can view all subscriptions"
ON user_subscriptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update all subscriptions" ON user_subscriptions;
CREATE POLICY "Admins can update all subscriptions"
ON user_subscriptions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- IMPORTANT: Policy pour permettre au trigger d'insérer
DROP POLICY IF EXISTS "Allow trigger to insert default subscriptions" ON user_subscriptions;
CREATE POLICY "Allow trigger to insert default subscriptions"
ON user_subscriptions
FOR INSERT
WITH CHECK (true);

-- Fonction pour créer un abonnement FREE par défaut
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_subscriptions (user_id, plan_type, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer l'abonnement FREE automatiquement
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_default_subscription();

-- Fonction helper pour vérifier l'accès aux fonctionnalités
CREATE OR REPLACE FUNCTION has_feature_access(
  feature_name TEXT,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan TEXT;
  user_addons JSONB;
BEGIN
  SELECT plan_type, addons INTO user_plan, user_addons
  FROM user_subscriptions
  WHERE user_id = p_user_id AND status = 'active';

  IF user_plan IS NULL THEN
    user_plan := 'free';
    user_addons := '[]'::jsonb;
  END IF;

  CASE feature_name
    WHEN 'ecommerce' THEN
      RETURN user_plan IN ('business', 'magic');
    WHEN 'portfolio' THEN
      RETURN user_plan IN ('business', 'magic');
    WHEN 'invoicing' THEN
      RETURN user_plan IN ('business', 'magic');
    WHEN 'stock' THEN
      RETURN user_plan IN ('business', 'magic');
    WHEN 'appointments' THEN
      RETURN user_plan IN ('business', 'magic');
    WHEN 'crm' THEN
      RETURN user_plan = 'magic';
    WHEN 'map' THEN
      RETURN user_plan IN ('business', 'magic');
    WHEN 'advanced_analytics' THEN
      RETURN user_plan IN ('business', 'magic');
    WHEN 'custom_themes' THEN
      RETURN user_plan IN ('business', 'magic');
    WHEN 'drm_protection' THEN
      RETURN user_plan = 'magic' OR (user_plan = 'business' AND user_addons ? 'pack_createur');
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires pour documentation
COMMENT ON TABLE user_subscriptions IS 'Abonnements utilisateurs avec plans FREE, BUSINESS, MAGIC';
COMMENT ON COLUMN user_subscriptions.plan_type IS 'Type de plan: free, business, magic';
COMMENT ON COLUMN user_subscriptions.status IS 'Statut: active, expired, cancelled, trial';
COMMENT ON COLUMN user_subscriptions.addons IS 'Array JSON des add-ons actifs';
COMMENT ON FUNCTION has_feature_access IS 'Vérifie si un utilisateur a accès à une fonctionnalité basée sur son plan';
