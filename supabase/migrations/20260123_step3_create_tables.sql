-- ================================================================
-- ÉTAPE 3 : Créer les tables et insérer les données
-- Exécuter APRÈS les étapes 1 et 2
-- IMPORTANT: L'enum doit avoir toutes ses valeurs AVANT d'exécuter ce fichier
-- ================================================================

DO $$
DECLARE
    val_count INTEGER;
BEGIN
    -- Vérifier que l'enum a bien toutes les valeurs
    SELECT COUNT(*) INTO val_count
    FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan');
    
    IF val_count < 7 THEN
        RAISE EXCEPTION 'L''enum subscription_plan n''a que % valeurs (7 requises). Exécutez d''abord les étapes 1 et 2.', val_count;
    END IF;
    
    RAISE NOTICE '✅ Enum vérifié : % valeurs', val_count;
END $$;

-- ================================================================
-- 1. Table: commission_tiers (Configuration des commissions)
-- ================================================================
CREATE TABLE IF NOT EXISTS commission_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type subscription_plan NOT NULL UNIQUE,
  monthly_fee_fcfa INTEGER DEFAULT 0,
  commission_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  setup_fee_fcfa INTEGER DEFAULT 0,
  min_commission_fcfa INTEGER DEFAULT 0,
  description TEXT,
  is_legacy BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN RAISE NOTICE '✅ Table commission_tiers créée'; END $$;

-- Insérer les données
INSERT INTO commission_tiers (plan_type, monthly_fee_fcfa, commission_percentage, setup_fee_fcfa, min_commission_fcfa, description, is_legacy) VALUES
('free'::subscription_plan, 0, 3, 0, 0, 'Plan gratuit legacy - Commission 3%', true),
('business'::subscription_plan, 13000, 1, 0, 0, 'Plan Business legacy - 13K FCFA/mois + 1%', true),
('magic'::subscription_plan, 26000, 1, 0, 0, 'Plan Magic legacy - 26K FCFA/mois + 1%', true),
('essentiel'::subscription_plan, 0, 0, 0, 0, 'Gratuit - Viralité et adoption massive', false),
('connexions'::subscription_plan, 15000, 0, 0, 0, 'Capital relationnel - RDV + CRM', false),
('commerce'::subscription_plan, 0, 5, 0, 0, 'E-commerce - 5% commission uniquement', false),
('opere'::subscription_plan, 0, 10, 0, 100000, 'Premium - 10% commission + setup variable', false)
ON CONFLICT (plan_type) DO UPDATE SET
    monthly_fee_fcfa = EXCLUDED.monthly_fee_fcfa,
    commission_percentage = EXCLUDED.commission_percentage,
    setup_fee_fcfa = EXCLUDED.setup_fee_fcfa,
    min_commission_fcfa = EXCLUDED.min_commission_fcfa,
    description = EXCLUDED.description,
    is_legacy = EXCLUDED.is_legacy,
    updated_at = now();

DO $$ BEGIN RAISE NOTICE '✅ Données commission_tiers insérées'; END $$;

-- ================================================================
-- 2. Table: opere_setup_packages (Packages Setup pour OPÉRÉ)
-- ================================================================
CREATE TABLE IF NOT EXISTS opere_setup_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price_fcfa INTEGER NOT NULL,
  price_eur INTEGER NOT NULL,
  duration TEXT NOT NULL,
  includes JSONB NOT NULL DEFAULT '[]'::jsonb,
  excludes JSONB DEFAULT '[]'::jsonb,
  recommended TEXT,
  is_popular BOOLEAN DEFAULT false,
  target_revenue_min INTEGER,
  target_revenue_max INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO opere_setup_packages (package_id, name, price_fcfa, price_eur, duration, includes, is_popular, recommended, target_revenue_min, target_revenue_max) VALUES
('standard', 'Standard', 50000, 7600, '2-3 jours',
  '["Configuration compte Bööh complet", "Import produits/services (jusqu''à 50)", "Configuration méthodes de paiement", "Formation utilisateur (2 heures)", "Documentation complète", "Support email 7 jours"]'::jsonb,
  false, 'Pour démarrage rapide', 0, 1000000),
('business', 'Business', 150000, 22900, '1 semaine',
  '["✅ Tout Standard", "Stratégie digitale personnalisée", "Setup Google Analytics + Meta Pixel", "Configuration campagnes ads (Facebook/Instagram)", "Design carte visite personnalisé premium", "Formation équipe complète (5 heures)", "Support prioritaire 30 jours", "Audit initial de votre présence digitale"]'::jsonb,
  true, 'Recommandé pour PME et boutiques', 1000000, 5000000),
('premium', 'Premium', 300000, 45800, '2-3 semaines',
  '["✅ Tout Business", "Campagne marketing de lancement complète", "Création de contenu professionnel (10 posts)", "Setup email marketing + automation", "Intégrations custom (ERP, CRM externe)", "Audit SEO complet + optimisation", "Formation avancée équipe (10 heures)", "Account manager dédié 90 jours", "Reporting mensuel personnalisé"]'::jsonb,
  false, 'Pour grandes entreprises établies', 5000000, 10000000),
('enterprise', 'Enterprise', 500000, 76300, '1 mois',
  '["✅ Tout Premium", "Stratégie growth marketing sur 3 mois", "Campagne multi-canaux (Social, Email, SEO)", "Création contenu avancé (vidéos, photos pro)", "Marketing automation complet", "Intégrations complexes et API custom", "White label complet (votre marque)", "Consulting stratégique trimestriel", "Account manager dédié 12 mois", "Support 24/7 prioritaire", "SLA 99.9% garanti"]'::jsonb,
  false, 'Pour corporations et franchises', 10000000, null)
ON CONFLICT (package_id) DO UPDATE SET
  name = EXCLUDED.name,
  price_fcfa = EXCLUDED.price_fcfa,
  updated_at = now();

DO $$ BEGIN RAISE NOTICE '✅ Table opere_setup_packages créée et données insérées'; END $$;

-- ================================================================
-- 3. Autres tables
-- ================================================================

CREATE TABLE IF NOT EXISTS opere_setup_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  package_id TEXT REFERENCES opere_setup_packages(package_id) NOT NULL,
  amount_paid_fcfa INTEGER NOT NULL,
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
  payment_method TEXT,
  transaction_id TEXT,
  paid_at TIMESTAMPTZ,
  services_delivered JSONB DEFAULT '[]'::jsonb,
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  admin_notes TEXT,
  client_feedback TEXT,
  delivery_started_at TIMESTAMPTZ,
  delivery_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, package_id)
);

CREATE INDEX IF NOT EXISTS idx_opere_setup_user ON opere_setup_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_opere_setup_status ON opere_setup_payments(payment_status);

CREATE TABLE IF NOT EXISTS plan_revenue_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_type subscription_plan NOT NULL,
  month DATE NOT NULL,
  gross_revenue_fcfa INTEGER DEFAULT 0,
  commission_amount_fcfa INTEGER DEFAULT 0,
  monthly_fee_paid_fcfa INTEGER DEFAULT 0,
  setup_fee_paid_fcfa INTEGER DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  average_transaction_fcfa INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, month)
);

CREATE INDEX IF NOT EXISTS idx_revenue_tracking_user_month ON plan_revenue_tracking(user_id, month DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_tracking_plan ON plan_revenue_tracking(plan_type, month DESC);

CREATE TABLE IF NOT EXISTS subscription_migrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  from_plan subscription_plan NOT NULL,
  to_plan subscription_plan NOT NULL,
  migration_reason TEXT,
  migration_type TEXT CHECK (migration_type IN ('auto', 'user_choice', 'admin', 'incentive')) DEFAULT 'user_choice',
  incentive_applied TEXT,
  incentive_value_fcfa INTEGER DEFAULT 0,
  migrated_at TIMESTAMPTZ DEFAULT now(),
  incentive_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_migrations_user ON subscription_migrations(user_id, migrated_at DESC);

DO $$ BEGIN RAISE NOTICE '✅ Toutes les tables créées'; END $$;

-- ================================================================
-- 4. Fonctions
-- ================================================================

CREATE OR REPLACE FUNCTION has_paid_opere_setup(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM opere_setup_payments 
    WHERE user_id = user_uuid 
      AND payment_status = 'paid'
  );
END;
$$;

CREATE OR REPLACE FUNCTION get_plan_commission_config(plan subscription_plan)
RETURNS TABLE (
  monthly_fee INTEGER,
  commission_pct DECIMAL,
  min_commission INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ct.monthly_fee_fcfa,
    ct.commission_percentage,
    ct.min_commission_fcfa
  FROM commission_tiers ct
  WHERE ct.plan_type = plan;
END;
$$;

DO $$ BEGIN RAISE NOTICE '✅ Fonctions créées'; END $$;

-- ================================================================
-- 5. RLS Policies
-- ================================================================

ALTER TABLE commission_tiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Commission tiers readable by all" ON commission_tiers;
CREATE POLICY "Commission tiers readable by all" ON commission_tiers FOR SELECT TO authenticated, anon USING (true);

ALTER TABLE opere_setup_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Setup packages readable by all" ON opere_setup_packages;
CREATE POLICY "Setup packages readable by all" ON opere_setup_packages FOR SELECT TO authenticated, anon USING (true);

ALTER TABLE opere_setup_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own setup payments" ON opere_setup_payments;
DROP POLICY IF EXISTS "Users can insert own setup payments" ON opere_setup_payments;
CREATE POLICY "Users can view own setup payments" ON opere_setup_payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own setup payments" ON opere_setup_payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

ALTER TABLE plan_revenue_tracking ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own revenue tracking" ON plan_revenue_tracking;
CREATE POLICY "Users can view own revenue tracking" ON plan_revenue_tracking FOR SELECT TO authenticated USING (auth.uid() = user_id);

ALTER TABLE subscription_migrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own migrations" ON subscription_migrations;
CREATE POLICY "Users can view own migrations" ON subscription_migrations FOR SELECT TO authenticated USING (auth.uid() = user_id);

DO $$ BEGIN RAISE NOTICE '✅ RLS Policies activées'; END $$;

-- ================================================================
-- 6. Triggers
-- ================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS update_commission_tiers_updated_at ON commission_tiers;
  CREATE TRIGGER update_commission_tiers_updated_at BEFORE UPDATE ON commission_tiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
  DROP TRIGGER IF EXISTS update_opere_packages_updated_at ON opere_setup_packages;
  CREATE TRIGGER update_opere_packages_updated_at BEFORE UPDATE ON opere_setup_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
  DROP TRIGGER IF EXISTS update_opere_payments_updated_at ON opere_setup_payments;
  CREATE TRIGGER update_opere_payments_updated_at BEFORE UPDATE ON opere_setup_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
  DROP TRIGGER IF EXISTS update_revenue_tracking_updated_at ON plan_revenue_tracking;
  CREATE TRIGGER update_revenue_tracking_updated_at BEFORE UPDATE ON plan_revenue_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
  RAISE NOTICE '✅ Triggers créés';
END $$;

-- ================================================================
-- FIN
-- ================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=================================================';
    RAISE NOTICE '✅✅✅ MIGRATION COMPLÈTE RÉUSSIE ✅✅✅';
    RAISE NOTICE '=================================================';
    RAISE NOTICE '📊 Enum subscription_plan: 7 valeurs';
    RAISE NOTICE '📋 Tables créées: 5';
    RAISE NOTICE '🔧 Fonctions créées: 2';
    RAISE NOTICE '🔒 RLS policies activées';
    RAISE NOTICE '=================================================';
END $$;
