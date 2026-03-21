-- Migration pour ajouter la CSS (Contribution à la Solidarité Sociale) aux factures
-- Date: 2025-10-24
-- Description: Ajout du champ total_css aux factures et apply_css aux paramètres
-- La CSS est une taxe de 1% applicable sur le total HT de toutes les factures

-- Ajouter le champ total_css à la table invoices
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS total_css NUMERIC(12,2) DEFAULT 0;

-- Ajouter le champ apply_css à la table invoice_settings
ALTER TABLE invoice_settings
ADD COLUMN IF NOT EXISTS apply_css BOOLEAN DEFAULT true;

-- Commentaires pour documentation
COMMENT ON COLUMN invoices.total_css IS 'Total CSS (Contribution à la Solidarité Sociale - 1% sur total HT)';
COMMENT ON COLUMN invoice_settings.apply_css IS 'Activer/désactiver l''application de la CSS (1%) sur les factures';

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_invoices_has_css ON invoices(total_css) WHERE total_css > 0;
