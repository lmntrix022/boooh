-- Migration pour ajouter la colonne metadata JSONB à la table profiles
-- Date: 2025-01-27
-- Description: Permet de stocker des métadonnées flexibles, notamment les informations d'entreprise

-- Ajouter la colonne metadata si elle n'existe pas
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Créer un index GIN pour les recherches dans metadata
CREATE INDEX IF NOT EXISTS idx_profiles_metadata ON public.profiles USING GIN (metadata);

-- Commentaire pour la documentation
COMMENT ON COLUMN public.profiles.metadata IS 'Métadonnées JSON flexibles (business_info, preferences, etc.)';



