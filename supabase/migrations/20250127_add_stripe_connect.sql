-- Migration pour intégrer Stripe Connect
-- Date: 2025-01-27
-- Description: Permet aux propriétaires de cartes de recevoir des paiements pour leurs produits avec commission

-- =====================================================
-- 1. TABLE POUR STOCKER LES COMPTES STRIPE CONNECT
-- =====================================================

CREATE TABLE IF NOT EXISTS public.stripe_connect_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id VARCHAR(255) NOT NULL UNIQUE, -- ID du compte Stripe Connect (acct_xxx)
  account_type VARCHAR(50) DEFAULT 'express' CHECK (account_type IN ('standard', 'express', 'custom')),
  email VARCHAR(255),
  country VARCHAR(2) DEFAULT 'FR', -- Code pays ISO 2 lettres
  charges_enabled BOOLEAN DEFAULT false,
  payouts_enabled BOOLEAN DEFAULT false,
  details_submitted BOOLEAN DEFAULT false,
  onboarded BOOLEAN DEFAULT false,
  onboarding_url TEXT, -- URL pour compléter l'onboarding
  dashboard_url TEXT, -- URL du dashboard Stripe
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_account UNIQUE(user_id)
);

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_stripe_connect_accounts_user_id ON public.stripe_connect_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_connect_accounts_account_id ON public.stripe_connect_accounts(account_id);
CREATE INDEX IF NOT EXISTS idx_stripe_connect_accounts_onboarded ON public.stripe_connect_accounts(onboarded);

-- =====================================================
-- 2. TABLE POUR STOCKER LES TRANSACTIONS AVEC COMMISSIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.stripe_connect_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_intent_id VARCHAR(255) UNIQUE, -- ID du PaymentIntent Stripe (pi_xxx)
  transfer_id VARCHAR(255), -- ID du Transfer Stripe (tr_xxx)
  card_id UUID NOT NULL REFERENCES public.business_cards(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  digital_product_id UUID REFERENCES public.digital_products(id) ON DELETE SET NULL,
  order_id UUID, -- ID de la commande (product_inquiries ou digital_inquiries)
  order_type VARCHAR(20) CHECK (order_type IN ('physical', 'digital')),
  
  -- Montants
  amount_total INTEGER NOT NULL, -- Montant total en centimes (ex: 2500 = 25.00 EUR)
  amount_platform INTEGER NOT NULL, -- Commission de la plateforme en centimes
  amount_seller INTEGER NOT NULL, -- Montant reversé au vendeur en centimes
  currency VARCHAR(3) DEFAULT 'EUR',
  
  -- Commission
  commission_rate DECIMAL(5, 2) DEFAULT 5.00, -- Pourcentage de commission (ex: 5.00 = 5%)
  commission_fixed INTEGER DEFAULT 0, -- Commission fixe en centimes (optionnel)
  
  -- Statuts
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'disputed')),
  transfer_status VARCHAR(50), -- Statut du transfert vers le vendeur
  
  -- Informations
  customer_email VARCHAR(255),
  seller_account_id VARCHAR(255) REFERENCES public.stripe_connect_accounts(account_id) ON DELETE SET NULL,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_stripe_connect_transactions_card_id ON public.stripe_connect_transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_stripe_connect_transactions_payment_intent_id ON public.stripe_connect_transactions(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_stripe_connect_transactions_seller_account_id ON public.stripe_connect_transactions(seller_account_id);
CREATE INDEX IF NOT EXISTS idx_stripe_connect_transactions_status ON public.stripe_connect_transactions(status);
CREATE INDEX IF NOT EXISTS idx_stripe_connect_transactions_created_at ON public.stripe_connect_transactions(created_at DESC);

-- =====================================================
-- 3. POLITIQUES RLS POUR STRIPE_CONNECT_ACCOUNTS
-- =====================================================

ALTER TABLE public.stripe_connect_accounts ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes si elles existent (pour réappliquer la migration)
DROP POLICY IF EXISTS "Users can view own stripe connect account" ON public.stripe_connect_accounts;
DROP POLICY IF EXISTS "Users can update own stripe connect account" ON public.stripe_connect_accounts;
DROP POLICY IF EXISTS "Service role can manage all stripe connect accounts" ON public.stripe_connect_accounts;

-- Les utilisateurs peuvent voir leur propre compte
CREATE POLICY "Users can view own stripe connect account"
ON public.stripe_connect_accounts
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Les utilisateurs peuvent mettre à jour leur propre compte
CREATE POLICY "Users can update own stripe connect account"
ON public.stripe_connect_accounts
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Service role peut tout faire
CREATE POLICY "Service role can manage all stripe connect accounts"
ON public.stripe_connect_accounts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- 4. POLITIQUES RLS POUR STRIPE_CONNECT_TRANSACTIONS
-- =====================================================

ALTER TABLE public.stripe_connect_transactions ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes si elles existent (pour réappliquer la migration)
DROP POLICY IF EXISTS "Card owners can view own transactions" ON public.stripe_connect_transactions;
DROP POLICY IF EXISTS "Service role can manage all transactions" ON public.stripe_connect_transactions;

-- Les propriétaires de cartes peuvent voir leurs transactions
CREATE POLICY "Card owners can view own transactions"
ON public.stripe_connect_transactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.business_cards
    WHERE business_cards.id = stripe_connect_transactions.card_id
    AND business_cards.user_id = auth.uid()
  )
);

-- Service role peut tout faire
CREATE POLICY "Service role can manage all transactions"
ON public.stripe_connect_transactions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- 5. FONCTION POUR CALCULER LA COMMISSION
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_commission(
  amount_total_cents INTEGER,
  commission_rate_pct DECIMAL DEFAULT 5.00,
  commission_fixed_cents INTEGER DEFAULT 0
)
RETURNS TABLE (
  platform_amount INTEGER,
  seller_amount INTEGER
)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  rate_amount INTEGER;
  fixed_amount INTEGER;
  total_commission INTEGER;
BEGIN
  -- Calculer la commission basée sur le pourcentage
  rate_amount := FLOOR(amount_total_cents * (commission_rate_pct / 100.0))::INTEGER;
  
  -- Ajouter la commission fixe
  fixed_amount := commission_fixed_cents;
  
  -- Commission totale
  total_commission := rate_amount + fixed_amount;
  
  -- S'assurer que la commission ne dépasse pas le montant total
  total_commission := LEAST(total_commission, amount_total_cents);
  
  -- Retourner les montants
  RETURN QUERY SELECT
    total_commission as platform_amount,
    (amount_total_cents - total_commission) as seller_amount;
END;
$$;

-- =====================================================
-- 6. TRIGGER POUR METTRE À JOUR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_stripe_connect_accounts_updated_at ON public.stripe_connect_accounts;
CREATE TRIGGER update_stripe_connect_accounts_updated_at
  BEFORE UPDATE ON public.stripe_connect_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stripe_connect_transactions_updated_at ON public.stripe_connect_transactions;
CREATE TRIGGER update_stripe_connect_transactions_updated_at
  BEFORE UPDATE ON public.stripe_connect_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. VUE POUR LES STATISTIQUES DE COMMISSIONS
-- =====================================================

DROP VIEW IF EXISTS stripe_connect_stats;
CREATE OR REPLACE VIEW stripe_connect_stats AS
SELECT 
  sca.user_id,
  sca.account_id,
  COUNT(DISTINCT sct.id) as total_transactions,
  COUNT(DISTINCT CASE WHEN sct.status = 'succeeded' THEN sct.id END) as successful_transactions,
  COALESCE(SUM(CASE WHEN sct.status = 'succeeded' THEN sct.amount_total END), 0) as total_revenue_cents,
  COALESCE(SUM(CASE WHEN sct.status = 'succeeded' THEN sct.amount_platform END), 0) as total_commission_cents,
  COALESCE(SUM(CASE WHEN sct.status = 'succeeded' THEN sct.amount_seller END), 0) as total_payout_cents,
  MAX(sct.created_at) as last_transaction_at
FROM public.stripe_connect_accounts sca
LEFT JOIN public.stripe_connect_transactions sct ON sca.account_id = sct.seller_account_id
GROUP BY sca.user_id, sca.account_id;

