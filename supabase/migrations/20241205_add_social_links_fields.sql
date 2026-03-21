-- Ajouter les champs manquants à la table social_links
-- Date: 2024-12-05
-- Ajout des champs label et image pour supporter les sites web avec images

-- Ajouter le champ label pour le nom du site web
ALTER TABLE public.social_links 
ADD COLUMN IF NOT EXISTS label TEXT;

-- Ajouter le champ image pour l'URL de l'image du site web
ALTER TABLE public.social_links 
ADD COLUMN IF NOT EXISTS image TEXT;

-- Ajouter des commentaires pour documenter les nouveaux champs
COMMENT ON COLUMN public.social_links.label IS 'Nom du site web (pour platform = website)';
COMMENT ON COLUMN public.social_links.image IS 'URL de l''image du site web (pour platform = website)';

-- Créer un index pour optimiser les requêtes sur le platform
CREATE INDEX IF NOT EXISTS idx_social_links_platform ON public.social_links(platform);

-- Créer un index pour optimiser les requêtes sur card_id et platform
CREATE INDEX IF NOT EXISTS idx_social_links_card_platform ON public.social_links(card_id, platform);
