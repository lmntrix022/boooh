-- Migration pour ajouter la colonne party_theme_id à business_cards
-- Date: 2024-12-06

-- Ajouter la colonne party_theme_id à la table business_cards
ALTER TABLE business_cards 
ADD COLUMN IF NOT EXISTS party_theme_id UUID REFERENCES themes_party(id) ON DELETE SET NULL;

-- Ajouter un index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_business_cards_party_theme_id ON business_cards(party_theme_id);

-- Ajouter un commentaire pour expliquer la colonne
COMMENT ON COLUMN business_cards.party_theme_id IS 'Référence vers le thème de fête actuellement appliqué à cette carte';
