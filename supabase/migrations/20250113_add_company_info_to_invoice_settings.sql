-- Migration pour ajouter les informations d'entreprise aux paramètres de facturation
-- Date: 2025-01-13
-- Description: Ajoute les colonnes company_name, company_siret, company_address, company_phone, company_email, company_website

ALTER TABLE invoice_settings
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS company_siret TEXT,
ADD COLUMN IF NOT EXISTS company_address TEXT,
ADD COLUMN IF NOT EXISTS company_phone TEXT,
ADD COLUMN IF NOT EXISTS company_email TEXT,
ADD COLUMN IF NOT EXISTS company_website TEXT;

-- Commentaires pour documentation
COMMENT ON COLUMN invoice_settings.company_name IS 'Nom ou raison sociale de l''entreprise';
COMMENT ON COLUMN invoice_settings.company_siret IS 'Numéro SIRET ou identifiant d''entreprise';
COMMENT ON COLUMN invoice_settings.company_address IS 'Adresse complète de l''entreprise';
COMMENT ON COLUMN invoice_settings.company_phone IS 'Numéro de téléphone de l''entreprise';
COMMENT ON COLUMN invoice_settings.company_email IS 'Email de contact de l''entreprise';
COMMENT ON COLUMN invoice_settings.company_website IS 'Site web de l''entreprise';
