-- ================================================================
-- Migration: Ajout des nouveaux plans de souscription
-- Date: 2026-01-23
-- Description: Ajout de ESSENTIEL, CONNEXIONS, COMMERCE, OPERE
--              tout en maintenant la compatibilité avec FREE, BUSINESS, MAGIC
-- ================================================================

-- 1. Créer ou mettre à jour l'enum subscription_plan
-- IMPORTANT : On s'assure que TOUTES les valeurs existent (anciennes + nouvelles)
DO $$ 
DECLARE
    enum_exists BOOLEAN;
BEGIN
    -- Vérifier si le type existe
    SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan') INTO enum_exists;
    
    IF NOT enum_exists THEN
        -- Créer le type avec toutes les valeurs (anciennes + nouvelles)
        CREATE TYPE subscription_plan AS ENUM (
            'free', 
            'business', 
            'magic',
            'essentiel',
            'connexions',
            'commerce',
            'opere'
        );
        RAISE NOTICE '✅ Enum subscription_plan créé avec toutes les valeurs';
    ELSE
        -- Le type existe déjà, vérifier et ajouter les valeurs manquantes
        RAISE NOTICE 'ℹ️ Enum subscription_plan existe déjà, ajout des nouvelles valeurs...';
        
        -- Ajouter 'free' si n'existe pas
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'free' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan')
        ) THEN
            ALTER TYPE subscription_plan ADD VALUE 'free';
            RAISE NOTICE '✅ Valeur free ajoutée';
        END IF;
        
        -- Ajouter 'business' si n'existe pas
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'business' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan')
        ) THEN
            ALTER TYPE subscription_plan ADD VALUE 'business';
            RAISE NOTICE '✅ Valeur business ajoutée';
        END IF;
        
        -- Ajouter 'magic' si n'existe pas
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'magic' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan')
        ) THEN
            ALTER TYPE subscription_plan ADD VALUE 'magic';
            RAISE NOTICE '✅ Valeur magic ajoutée';
        END IF;
        
        -- Ajouter 'essentiel' si n'existe pas
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'essentiel' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan')
        ) THEN
            ALTER TYPE subscription_plan ADD VALUE 'essentiel';
            RAISE NOTICE '✅ Valeur essentiel ajoutée';
        END IF;
        
        -- Ajouter 'connexions' si n'existe pas
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'connexions' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan')
        ) THEN
            ALTER TYPE subscription_plan ADD VALUE 'connexions';
            RAISE NOTICE '✅ Valeur connexions ajoutée';
        END IF;
        
        -- Ajouter 'commerce' si n'existe pas
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'commerce' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan')
        ) THEN
            ALTER TYPE subscription_plan ADD VALUE 'commerce';
            RAISE NOTICE '✅ Valeur commerce ajoutée';
        END IF;
        
        -- Ajouter 'opere' si n'existe pas
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'opere' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan')
        ) THEN
            ALTER TYPE subscription_plan ADD VALUE 'opere';
            RAISE NOTICE '✅ Valeur opere ajoutée';
        END IF;
    END IF;
    
    -- Afficher toutes les valeurs de l'enum pour confirmation
    RAISE NOTICE '📋 Valeurs de l''enum subscription_plan:';
    FOR rec IN 
        SELECT enumlabel 
        FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan')
        ORDER BY enumsortorder
    LOOP
        RAISE NOTICE '  - %', rec.enumlabel;
    END LOOP;
END $$;

-- ================================================================
-- 2. Table: commission_tiers (Configuration des commissions)
-- ================================================================
CREATE TABLE IF NOT EXISTS commission_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type subscription_plan NOT NULL UNIQUE,
  monthly_fee_fcfa INTEGER DEFAULT 0,
  commission_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  setup_fee_fcfa INTEGER DEFAULT 0,
  min_commission_fcfa INTEGER DEFAULT 0,
  description TEXT,
  is_legacy BOOLEAN DEFAULT false, -- Marque les anciens plans
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insérer la configuration des commissions
-- Utiliser DO block pour un meilleur contrôle des erreurs
DO $$
DECLARE
    plan_exists BOOLEAN;
BEGIN
    RAISE NOTICE '🔧 Début de l''insertion des configurations de commissions...';
    
    -- Vérifier que l'enum subscription_plan a bien toutes les valeurs nécessaires
    SELECT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel IN ('free', 'business', 'magic', 'essentiel', 'connexions', 'commerce', 'opere')
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan')
        GROUP BY enumtypid
        HAVING COUNT(*) >= 7
    ) INTO plan_exists;
    
    IF NOT plan_exists THEN
        RAISE EXCEPTION 'L''enum subscription_plan n''a pas toutes les valeurs requises';
    END IF;
    
    -- Legacy plans
    RAISE NOTICE '  Insertion du plan FREE...';
    INSERT INTO commission_tiers (plan_type, monthly_fee_fcfa, commission_percentage, setup_fee_fcfa, min_commission_fcfa, description, is_legacy) 
    VALUES ('free'::subscription_plan, 0, 3, 0, 0, 'Plan gratuit legacy - Commission 3%', true)
    ON CONFLICT (plan_type) DO UPDATE SET
        monthly_fee_fcfa = EXCLUDED.monthly_fee_fcfa,
        commission_percentage = EXCLUDED.commission_percentage,
        setup_fee_fcfa = EXCLUDED.setup_fee_fcfa,
        min_commission_fcfa = EXCLUDED.min_commission_fcfa,
        description = EXCLUDED.description,
        is_legacy = EXCLUDED.is_legacy,
        updated_at = now();
    
    INSERT INTO commission_tiers (plan_type, monthly_fee_fcfa, commission_percentage, setup_fee_fcfa, min_commission_fcfa, description, is_legacy) 
    VALUES ('business'::subscription_plan, 13000, 1, 0, 0, 'Plan Business legacy - 13K FCFA/mois + 1%', true)
    ON CONFLICT (plan_type) DO UPDATE SET
        monthly_fee_fcfa = EXCLUDED.monthly_fee_fcfa,
        commission_percentage = EXCLUDED.commission_percentage,
        setup_fee_fcfa = EXCLUDED.setup_fee_fcfa,
        min_commission_fcfa = EXCLUDED.min_commission_fcfa,
        description = EXCLUDED.description,
        is_legacy = EXCLUDED.is_legacy,
        updated_at = now();
    
    INSERT INTO commission_tiers (plan_type, monthly_fee_fcfa, commission_percentage, setup_fee_fcfa, min_commission_fcfa, description, is_legacy) 
    VALUES ('magic'::subscription_plan, 26000, 1, 0, 0, 'Plan Magic legacy - 26K FCFA/mois + 1%', true)
    ON CONFLICT (plan_type) DO UPDATE SET
        monthly_fee_fcfa = EXCLUDED.monthly_fee_fcfa,
        commission_percentage = EXCLUDED.commission_percentage,
        setup_fee_fcfa = EXCLUDED.setup_fee_fcfa,
        min_commission_fcfa = EXCLUDED.min_commission_fcfa,
        description = EXCLUDED.description,
        is_legacy = EXCLUDED.is_legacy,
        updated_at = now();
    
    -- Nouveaux plans
    INSERT INTO commission_tiers (plan_type, monthly_fee_fcfa, commission_percentage, setup_fee_fcfa, min_commission_fcfa, description, is_legacy) 
    VALUES ('essentiel'::subscription_plan, 0, 0, 0, 0, 'Gratuit - Viralité et adoption massive', false)
    ON CONFLICT (plan_type) DO UPDATE SET
        monthly_fee_fcfa = EXCLUDED.monthly_fee_fcfa,
        commission_percentage = EXCLUDED.commission_percentage,
        setup_fee_fcfa = EXCLUDED.setup_fee_fcfa,
        min_commission_fcfa = EXCLUDED.min_commission_fcfa,
        description = EXCLUDED.description,
        is_legacy = EXCLUDED.is_legacy,
        updated_at = now();
    
    INSERT INTO commission_tiers (plan_type, monthly_fee_fcfa, commission_percentage, setup_fee_fcfa, min_commission_fcfa, description, is_legacy) 
    VALUES ('connexions'::subscription_plan, 15000, 0, 0, 0, 'Capital relationnel - RDV + CRM', false)
    ON CONFLICT (plan_type) DO UPDATE SET
        monthly_fee_fcfa = EXCLUDED.monthly_fee_fcfa,
        commission_percentage = EXCLUDED.commission_percentage,
        setup_fee_fcfa = EXCLUDED.setup_fee_fcfa,
        min_commission_fcfa = EXCLUDED.min_commission_fcfa,
        description = EXCLUDED.description,
        is_legacy = EXCLUDED.is_legacy,
        updated_at = now();
    
    INSERT INTO commission_tiers (plan_type, monthly_fee_fcfa, commission_percentage, setup_fee_fcfa, min_commission_fcfa, description, is_legacy) 
    VALUES ('commerce'::subscription_plan, 0, 5, 0, 0, 'E-commerce - 5% commission uniquement', false)
    ON CONFLICT (plan_type) DO UPDATE SET
        monthly_fee_fcfa = EXCLUDED.monthly_fee_fcfa,
        commission_percentage = EXCLUDED.commission_percentage,
        setup_fee_fcfa = EXCLUDED.setup_fee_fcfa,
        min_commission_fcfa = EXCLUDED.min_commission_fcfa,
        description = EXCLUDED.description,
        is_legacy = EXCLUDED.is_legacy,
        updated_at = now();
    
    INSERT INTO commission_tiers (plan_type, monthly_fee_fcfa, commission_percentage, setup_fee_fcfa, min_commission_fcfa, description, is_legacy) 
    VALUES ('opere'::subscription_plan, 0, 10, 0, 100000, 'Premium - 10% commission + setup variable', false)
    ON CONFLICT (plan_type) DO UPDATE SET
        monthly_fee_fcfa = EXCLUDED.monthly_fee_fcfa,
        commission_percentage = EXCLUDED.commission_percentage,
        setup_fee_fcfa = EXCLUDED.setup_fee_fcfa,
        min_commission_fcfa = EXCLUDED.min_commission_fcfa,
        description = EXCLUDED.description,
        is_legacy = EXCLUDED.is_legacy,
        updated_at = now();
    
    RAISE NOTICE '✅ Configuration des commissions insérée avec succès';
END $$;

-- ================================================================
-- 3. Table: opere_setup_packages (Packages Setup pour OPÉRÉ)
-- ================================================================
CREATE TABLE IF NOT EXISTS opere_setup_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price_fcfa INTEGER NOT NULL,
  price_eur INTEGER NOT NULL, -- Prix en centimes EUR
  duration TEXT NOT NULL,
  includes JSONB NOT NULL DEFAULT '[]'::jsonb,
  excludes JSONB DEFAULT '[]'::jsonb,
  recommended TEXT,
  is_popular BOOLEAN DEFAULT false,
  target_revenue_min INTEGER, -- CA minimum recommandé (FCFA)
  target_revenue_max INTEGER, -- CA maximum recommandé (FCFA)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insérer les packages Opéré
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
  price_eur = EXCLUDED.price_eur,
  duration = EXCLUDED.duration,
  includes = EXCLUDED.includes,
  is_popular = EXCLUDED.is_popular,
  recommended = EXCLUDED.recommended,
  target_revenue_min = EXCLUDED.target_revenue_min,
  target_revenue_max = EXCLUDED.target_revenue_max,
  updated_at = now();

-- ================================================================
-- 4. Table: opere_setup_payments (Tracking des setup fees)
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
  
  -- Tracking de la complétion des services
  services_delivered JSONB DEFAULT '[]'::jsonb,
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  
  -- Notes et suivi
  admin_notes TEXT,
  client_feedback TEXT,
  delivery_started_at TIMESTAMPTZ,
  delivery_completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, package_id)
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_opere_setup_user ON opere_setup_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_opere_setup_status ON opere_setup_payments(payment_status);

-- ================================================================
-- 5. Table: plan_revenue_tracking (Tracking des revenus par plan)
-- ================================================================
CREATE TABLE IF NOT EXISTS plan_revenue_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_type subscription_plan NOT NULL,
  month DATE NOT NULL, -- Premier jour du mois
  
  -- Revenus
  gross_revenue_fcfa INTEGER DEFAULT 0, -- CA brut du client
  commission_amount_fcfa INTEGER DEFAULT 0, -- Commission prélevée
  monthly_fee_paid_fcfa INTEGER DEFAULT 0, -- Abonnement mensuel payé
  setup_fee_paid_fcfa INTEGER DEFAULT 0, -- Setup payé ce mois
  
  -- Stats
  transaction_count INTEGER DEFAULT 0,
  average_transaction_fcfa INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, month)
);

-- Index pour analytics
CREATE INDEX IF NOT EXISTS idx_revenue_tracking_user_month ON plan_revenue_tracking(user_id, month DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_tracking_plan ON plan_revenue_tracking(plan_type, month DESC);

-- ================================================================
-- 6. Table: subscription_migrations (Historique des migrations)
-- ================================================================
CREATE TABLE IF NOT EXISTS subscription_migrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Migration
  from_plan subscription_plan NOT NULL,
  to_plan subscription_plan NOT NULL,
  migration_reason TEXT,
  migration_type TEXT CHECK (migration_type IN ('auto', 'user_choice', 'admin', 'incentive')) DEFAULT 'user_choice',
  
  -- Incentives
  incentive_applied TEXT, -- Ex: "2 mois offerts", "Setup fee offert"
  incentive_value_fcfa INTEGER DEFAULT 0,
  
  -- Dates
  migrated_at TIMESTAMPTZ DEFAULT now(),
  incentive_expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_migrations_user ON subscription_migrations(user_id, migrated_at DESC);

-- ================================================================
-- 7. Fonctions utilitaires
-- ================================================================

-- Fonction: Vérifier si le setup Opéré est payé
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

-- Fonction: Obtenir la configuration de commission pour un plan
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

-- Fonction: Calculer la commission pour une transaction
CREATE OR REPLACE FUNCTION calculate_transaction_commission(
  amount_fcfa INTEGER,
  plan subscription_plan
)
RETURNS TABLE (
  commission_fcfa INTEGER,
  monthly_fee_fcfa INTEGER,
  total_due_fcfa INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  config RECORD;
  calculated_commission INTEGER;
BEGIN
  -- Récupérer la config du plan
  SELECT * INTO config FROM get_plan_commission_config(plan);
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan % not found', plan;
  END IF;
  
  -- Calculer la commission
  calculated_commission := FLOOR(amount_fcfa * (config.commission_pct / 100.0))::INTEGER;
  
  -- Appliquer le minimum si applicable
  IF config.min_commission > 0 THEN
    calculated_commission := GREATEST(calculated_commission, config.min_commission);
  END IF;
  
  -- Retourner le résultat
  RETURN QUERY SELECT
    calculated_commission as commission_fcfa,
    config.monthly_fee as monthly_fee_fcfa,
    (calculated_commission + config.monthly_fee) as total_due_fcfa;
END;
$$;

-- Fonction: Recommander un package Opéré selon le CA
CREATE OR REPLACE FUNCTION recommend_opere_package(expected_monthly_revenue_fcfa INTEGER)
RETURNS TABLE (
  package_id TEXT,
  package_name TEXT,
  price_fcfa INTEGER,
  recommended TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    osp.package_id,
    osp.name,
    osp.price_fcfa,
    osp.recommended
  FROM opere_setup_packages osp
  WHERE 
    (osp.target_revenue_min IS NULL OR expected_monthly_revenue_fcfa >= osp.target_revenue_min)
    AND (osp.target_revenue_max IS NULL OR expected_monthly_revenue_fcfa <= osp.target_revenue_max)
  ORDER BY osp.price_fcfa DESC
  LIMIT 1;
END;
$$;

-- ================================================================
-- 8. RLS (Row Level Security) Policies
-- ================================================================

-- commission_tiers: Public en lecture
ALTER TABLE commission_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Commission tiers readable by all"
ON commission_tiers FOR SELECT
TO authenticated, anon
USING (true);

-- opere_setup_packages: Public en lecture
ALTER TABLE opere_setup_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Setup packages readable by all"
ON opere_setup_packages FOR SELECT
TO authenticated, anon
USING (true);

-- opere_setup_payments: Users voient leur propre payment
ALTER TABLE opere_setup_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own setup payments"
ON opere_setup_payments FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own setup payments"
ON opere_setup_payments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all setup payments"
ON opere_setup_payments FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- plan_revenue_tracking: Users voient leurs propres revenus
ALTER TABLE plan_revenue_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own revenue tracking"
ON plan_revenue_tracking FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage revenue tracking"
ON plan_revenue_tracking FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- subscription_migrations: Users voient leur historique
ALTER TABLE subscription_migrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own migrations"
ON subscription_migrations FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage migrations"
ON subscription_migrations FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ================================================================
-- 9. Triggers pour updated_at
-- ================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer aux tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_commission_tiers_updated_at') THEN
    CREATE TRIGGER update_commission_tiers_updated_at
    BEFORE UPDATE ON commission_tiers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_opere_packages_updated_at') THEN
    CREATE TRIGGER update_opere_packages_updated_at
    BEFORE UPDATE ON opere_setup_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_opere_payments_updated_at') THEN
    CREATE TRIGGER update_opere_payments_updated_at
    BEFORE UPDATE ON opere_setup_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_revenue_tracking_updated_at') THEN
    CREATE TRIGGER update_revenue_tracking_updated_at
    BEFORE UPDATE ON plan_revenue_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ================================================================
-- 10. Vues utiles pour analytics
-- ================================================================

-- Vue: MRR par plan
CREATE OR REPLACE VIEW mrr_by_plan AS
SELECT 
  us.plan_type,
  COUNT(DISTINCT us.user_id) as user_count,
  ct.monthly_fee_fcfa,
  (COUNT(DISTINCT us.user_id) * ct.monthly_fee_fcfa) as total_mrr_fcfa
FROM user_subscriptions us
JOIN commission_tiers ct ON ct.plan_type = us.plan_type
WHERE us.status = 'active'
GROUP BY us.plan_type, ct.monthly_fee_fcfa
ORDER BY total_mrr_fcfa DESC;

-- Vue: Revenus totaux du mois en cours
CREATE OR REPLACE VIEW current_month_revenue AS
SELECT 
  plan_type,
  COUNT(DISTINCT user_id) as users,
  SUM(gross_revenue_fcfa) as total_gross_revenue,
  SUM(commission_amount_fcfa) as total_commission,
  SUM(monthly_fee_paid_fcfa) as total_monthly_fees,
  SUM(setup_fee_paid_fcfa) as total_setup_fees,
  (SUM(commission_amount_fcfa) + SUM(monthly_fee_paid_fcfa) + SUM(setup_fee_paid_fcfa)) as total_platform_revenue
FROM plan_revenue_tracking
WHERE month = DATE_TRUNC('month', CURRENT_DATE)
GROUP BY plan_type;

-- ================================================================
-- FIN DE LA MIGRATION
-- ================================================================

-- Log de succès
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 20260123_add_new_subscription_plans.sql completed successfully';
  RAISE NOTICE '📊 Nouveaux plans ajoutés: ESSENTIEL, CONNEXIONS, COMMERCE, OPERE';
  RAISE NOTICE '🔧 Tables créées: commission_tiers, opere_setup_packages, opere_setup_payments, plan_revenue_tracking, subscription_migrations';
  RAISE NOTICE '🔒 RLS policies activées sur toutes les tables';
END $$;
