-- ================================================================
-- Migration SAFE: Ajout des nouveaux plans de souscription
-- Version simplifiée et plus robuste
-- Date: 2026-01-23
-- ================================================================

-- ÉTAPE 1 : Vérifier et afficher l'état actuel de l'enum
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '=================================================';
    RAISE NOTICE '📊 État actuel de l''enum subscription_plan';
    RAISE NOTICE '=================================================';
    
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan') THEN
        RAISE NOTICE '✅ Enum subscription_plan existe';
        RAISE NOTICE 'Valeurs actuelles:';
        FOR rec IN 
            SELECT enumlabel, enumsortorder
            FROM pg_enum 
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan')
            ORDER BY enumsortorder
        LOOP
            RAISE NOTICE '  %: %', rec.enumsortorder, rec.enumlabel;
        END LOOP;
    ELSE
        RAISE NOTICE '❌ Enum subscription_plan n''existe PAS';
    END IF;
END $$;

-- ÉTAPE 2 : Créer l'enum avec toutes les valeurs SI il n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan') THEN
        CREATE TYPE subscription_plan AS ENUM (
            'free', 
            'business', 
            'magic',
            'essentiel',
            'connexions',
            'commerce',
            'opere'
        );
        RAISE NOTICE '✅ Enum subscription_plan créé avec 7 valeurs';
    ELSE
        RAISE NOTICE 'ℹ️ Enum subscription_plan existe déjà, passage à l''ajout des valeurs...';
    END IF;
END $$;

-- ÉTAPE 3 : Ajouter les valeurs manquantes une par une
-- NOTE: ALTER TYPE ADD VALUE ne peut pas être dans un bloc IF/ELSE dans une transaction
-- On doit le faire séparément pour chaque valeur

-- Ajouter 'free' si nécessaire
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'free' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan')
    ) THEN
        -- Cette commande doit être hors d'un bloc de transaction
        EXECUTE 'ALTER TYPE subscription_plan ADD VALUE ''free''';
        RAISE NOTICE '✅ free ajouté';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Impossible d''ajouter free: %', SQLERRM;
END $$;

-- Ajouter 'business' si nécessaire
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'business' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan')
    ) THEN
        EXECUTE 'ALTER TYPE subscription_plan ADD VALUE ''business''';
        RAISE NOTICE '✅ business ajouté';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Impossible d''ajouter business: %', SQLERRM;
END $$;

-- Ajouter 'magic' si nécessaire
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'magic' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan')
    ) THEN
        EXECUTE 'ALTER TYPE subscription_plan ADD VALUE ''magic''';
        RAISE NOTICE '✅ magic ajouté';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Impossible d''ajouter magic: %', SQLERRM;
END $$;

-- Ajouter 'essentiel' si nécessaire
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'essentiel' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan')
    ) THEN
        EXECUTE 'ALTER TYPE subscription_plan ADD VALUE ''essentiel''';
        RAISE NOTICE '✅ essentiel ajouté';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Impossible d''ajouter essentiel: %', SQLERRM;
END $$;

-- Ajouter 'connexions' si nécessaire
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'connexions' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan')
    ) THEN
        EXECUTE 'ALTER TYPE subscription_plan ADD VALUE ''connexions''';
        RAISE NOTICE '✅ connexions ajouté';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Impossible d''ajouter connexions: %', SQLERRM;
END $$;

-- Ajouter 'commerce' si nécessaire
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'commerce' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan')
    ) THEN
        EXECUTE 'ALTER TYPE subscription_plan ADD VALUE ''commerce''';
        RAISE NOTICE '✅ commerce ajouté';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Impossible d''ajouter commerce: %', SQLERRM;
END $$;

-- Ajouter 'opere' si nécessaire
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'opere' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan')
    ) THEN
        EXECUTE 'ALTER TYPE subscription_plan ADD VALUE ''opere''';
        RAISE NOTICE '✅ opere ajouté';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Impossible d''ajouter opere: %', SQLERRM;
END $$;

-- ÉTAPE 4 : Vérifier l'état final de l'enum
DO $$
DECLARE
    rec RECORD;
    val_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO val_count
    FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan');
    
    RAISE NOTICE '=================================================';
    RAISE NOTICE '📊 État FINAL de l''enum subscription_plan';
    RAISE NOTICE 'Nombre de valeurs: %', val_count;
    RAISE NOTICE '=================================================';
    
    FOR rec IN 
        SELECT enumlabel, enumsortorder
        FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_plan')
        ORDER BY enumsortorder
    LOOP
        RAISE NOTICE '  %: %', rec.enumsortorder, rec.enumlabel;
    END LOOP;
    
    IF val_count < 7 THEN
        RAISE WARNING '⚠️ L''enum n''a que % valeurs (7 attendues)', val_count;
    ELSE
        RAISE NOTICE '✅ Enum subscription_plan prêt avec toutes les valeurs';
    END IF;
END $$;

-- ÉTAPE 5 : Créer les tables (reste du fichier identique)
-- Copier ici le reste du fichier 20260123_add_new_subscription_plans.sql
-- depuis "-- 2. Table: commission_tiers" jusqu'à la fin

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
  is_legacy BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insérer les données - TENTATIVE SIMPLE
DO $$
BEGIN
    RAISE NOTICE '🔧 Insertion des configurations de commissions...';
    
    -- FREE
    INSERT INTO commission_tiers (plan_type, monthly_fee_fcfa, commission_percentage, setup_fee_fcfa, min_commission_fcfa, description, is_legacy) 
    VALUES ('free'::subscription_plan, 0, 3, 0, 0, 'Plan gratuit legacy - Commission 3%', true)
    ON CONFLICT (plan_type) DO UPDATE SET
        monthly_fee_fcfa = EXCLUDED.monthly_fee_fcfa,
        commission_percentage = EXCLUDED.commission_percentage,
        description = EXCLUDED.description,
        updated_at = now();
    RAISE NOTICE '  ✅ FREE configuré';
    
    -- BUSINESS
    INSERT INTO commission_tiers (plan_type, monthly_fee_fcfa, commission_percentage, setup_fee_fcfa, min_commission_fcfa, description, is_legacy) 
    VALUES ('business'::subscription_plan, 13000, 1, 0, 0, 'Plan Business legacy - 13K FCFA/mois + 1%', true)
    ON CONFLICT (plan_type) DO UPDATE SET
        monthly_fee_fcfa = EXCLUDED.monthly_fee_fcfa,
        commission_percentage = EXCLUDED.commission_percentage,
        description = EXCLUDED.description,
        updated_at = now();
    RAISE NOTICE '  ✅ BUSINESS configuré';
    
    -- MAGIC
    INSERT INTO commission_tiers (plan_type, monthly_fee_fcfa, commission_percentage, setup_fee_fcfa, min_commission_fcfa, description, is_legacy) 
    VALUES ('magic'::subscription_plan, 26000, 1, 0, 0, 'Plan Magic legacy - 26K FCFA/mois + 1%', true)
    ON CONFLICT (plan_type) DO UPDATE SET
        monthly_fee_fcfa = EXCLUDED.monthly_fee_fcfa,
        commission_percentage = EXCLUDED.commission_percentage,
        description = EXCLUDED.description,
        updated_at = now();
    RAISE NOTICE '  ✅ MAGIC configuré';
    
    -- ESSENTIEL
    INSERT INTO commission_tiers (plan_type, monthly_fee_fcfa, commission_percentage, setup_fee_fcfa, min_commission_fcfa, description, is_legacy) 
    VALUES ('essentiel'::subscription_plan, 0, 0, 0, 0, 'Gratuit - Viralité et adoption massive', false)
    ON CONFLICT (plan_type) DO UPDATE SET
        monthly_fee_fcfa = EXCLUDED.monthly_fee_fcfa,
        commission_percentage = EXCLUDED.commission_percentage,
        description = EXCLUDED.description,
        updated_at = now();
    RAISE NOTICE '  ✅ ESSENTIEL configuré';
    
    -- CONNEXIONS
    INSERT INTO commission_tiers (plan_type, monthly_fee_fcfa, commission_percentage, setup_fee_fcfa, min_commission_fcfa, description, is_legacy) 
    VALUES ('connexions'::subscription_plan, 15000, 0, 0, 0, 'Capital relationnel - RDV + CRM', false)
    ON CONFLICT (plan_type) DO UPDATE SET
        monthly_fee_fcfa = EXCLUDED.monthly_fee_fcfa,
        commission_percentage = EXCLUDED.commission_percentage,
        description = EXCLUDED.description,
        updated_at = now();
    RAISE NOTICE '  ✅ CONNEXIONS configuré';
    
    -- COMMERCE
    INSERT INTO commission_tiers (plan_type, monthly_fee_fcfa, commission_percentage, setup_fee_fcfa, min_commission_fcfa, description, is_legacy) 
    VALUES ('commerce'::subscription_plan, 0, 5, 0, 0, 'E-commerce - 5% commission uniquement', false)
    ON CONFLICT (plan_type) DO UPDATE SET
        monthly_fee_fcfa = EXCLUDED.monthly_fee_fcfa,
        commission_percentage = EXCLUDED.commission_percentage,
        description = EXCLUDED.description,
        updated_at = now();
    RAISE NOTICE '  ✅ COMMERCE configuré';
    
    -- OPERE
    INSERT INTO commission_tiers (plan_type, monthly_fee_fcfa, commission_percentage, setup_fee_fcfa, min_commission_fcfa, description, is_legacy) 
    VALUES ('opere'::subscription_plan, 0, 10, 0, 100000, 'Premium - 10% commission + setup variable', false)
    ON CONFLICT (plan_type) DO UPDATE SET
        monthly_fee_fcfa = EXCLUDED.monthly_fee_fcfa,
        commission_percentage = EXCLUDED.commission_percentage,
        min_commission_fcfa = EXCLUDED.min_commission_fcfa,
        description = EXCLUDED.description,
        updated_at = now();
    RAISE NOTICE '  ✅ OPERE configuré';
    
    RAISE NOTICE '✅ Toutes les configurations insérées avec succès';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erreur lors de l''insertion: %', SQLERRM;
END $$;

-- Vérifier les données insérées
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '=================================================';
    RAISE NOTICE '📊 Configurations de commissions insérées';
    RAISE NOTICE '=================================================';
    FOR rec IN 
        SELECT plan_type, monthly_fee_fcfa, commission_percentage, is_legacy
        FROM commission_tiers
        ORDER BY is_legacy DESC, monthly_fee_fcfa
    LOOP
        RAISE NOTICE '  %: %FCFA/mois + %% commission (legacy: %)', 
            rec.plan_type, rec.monthly_fee_fcfa, rec.commission_percentage, rec.is_legacy;
    END LOOP;
END $$;

-- ================================================================
-- 3. Table: opere_setup_packages (Packages Setup pour OPÉRÉ)
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

-- ================================================================
-- 5. Table: plan_revenue_tracking (Tracking des revenus par plan)
-- ================================================================
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

-- ================================================================
-- 6. Table: subscription_migrations (Historique des migrations)
-- ================================================================
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

-- ================================================================
-- 7. Fonctions utilitaires
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

-- ================================================================
-- 8. RLS Policies
-- ================================================================

ALTER TABLE commission_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Commission tiers readable by all" ON commission_tiers FOR SELECT TO authenticated, anon USING (true);

ALTER TABLE opere_setup_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Setup packages readable by all" ON opere_setup_packages FOR SELECT TO authenticated, anon USING (true);

ALTER TABLE opere_setup_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own setup payments" ON opere_setup_payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own setup payments" ON opere_setup_payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

ALTER TABLE plan_revenue_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own revenue tracking" ON plan_revenue_tracking FOR SELECT TO authenticated USING (auth.uid() = user_id);

ALTER TABLE subscription_migrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own migrations" ON subscription_migrations FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ================================================================
-- 9. Trigger pour updated_at
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
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_commission_tiers_updated_at') THEN
    CREATE TRIGGER update_commission_tiers_updated_at BEFORE UPDATE ON commission_tiers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_opere_packages_updated_at') THEN
    CREATE TRIGGER update_opere_packages_updated_at BEFORE UPDATE ON opere_setup_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_opere_payments_updated_at') THEN
    CREATE TRIGGER update_opere_payments_updated_at BEFORE UPDATE ON opere_setup_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_revenue_tracking_updated_at') THEN
    CREATE TRIGGER update_revenue_tracking_updated_at BEFORE UPDATE ON plan_revenue_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ================================================================
-- FIN DE LA VERSION SAFE
-- ================================================================
DO $$
BEGIN
    RAISE NOTICE '=================================================';
    RAISE NOTICE '✅✅✅ Migration SAFE terminée avec succès ✅✅✅';
    RAISE NOTICE '📊 Tables créées: commission_tiers, opere_setup_packages, opere_setup_payments, plan_revenue_tracking, subscription_migrations';
    RAISE NOTICE '🔧 Fonctions créées: has_paid_opere_setup, get_plan_commission_config';
    RAISE NOTICE '🔒 RLS policies activées';
    RAISE NOTICE '=================================================';
END $$;
