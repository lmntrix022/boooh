-- Migration: Ajout de champs contact alternatifs (email_alt, phone_alt)
-- Date: 2025-12-04
-- Description: Support multi-valeurs pour emails et téléphones dans les contacts scannés

-- Ajouter colonne email_alt à scanned_contacts
ALTER TABLE scanned_contacts
ADD COLUMN IF NOT EXISTS email_alt TEXT;

-- Ajouter colonne phone_alt à scanned_contacts  
ALTER TABLE scanned_contacts
ADD COLUMN IF NOT EXISTS phone_alt TEXT;

-- Créer index pour recherche par email alternatif
CREATE INDEX IF NOT EXISTS idx_scanned_contacts_email_alt 
ON scanned_contacts(email_alt) 
WHERE email_alt IS NOT NULL;

-- Créer index pour recherche par téléphone alternatif
CREATE INDEX IF NOT EXISTS idx_scanned_contacts_phone_alt 
ON scanned_contacts(phone_alt) 
WHERE phone_alt IS NOT NULL;

-- Ajouter commentaires pour documentation
COMMENT ON COLUMN scanned_contacts.email_alt IS 'Email secondaire du contact (détecté automatiquement par OCR)';
COMMENT ON COLUMN scanned_contacts.phone_alt IS 'Téléphone secondaire du contact (détecté automatiquement par OCR)';

-- Mettre à jour la politique RLS pour inclure les nouveaux champs dans les recherches
-- (Les politiques existantes s'appliquent automatiquement aux nouvelles colonnes)

-- Logs pour confirmation
DO $$
BEGIN
  RAISE NOTICE 'Migration 20251204_add_alt_contact_fields: Colonnes email_alt et phone_alt ajoutées avec succès';
END $$;




