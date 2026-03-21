-- Migration pour ajouter un champ slug aux cartes de visite
-- Date: 2025-01-27
-- Description: Permet d'utiliser des URLs avec slug au lieu de l'UUID (ex: /card/john-doe au lieu de /card/uuid)

-- =====================================================
-- 1. AJOUTER LA COLONNE SLUG
-- =====================================================

ALTER TABLE public.business_cards
ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- =====================================================
-- 2. CRÉER UN INDEX UNIQUE POUR LE SLUG
-- =====================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_business_cards_slug_unique 
ON public.business_cards(slug) 
WHERE slug IS NOT NULL;

-- =====================================================
-- 3. CRÉER UNE FONCTION POUR GÉNÉRER UN SLUG À PARTIR D'UN NOM
-- =====================================================

CREATE OR REPLACE FUNCTION generate_slug_from_name(name_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  slug_text TEXT;
  base_slug TEXT;
  counter INTEGER := 0;
  final_slug TEXT;
BEGIN
  -- Normaliser le nom : minuscules, remplacer accents, espaces par tirets
  slug_text := LOWER(name_text);
  
  -- Remplacer les caractères accentués
  slug_text := TRANSLATE(slug_text, 
    'àáâãäåèéêëìíîïòóôõöùúûüýÿñç', 
    'aaaaaaeeeeiiiioooouuuuyync'
  );
  
  -- Remplacer les espaces et caractères spéciaux par des tirets
  slug_text := REGEXP_REPLACE(slug_text, '[^a-z0-9]+', '-', 'g');
  
  -- Supprimer les tirets en début et fin
  slug_text := TRIM(BOTH '-' FROM slug_text);
  
  -- Limiter la longueur à 100 caractères
  slug_text := LEFT(slug_text, 100);
  
  base_slug := slug_text;
  final_slug := slug_text;
  
  -- Vérifier l'unicité et ajouter un suffixe numérique si nécessaire
  WHILE EXISTS (SELECT 1 FROM public.business_cards WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter::TEXT;
    -- Limiter à 100 caractères au total
    IF LENGTH(final_slug) > 100 THEN
      final_slug := LEFT(base_slug, 100 - LENGTH(counter::TEXT) - 1) || '-' || counter::TEXT;
    END IF;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- =====================================================
-- 4. GÉNÉRER LES SLUGS POUR LES CARTES EXISTANTES
-- =====================================================

UPDATE public.business_cards
SET slug = generate_slug_from_name(name)
WHERE slug IS NULL AND name IS NOT NULL AND name != '';

-- =====================================================
-- 5. CRÉER UN TRIGGER POUR GÉNÉRER AUTOMATIQUEMENT LE SLUG
-- =====================================================

CREATE OR REPLACE FUNCTION auto_generate_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Pour INSERT (futures cartes) : générer le slug si le nom existe et le slug est vide
  IF TG_OP = 'INSERT' THEN
    IF (NEW.name IS NOT NULL AND NEW.name != '') AND 
       (NEW.slug IS NULL OR NEW.slug = '') THEN
      NEW.slug := generate_slug_from_name(NEW.name);
    END IF;
  END IF;
  
  -- Pour UPDATE : générer le slug si le nom change ou si le slug est vide
  IF TG_OP = 'UPDATE' THEN
    IF (NEW.name IS NOT NULL AND NEW.name != '') AND 
       (NEW.slug IS NULL OR NEW.slug = '' OR OLD.name IS DISTINCT FROM NEW.name) THEN
      NEW.slug := generate_slug_from_name(NEW.name);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_slug ON public.business_cards;
CREATE TRIGGER trigger_auto_generate_slug
  BEFORE INSERT OR UPDATE ON public.business_cards
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_slug();

-- =====================================================
-- 6. CRÉER UNE FONCTION POUR TROUVER UNE CARTE PAR SLUG OU ID
-- =====================================================

CREATE OR REPLACE FUNCTION get_card_by_identifier(identifier TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug VARCHAR,
  is_public BOOLEAN,
  user_id UUID
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bc.id,
    bc.name,
    bc.slug,
    bc.is_public,
    bc.user_id
  FROM public.business_cards bc
  WHERE (bc.id::TEXT = identifier OR bc.slug = identifier)
  LIMIT 1;
END;
$$;

