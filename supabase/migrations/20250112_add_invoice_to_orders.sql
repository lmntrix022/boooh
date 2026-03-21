-- Migration pour lier les commandes aux factures
-- Date: 2025-01-12
-- Description: Ajout du champ invoice_id dans les tables de commandes (inquiries)

-- Ajouter la colonne invoice_id dans product_inquiries si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'product_inquiries'
        AND column_name = 'invoice_id'
    ) THEN
        ALTER TABLE product_inquiries
        ADD COLUMN invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;

        -- Créer un index pour améliorer les performances
        CREATE INDEX idx_product_inquiries_invoice_id ON product_inquiries(invoice_id);

        -- Commentaire
        COMMENT ON COLUMN product_inquiries.invoice_id IS 'Référence vers la facture associée à cette commande';
    END IF;
END $$;

-- Ajouter la colonne invoice_id dans digital_inquiries si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'digital_inquiries'
        AND column_name = 'invoice_id'
    ) THEN
        ALTER TABLE digital_inquiries
        ADD COLUMN invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;

        -- Créer un index pour améliorer les performances
        CREATE INDEX idx_digital_inquiries_invoice_id ON digital_inquiries(invoice_id);

        -- Commentaire
        COMMENT ON COLUMN digital_inquiries.invoice_id IS 'Référence vers la facture associée à cette commande';
    END IF;
END $$;
