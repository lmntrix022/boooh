-- Migration: Ajout du support d'images pour les services portfolio
-- Date: 2025-12-05
-- Description: Ajoute une colonne image_urls pour stocker les URLs d'images des services

-- Ajouter colonne image_urls (tableau de texte)
ALTER TABLE portfolio_services
ADD COLUMN IF NOT EXISTS image_urls TEXT[];

-- Créer index pour recherche
CREATE INDEX IF NOT EXISTS idx_portfolio_services_images 
ON portfolio_services USING GIN (image_urls)
WHERE image_urls IS NOT NULL;

-- Commentaire pour documentation
COMMENT ON COLUMN portfolio_services.image_urls IS 'URLs des images associées au service (max 5 images recommandé)';

-- Logs pour confirmation
DO $$
BEGIN
  RAISE NOTICE 'Migration 20251205_add_images_to_portfolio_services: Colonne image_urls ajoutée avec succès';
END $$;



