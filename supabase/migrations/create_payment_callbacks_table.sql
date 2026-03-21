-- =====================================================
-- Table: payment_callbacks
-- Description: Stocke tous les callbacks reçus d'eBilling
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_callbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informations du callback eBilling
  bill_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'FAILED', 'PENDING')),
  reference TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  
  -- Informations du payeur
  payer_msisdn TEXT,
  payer_name TEXT,
  payer_email TEXT,
  
  -- Informations de la transaction
  transaction_id TEXT,
  paid_at TIMESTAMPTZ,
  
  -- Métadonnées
  payment_system TEXT, -- 'airtelmoney' ou 'moovmoney4'
  raw_payload JSONB NOT NULL, -- Payload complet pour debugging
  
  -- Traçabilité
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_payment_callbacks_bill_id ON payment_callbacks(bill_id);
CREATE INDEX IF NOT EXISTS idx_payment_callbacks_reference ON payment_callbacks(reference);
CREATE INDEX IF NOT EXISTS idx_payment_callbacks_status ON payment_callbacks(status);
CREATE INDEX IF NOT EXISTS idx_payment_callbacks_processed ON payment_callbacks(processed);
CREATE INDEX IF NOT EXISTS idx_payment_callbacks_created_at ON payment_callbacks(created_at DESC);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_payment_callbacks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_callbacks_updated_at
  BEFORE UPDATE ON payment_callbacks
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_callbacks_updated_at();

-- RLS (Row Level Security)
ALTER TABLE payment_callbacks ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs propres callbacks (via leur card_id)
-- Note: Cette policy sera affinée selon votre structure de données
CREATE POLICY "Users can view their own payment callbacks"
  ON payment_callbacks
  FOR SELECT
  USING (true); -- À ajuster selon votre logique métier

-- Policy: Seuls les admins peuvent modifier
CREATE POLICY "Only admins can modify payment callbacks"
  ON payment_callbacks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Commentaires pour la documentation
COMMENT ON TABLE payment_callbacks IS 'Stocke tous les callbacks de paiement reçus d''eBilling pour traçabilité et debugging';
COMMENT ON COLUMN payment_callbacks.bill_id IS 'Identifiant unique de la facture eBilling';
COMMENT ON COLUMN payment_callbacks.status IS 'Statut du paiement: SUCCESS, FAILED, ou PENDING';
COMMENT ON COLUMN payment_callbacks.raw_payload IS 'Payload JSON complet reçu d''eBilling pour debugging';
COMMENT ON COLUMN payment_callbacks.processed IS 'Indique si le callback a été traité avec succès';






















