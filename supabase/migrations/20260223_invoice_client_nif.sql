-- Migration: NIF client sur les factures (pour QR Code DGI)
-- Le NIF du client permet une facturation conforme et une vérification par l'administration fiscale

ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS client_nif TEXT;

COMMENT ON COLUMN invoices.client_nif IS 'NIF du client (Numéro d''Identification Fiscale) - utilisé pour le QR Code DGI';
