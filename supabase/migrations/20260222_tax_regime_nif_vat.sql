-- Migration: Régimes fiscaux DGI + NIF / N° TVA
-- Régime TVA+CSS (CA>60M), Régime CSS seul (CA 30-60M), Régime Précompte TPS (CA<30M)

ALTER TABLE invoice_settings
ADD COLUMN IF NOT EXISTS tax_regime TEXT DEFAULT 'tva_css'
  CHECK (tax_regime IN ('tva_css', 'css_only', 'precompte')),
ADD COLUMN IF NOT EXISTS company_nif TEXT,
ADD COLUMN IF NOT EXISTS company_vat_number TEXT;

COMMENT ON COLUMN invoice_settings.tax_regime IS 'Régime fiscal: tva_css (CA>60M), css_only (CA 30-60M), precompte (CA<30M)';
COMMENT ON COLUMN invoice_settings.company_nif IS 'Numéro d''Identification Fiscale (NIF)';
COMMENT ON COLUMN invoice_settings.company_vat_number IS 'Numéro de TVA';
