-- Migration pour créer les tables de facturation
-- Date: 2025-01-12
-- Description: Création des tables invoice_settings, invoices, et invoice_items

-- Table: invoice_settings
-- Stocke les paramètres de facturation pour chaque utilisateur
CREATE TABLE IF NOT EXISTS invoice_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    default_vat_rate NUMERIC(5,2) DEFAULT 18.00,
    prefix TEXT DEFAULT 'FAC-2025-',
    next_number INTEGER DEFAULT 1,
    legal_mentions TEXT,
    bank_details TEXT,
    logo_url TEXT,
    pdf_template TEXT DEFAULT 'modern' CHECK (pdf_template IN ('modern', 'minimal', 'classic')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Table: invoices
-- Stocke les factures
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    client_email TEXT,
    client_address TEXT,
    client_phone TEXT,
    order_id UUID,
    invoice_number TEXT NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    vat_rate NUMERIC(5,2) DEFAULT 18.00,
    total_ht NUMERIC(12,2) DEFAULT 0,
    total_vat NUMERIC(12,2) DEFAULT 0,
    total_ttc NUMERIC(12,2) DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled', 'overdue')),
    payment_method TEXT,
    payment_date DATE,
    pdf_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, invoice_number)
);

-- Table: invoice_items
-- Stocke les lignes de facturation
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC(10,2) DEFAULT 1,
    unit_price_ht NUMERIC(12,2) DEFAULT 0,
    vat_rate NUMERIC(5,2) DEFAULT 18.00,
    total_ht NUMERIC(12,2) DEFAULT 0,
    total_vat NUMERIC(12,2) DEFAULT 0,
    total_ttc NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_invoice_settings_user_id ON invoice_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoice_settings_updated_at
    BEFORE UPDATE ON invoice_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) Policies
ALTER TABLE invoice_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Policies pour invoice_settings
CREATE POLICY "Users can view their own invoice settings"
    ON invoice_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoice settings"
    ON invoice_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoice settings"
    ON invoice_settings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoice settings"
    ON invoice_settings FOR DELETE
    USING (auth.uid() = user_id);

-- Policies pour invoices
CREATE POLICY "Users can view their own invoices"
    ON invoices FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices"
    ON invoices FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices"
    ON invoices FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices"
    ON invoices FOR DELETE
    USING (auth.uid() = user_id);

-- Policies pour invoice_items
CREATE POLICY "Users can view invoice items of their invoices"
    ON invoice_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM invoices
            WHERE invoices.id = invoice_items.invoice_id
            AND invoices.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert invoice items for their invoices"
    ON invoice_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM invoices
            WHERE invoices.id = invoice_items.invoice_id
            AND invoices.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update invoice items of their invoices"
    ON invoice_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM invoices
            WHERE invoices.id = invoice_items.invoice_id
            AND invoices.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete invoice items of their invoices"
    ON invoice_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM invoices
            WHERE invoices.id = invoice_items.invoice_id
            AND invoices.user_id = auth.uid()
        )
    );

-- Fonction pour vérifier les factures en retard et mettre à jour le statut
CREATE OR REPLACE FUNCTION update_overdue_invoices()
RETURNS void AS $$
BEGIN
    UPDATE invoices
    SET status = 'overdue'
    WHERE status = 'sent'
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Commentaires pour documentation
COMMENT ON TABLE invoice_settings IS 'Paramètres de facturation par utilisateur';
COMMENT ON TABLE invoices IS 'Factures générées par les utilisateurs';
COMMENT ON TABLE invoice_items IS 'Lignes de produits/services dans les factures';
COMMENT ON COLUMN invoices.status IS 'Statut: draft, sent, paid, cancelled, overdue';
COMMENT ON COLUMN invoices.total_ht IS 'Total Hors Taxes';
COMMENT ON COLUMN invoices.total_vat IS 'Total TVA';
COMMENT ON COLUMN invoices.total_ttc IS 'Total Toutes Taxes Comprises';
