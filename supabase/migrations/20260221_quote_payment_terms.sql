-- Migration: Conditions de règlement et champs professionnels pour les devis
-- Vue expert: Un devis professionnel doit inclure conditions de paiement, délai d'exécution, notes de proposition
-- Date: 2026-02-21

-- =====================================================
-- 1. COLONNES service_quotes
-- =====================================================

-- Conditions de règlement (ex: "Paiement à 30 jours", "Acompte 30% à la commande")
ALTER TABLE service_quotes
ADD COLUMN IF NOT EXISTS payment_terms TEXT;

-- Notes de proposition (visibles client, détails additionnels)
ALTER TABLE service_quotes
ADD COLUMN IF NOT EXISTS proposal_notes TEXT;

-- Délai d'exécution (ex: "2 semaines", "Sous 10 jours ouvrés")
ALTER TABLE service_quotes
ADD COLUMN IF NOT EXISTS execution_delay VARCHAR(255);

COMMENT ON COLUMN service_quotes.payment_terms IS 'Conditions de règlement affichées sur le devis et le PDF';
COMMENT ON COLUMN service_quotes.proposal_notes IS 'Notes de proposition visibles par le client';
COMMENT ON COLUMN service_quotes.execution_delay IS 'Délai d''exécution ou de livraison prévu';

-- =====================================================
-- 2. DEFAULT invoice_settings (pour pré-remplissage devis)
-- =====================================================
ALTER TABLE invoice_settings
ADD COLUMN IF NOT EXISTS default_payment_terms TEXT;

COMMENT ON COLUMN invoice_settings.default_payment_terms IS 'Conditions de règlement par défaut (devis et factures)';
