-- Migration pour ajouter la TPS (Taxe sur les Prestations de Services) aux factures
-- Date: 2025-10-13
-- Description: Ajout du champ total_tps aux factures et is_service aux items
-- La TPS est un précompte impôt de 9,5% applicable uniquement sur les prestations de services

-- Ajouter le champ total_tps à la table invoices
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS total_tps NUMERIC(12,2) DEFAULT 0;

-- Ajouter le champ is_service à la table invoice_items pour identifier les prestations de services
ALTER TABLE invoice_items
ADD COLUMN IF NOT EXISTS is_service BOOLEAN DEFAULT false;

-- Commentaires pour documentation
COMMENT ON COLUMN invoices.total_tps IS 'Total TPS (Taxe sur les Prestations de Services - 9,5% sur prestations de services uniquement)';
COMMENT ON COLUMN invoice_items.is_service IS 'Indique si l''article est une prestation de service (applicable pour la TPS de 9,5%)';

-- Index pour améliorer les performances des requêtes filtrant par type de service
CREATE INDEX IF NOT EXISTS idx_invoice_items_is_service ON invoice_items(is_service);
