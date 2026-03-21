-- =====================================================
-- Migration: Nettoyage des Politiques RLS Dupliquées
-- Date: 2025-01-26
-- Description: Supprime les politiques dupliquées et stabilise les tables problématiques
-- =====================================================

-- =====================================================
-- 1. BUSINESS_CARDS - Nettoyer les 9 politiques → 4 politiques
-- =====================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Supprimer toutes les anciennes politiques business_cards
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'business_cards' 
        AND schemaname = 'public'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.business_cards';
    END LOOP;
END $$;

-- Appliquer la migration de stabilisation si pas déjà fait
-- (Cette partie devrait déjà être dans 20250126_stabilize_business_cards_rls.sql)
DO $$
BEGIN
    -- Vérifier si les nouvelles politiques existent déjà
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'business_cards' 
        AND policyname = 'business_cards_select_own_or_public'
    ) THEN
        -- Créer les politiques stabilisées
        CREATE POLICY "business_cards_select_own_or_public"
        ON public.business_cards
        FOR SELECT
        TO authenticated, anon
        USING (
            user_id = auth.uid() OR is_public = true
        );

        CREATE POLICY "business_cards_insert_own"
        ON public.business_cards
        FOR INSERT
        TO authenticated
        WITH CHECK (user_id = auth.uid());

        CREATE POLICY "business_cards_update_own"
        ON public.business_cards
        FOR UPDATE
        TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());

        CREATE POLICY "business_cards_delete_own"
        ON public.business_cards
        FOR DELETE
        TO authenticated
        USING (user_id = auth.uid());
    END IF;
END $$;

-- =====================================================
-- 2. PORTFOLIO_SETTINGS - Nettoyer les 10 politiques → 5 politiques
-- =====================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'portfolio_settings' 
        AND schemaname = 'public'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.portfolio_settings';
    END LOOP;
END $$;

-- Créer les politiques consolidées
CREATE POLICY "portfolio_settings_select_own"
ON public.portfolio_settings
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "portfolio_settings_public_read"
ON public.portfolio_settings
FOR SELECT
TO anon, authenticated
USING (is_enabled = true);

CREATE POLICY "portfolio_settings_insert_own"
ON public.portfolio_settings
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "portfolio_settings_update_own"
ON public.portfolio_settings
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "portfolio_settings_delete_own"
ON public.portfolio_settings
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- =====================================================
-- 3. DIGITAL_INQUIRIES - Nettoyer les 10 politiques → 4 politiques
-- =====================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'digital_inquiries' 
        AND schemaname = 'public'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.digital_inquiries';
    END LOOP;
END $$;

-- Créer les politiques consolidées
CREATE POLICY "digital_inquiries_insert_public"
ON public.digital_inquiries
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "digital_inquiries_select_public"
ON public.digital_inquiries
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "digital_inquiries_select_owner"
ON public.digital_inquiries
FOR SELECT
TO authenticated
USING (
    -- Le propriétaire peut voir les demandes via card_id
    EXISTS (
        SELECT 1 FROM public.business_cards
        WHERE business_cards.id = digital_inquiries.card_id
        AND business_cards.user_id = auth.uid()
    ) OR
    -- Ou via digital_product_id si présent
    (
        digital_inquiries.digital_product_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.digital_products
            WHERE digital_products.id = digital_inquiries.digital_product_id
            AND EXISTS (
                SELECT 1 FROM public.business_cards
                WHERE business_cards.id = digital_products.card_id
                AND business_cards.user_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "digital_inquiries_update_owner"
ON public.digital_inquiries
FOR UPDATE
TO authenticated
USING (
    -- Le propriétaire peut modifier via card_id
    EXISTS (
        SELECT 1 FROM public.business_cards
        WHERE business_cards.id = digital_inquiries.card_id
        AND business_cards.user_id = auth.uid()
    ) OR
    -- Ou via digital_product_id si présent
    (
        digital_inquiries.digital_product_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.digital_products
            WHERE digital_products.id = digital_inquiries.digital_product_id
            AND EXISTS (
                SELECT 1 FROM public.business_cards
                WHERE business_cards.id = digital_products.card_id
                AND business_cards.user_id = auth.uid()
            )
        )
    )
)
WITH CHECK (true);

-- =====================================================
-- 4. PRODUCT_INQUIRIES - Nettoyer les 10 politiques → 4 politiques
-- =====================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'product_inquiries' 
        AND schemaname = 'public'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.product_inquiries';
    END LOOP;
END $$;

-- Créer les politiques consolidées
CREATE POLICY "product_inquiries_insert_public"
ON public.product_inquiries
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "product_inquiries_select_public"
ON public.product_inquiries
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "product_inquiries_select_owner"
ON public.product_inquiries
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.products
        WHERE products.id = product_inquiries.product_id
        AND EXISTS (
            SELECT 1 FROM public.business_cards
            WHERE business_cards.id = products.card_id
            AND business_cards.user_id = auth.uid()
        )
    )
);

CREATE POLICY "product_inquiries_update_owner"
ON public.product_inquiries
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.products
        WHERE products.id = product_inquiries.product_id
        AND EXISTS (
            SELECT 1 FROM public.business_cards
            WHERE business_cards.id = products.card_id
            AND business_cards.user_id = auth.uid()
        )
    )
)
WITH CHECK (true);

-- =====================================================
-- 5. DIGITAL_PRODUCTS - Nettoyer les 9 politiques → 4 politiques
-- =====================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'digital_products' 
        AND schemaname = 'public'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.digital_products';
    END LOOP;
END $$;

-- Créer les politiques consolidées
CREATE POLICY "digital_products_select_public"
ON public.digital_products
FOR SELECT
TO anon, authenticated
USING (
    -- Produits publiés sont visibles par tous
    status = 'published' OR
    -- Le propriétaire peut voir tous ses produits
    EXISTS (
        SELECT 1 FROM public.business_cards
        WHERE business_cards.id = digital_products.card_id
        AND business_cards.user_id = auth.uid()
    )
);

CREATE POLICY "digital_products_insert_owner"
ON public.digital_products
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.business_cards
        WHERE business_cards.id = digital_products.card_id
        AND business_cards.user_id = auth.uid()
    )
);

CREATE POLICY "digital_products_update_owner"
ON public.digital_products
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.business_cards
        WHERE business_cards.id = digital_products.card_id
        AND business_cards.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.business_cards
        WHERE business_cards.id = digital_products.card_id
        AND business_cards.user_id = auth.uid()
    )
);

CREATE POLICY "digital_products_delete_owner"
ON public.digital_products
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.business_cards
        WHERE business_cards.id = digital_products.card_id
        AND business_cards.user_id = auth.uid()
    )
);

-- =====================================================
-- 6. PRODUCTS - Nettoyer les 9 politiques → 4 politiques
-- =====================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'products' 
        AND schemaname = 'public'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.products';
    END LOOP;
END $$;

-- Créer les politiques consolidées
CREATE POLICY "products_select_public"
ON public.products
FOR SELECT
TO anon, authenticated
USING (
    -- Le propriétaire peut voir tous ses produits (priorité)
    EXISTS (
        SELECT 1 FROM public.business_cards
        WHERE business_cards.id = products.card_id
        AND business_cards.user_id = auth.uid()
    ) OR
    -- Tous les autres produits sont visibles (simplifié - ajustez selon vos besoins)
    true
);

CREATE POLICY "products_insert_owner"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.business_cards
        WHERE business_cards.id = products.card_id
        AND business_cards.user_id = auth.uid()
    )
);

CREATE POLICY "products_update_owner"
ON public.products
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.business_cards
        WHERE business_cards.id = products.card_id
        AND business_cards.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.business_cards
        WHERE business_cards.id = products.card_id
        AND business_cards.user_id = auth.uid()
    )
);

CREATE POLICY "products_delete_owner"
ON public.products
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.business_cards
        WHERE business_cards.id = products.card_id
        AND business_cards.user_id = auth.uid()
    )
);

-- =====================================================
-- 7. PROFILES - Nettoyer les 5 politiques → 4 politiques
-- =====================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND schemaname = 'public'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.profiles';
    END LOOP;
END $$;

-- Appliquer la migration de stabilisation (devrait déjà être dans 20250126_stabilize_profiles_rls.sql)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'profiles_service_role_all'
    ) THEN
        CREATE POLICY "profiles_service_role_all"
        ON public.profiles
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);

        CREATE POLICY "profiles_select_own_or_admin_or_public"
        ON public.profiles
        FOR SELECT
        TO authenticated, anon
        USING (
            id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.user_roles
                WHERE user_roles.user_id = auth.uid()
                AND user_roles.role = 'admin'
            )
        );

        CREATE POLICY "profiles_insert_service_role"
        ON public.profiles
        FOR INSERT
        TO service_role
        WITH CHECK (true);

        CREATE POLICY "profiles_update_own"
        ON public.profiles
        FOR UPDATE
        TO authenticated
        USING (id = auth.uid())
        WITH CHECK (id = auth.uid());
    END IF;
END $$;

-- =====================================================
-- 8. USER_SUBSCRIPTIONS - Nettoyer les 7 politiques → 4 politiques
-- =====================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_subscriptions' 
        AND schemaname = 'public'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.user_subscriptions';
    END LOOP;
END $$;

-- Créer les politiques consolidées
CREATE POLICY "user_subscriptions_select_own"
ON public.user_subscriptions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "user_subscriptions_insert_own"
ON public.user_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_subscriptions_update_own"
ON public.user_subscriptions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy pour les admins (gestion globale)
CREATE POLICY "user_subscriptions_admin_all"
ON public.user_subscriptions
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
);

-- =====================================================
-- VÉRIFICATION FINALE
-- =====================================================

SELECT 
    tablename,
    count(*) as policy_count,
    string_agg(policyname, ', ' ORDER BY policyname) as policies
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
    'business_cards',
    'portfolio_settings',
    'digital_inquiries',
    'product_inquiries',
    'digital_products',
    'products',
    'profiles',
    'user_subscriptions'
)
GROUP BY tablename
ORDER BY tablename;

-- Résultat attendu:
-- business_cards: 4 politiques
-- digital_inquiries: 4 politiques
-- digital_products: 4 politiques
-- portfolio_settings: 5 politiques
-- product_inquiries: 4 politiques
-- products: 4 politiques
-- profiles: 4 politiques
-- user_subscriptions: 4 politiques

COMMENT ON SCHEMA public IS 'RLS policies cleaned up and stabilized on 2025-01-26';

