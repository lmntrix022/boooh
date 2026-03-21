-- Migration pour ajouter les champs de paiement Mobile Money
-- Date: 2025-10-16
-- Description: Ajoute les colonnes pour gérer les paiements Mobile Money via BillingEasy

-- =====================================================
-- 1. AJOUTER LES COLONNES À product_inquiries
-- =====================================================

ALTER TABLE product_inquiries
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'pending'
  CHECK (payment_method IN ('pending', 'mobile_money', 'cash', 'bank_transfer', 'other'));

ALTER TABLE product_inquiries
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending'
  CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'));

ALTER TABLE product_inquiries
ADD COLUMN IF NOT EXISTS billing_easy_bill_id VARCHAR(255);

ALTER TABLE product_inquiries
ADD COLUMN IF NOT EXISTS billing_easy_transaction_id VARCHAR(255);

ALTER TABLE product_inquiries
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);

ALTER TABLE product_inquiries
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10, 2);

ALTER TABLE product_inquiries
ADD COLUMN IF NOT EXISTS payment_phone_number VARCHAR(20);

ALTER TABLE product_inquiries
ADD COLUMN IF NOT EXISTS payment_operator VARCHAR(20)
  CHECK (payment_operator IN ('mtn', 'moov', 'orange', NULL));

ALTER TABLE product_inquiries
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- =====================================================
-- 2. AJOUTER LES COLONNES À digital_inquiries
-- =====================================================

ALTER TABLE digital_inquiries
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'pending'
  CHECK (payment_method IN ('pending', 'mobile_money', 'cash', 'bank_transfer', 'other'));

ALTER TABLE digital_inquiries
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending'
  CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'));

ALTER TABLE digital_inquiries
ADD COLUMN IF NOT EXISTS billing_easy_bill_id VARCHAR(255);

ALTER TABLE digital_inquiries
ADD COLUMN IF NOT EXISTS billing_easy_transaction_id VARCHAR(255);

ALTER TABLE digital_inquiries
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);

ALTER TABLE digital_inquiries
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10, 2);

ALTER TABLE digital_inquiries
ADD COLUMN IF NOT EXISTS payment_phone_number VARCHAR(20);

ALTER TABLE digital_inquiries
ADD COLUMN IF NOT EXISTS payment_operator VARCHAR(20)
  CHECK (payment_operator IN ('mtn', 'moov', 'orange', NULL));

ALTER TABLE digital_inquiries
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- =====================================================
-- 3. CRÉER DES INDEX POUR LES PERFORMANCES
-- =====================================================

-- Index pour les recherches par statut de paiement
CREATE INDEX IF NOT EXISTS idx_product_inquiries_payment_status
ON product_inquiries(payment_status);

CREATE INDEX IF NOT EXISTS idx_digital_inquiries_payment_status
ON digital_inquiries(payment_status);

-- Index pour les recherches par bill_id (webhooks)
CREATE INDEX IF NOT EXISTS idx_product_inquiries_bill_id
ON product_inquiries(billing_easy_bill_id);

CREATE INDEX IF NOT EXISTS idx_digital_inquiries_bill_id
ON digital_inquiries(billing_easy_bill_id);

-- Index pour les recherches par référence de paiement
CREATE INDEX IF NOT EXISTS idx_product_inquiries_payment_reference
ON product_inquiries(payment_reference);

CREATE INDEX IF NOT EXISTS idx_digital_inquiries_payment_reference
ON digital_inquiries(payment_reference);

-- Index pour les recherches par transaction_id
CREATE INDEX IF NOT EXISTS idx_product_inquiries_transaction_id
ON product_inquiries(billing_easy_transaction_id);

CREATE INDEX IF NOT EXISTS idx_digital_inquiries_transaction_id
ON digital_inquiries(billing_easy_transaction_id);

-- Index pour les recherches par numéro de téléphone
CREATE INDEX IF NOT EXISTS idx_product_inquiries_payment_phone
ON product_inquiries(payment_phone_number);

CREATE INDEX IF NOT EXISTS idx_digital_inquiries_payment_phone
ON digital_inquiries(payment_phone_number);

-- =====================================================
-- 4. AJOUTER DES COMMENTAIRES POUR LA DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN product_inquiries.payment_method IS
  'Méthode de paiement choisie: pending (en attente), mobile_money, cash, bank_transfer, other';

COMMENT ON COLUMN product_inquiries.payment_status IS
  'Statut du paiement: pending, processing, completed, failed, cancelled, refunded';

COMMENT ON COLUMN product_inquiries.billing_easy_bill_id IS
  'ID de la facture généré par BillingEasy (étape 1)';

COMMENT ON COLUMN product_inquiries.billing_easy_transaction_id IS
  'ID de la transaction généré par BillingEasy après USSD push (étape 2)';

COMMENT ON COLUMN product_inquiries.payment_reference IS
  'Référence unique de paiement générée par l''application';

COMMENT ON COLUMN product_inquiries.payment_amount IS
  'Montant du paiement en FCFA';

COMMENT ON COLUMN product_inquiries.payment_phone_number IS
  'Numéro de téléphone Mobile Money utilisé pour le paiement';

COMMENT ON COLUMN product_inquiries.payment_operator IS
  'Opérateur Mobile Money: mtn, moov, orange';

COMMENT ON COLUMN product_inquiries.paid_at IS
  'Date et heure de confirmation du paiement';

COMMENT ON COLUMN digital_inquiries.payment_method IS
  'Méthode de paiement choisie: pending (en attente), mobile_money, cash, bank_transfer, other';

COMMENT ON COLUMN digital_inquiries.payment_status IS
  'Statut du paiement: pending, processing, completed, failed, cancelled, refunded';

COMMENT ON COLUMN digital_inquiries.billing_easy_bill_id IS
  'ID de la facture généré par BillingEasy (étape 1)';

COMMENT ON COLUMN digital_inquiries.billing_easy_transaction_id IS
  'ID de la transaction généré par BillingEasy après USSD push (étape 2)';

COMMENT ON COLUMN digital_inquiries.payment_reference IS
  'Référence unique de paiement générée par l''application';

COMMENT ON COLUMN digital_inquiries.payment_amount IS
  'Montant du paiement en FCFA';

COMMENT ON COLUMN digital_inquiries.payment_phone_number IS
  'Numéro de téléphone Mobile Money utilisé pour le paiement';

COMMENT ON COLUMN digital_inquiries.payment_operator IS
  'Opérateur Mobile Money: mtn, moov, orange';

COMMENT ON COLUMN digital_inquiries.paid_at IS
  'Date et heure de confirmation du paiement';

-- =====================================================
-- 5. FONCTION POUR AUTO-UPDATE DU STATUS GÉNÉRAL
-- =====================================================

-- Fonction pour synchroniser le statut de commande avec le statut de paiement
CREATE OR REPLACE FUNCTION sync_order_status_with_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le paiement est complété, passer la commande en "processing"
  IF NEW.payment_status = 'completed' AND NEW.status = 'pending' THEN
    NEW.status = 'processing';
    NEW.paid_at = NOW();
  END IF;

  -- Si le paiement échoue, on peut optionnellement annuler la commande
  IF NEW.payment_status = 'failed' AND NEW.status = 'pending' THEN
    NEW.status = 'cancelled';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer les triggers pour product_inquiries
DROP TRIGGER IF EXISTS trigger_sync_product_inquiry_payment ON product_inquiries;
CREATE TRIGGER trigger_sync_product_inquiry_payment
  BEFORE UPDATE OF payment_status ON product_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION sync_order_status_with_payment();

-- Créer les triggers pour digital_inquiries
DROP TRIGGER IF EXISTS trigger_sync_digital_inquiry_payment ON digital_inquiries;
CREATE TRIGGER trigger_sync_digital_inquiry_payment
  BEFORE UPDATE OF payment_status ON digital_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION sync_order_status_with_payment();

-- =====================================================
-- 6. FONCTION POUR RECHERCHER UNE COMMANDE PAR BILL_ID
-- =====================================================

-- Fonction utilitaire pour les webhooks
CREATE OR REPLACE FUNCTION find_order_by_bill_id(bill_id_param VARCHAR)
RETURNS TABLE (
  id UUID,
  type VARCHAR,
  payment_status VARCHAR,
  amount DECIMAL,
  client_email VARCHAR
) AS $$
BEGIN
  -- Chercher dans product_inquiries
  RETURN QUERY
  SELECT
    pi.id,
    'physical'::VARCHAR AS type,
    pi.payment_status,
    pi.payment_amount,
    pi.client_email
  FROM product_inquiries pi
  WHERE pi.billing_easy_bill_id = bill_id_param
  UNION ALL
  -- Chercher dans digital_inquiries
  SELECT
    di.id,
    'digital'::VARCHAR AS type,
    di.payment_status,
    di.payment_amount,
    di.client_email
  FROM digital_inquiries di
  WHERE di.billing_easy_bill_id = bill_id_param;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. VUE POUR LES STATISTIQUES DE PAIEMENT
-- =====================================================

CREATE OR REPLACE VIEW payment_statistics AS
SELECT
  'product_inquiries' AS source_table,
  payment_status,
  payment_method,
  payment_operator,
  COUNT(*) AS count,
  SUM(payment_amount) AS total_amount,
  AVG(payment_amount) AS avg_amount
FROM product_inquiries
WHERE payment_method IS NOT NULL
GROUP BY payment_status, payment_method, payment_operator

UNION ALL

SELECT
  'digital_inquiries' AS source_table,
  payment_status,
  payment_method,
  payment_operator,
  COUNT(*) AS count,
  SUM(payment_amount) AS total_amount,
  AVG(payment_amount) AS avg_amount
FROM digital_inquiries
WHERE payment_method IS NOT NULL
GROUP BY payment_status, payment_method, payment_operator;

COMMENT ON VIEW payment_statistics IS
  'Vue agrégée des statistiques de paiement pour les deux types de commandes';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================

-- Note: Pour appliquer cette migration:
-- supabase db push
-- ou depuis le dashboard Supabase > SQL Editor
