-- Migration pour lier les factures aux demandes de produits (product_inquiries et digital_inquiries)
-- Date: 2025-01-13
-- Description: Ajoute les colonnes invoice_id aux tables product_inquiries et digital_inquiries

-- Ajouter invoice_id à product_inquiries
ALTER TABLE product_inquiries
ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;

-- Ajouter invoice_id à digital_inquiries
ALTER TABLE digital_inquiries
ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;

-- Ajouter des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_product_inquiries_invoice_id ON product_inquiries(invoice_id);
CREATE INDEX IF NOT EXISTS idx_digital_inquiries_invoice_id ON digital_inquiries(invoice_id);

-- Ajouter des index sur le statut pour les requêtes de commandes non facturées
CREATE INDEX IF NOT EXISTS idx_product_inquiries_status ON product_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_digital_inquiries_status ON digital_inquiries(status);

-- Commentaires pour documentation
COMMENT ON COLUMN product_inquiries.invoice_id IS 'Référence vers la facture générée pour cette demande de produit';
COMMENT ON COLUMN digital_inquiries.invoice_id IS 'Référence vers la facture générée pour cette demande de produit numérique';
