-- Migration pour ajouter le support de plusieurs images par produit
-- Date: 2025-01-14
-- Support de 1 à 4 images par produit physique

-- 1. Ajouter le champ images (tableau JSONB) à la table products
-- Ce champ stockera un tableau d'objets avec url, alt, order
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- 2. Créer un index pour optimiser les requêtes sur les images
CREATE INDEX IF NOT EXISTS idx_products_images ON public.products USING gin(images);

-- 3. Fonction pour valider le format des images (1-4 images max)
CREATE OR REPLACE FUNCTION validate_product_images()
RETURNS TRIGGER AS $$
BEGIN
    -- Vérifier que images est un tableau
    IF NEW.images IS NOT NULL AND jsonb_typeof(NEW.images) != 'array' THEN
        RAISE EXCEPTION 'images must be a JSON array';
    END IF;

    -- Vérifier le nombre d'images (max 4)
    IF NEW.images IS NOT NULL AND jsonb_array_length(NEW.images) > 4 THEN
        RAISE EXCEPTION 'Maximum 4 images allowed per product';
    END IF;

    -- Vérifier le nombre minimum d'images (au moins 1 si le champ images est utilisé)
    IF NEW.images IS NOT NULL AND jsonb_array_length(NEW.images) > 0 AND jsonb_array_length(NEW.images) < 1 THEN
        RAISE EXCEPTION 'At least 1 image required when using images field';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Créer le trigger pour valider les images avant insert/update
DROP TRIGGER IF EXISTS validate_product_images_trigger ON public.products;
CREATE TRIGGER validate_product_images_trigger
    BEFORE INSERT OR UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION validate_product_images();

-- 5. Migrer les données existantes: convertir image_url en images[0] si images est vide
UPDATE public.products
SET images = jsonb_build_array(
    jsonb_build_object(
        'url', image_url,
        'alt', name,
        'order', 0
    )
)
WHERE image_url IS NOT NULL
  AND image_url != ''
  AND (images IS NULL OR images = '[]'::jsonb);

-- 6. Ajouter un commentaire sur la colonne pour documenter le format
COMMENT ON COLUMN public.products.images IS 'Array of product images (1-4 max). Format: [{"url": "...", "alt": "...", "order": 0}, ...]';

-- 7. Créer une vue pour faciliter l'accès aux images
CREATE OR REPLACE VIEW public.products_with_images AS
SELECT
    p.*,
    COALESCE(
        (SELECT jsonb_agg(img ORDER BY (img->>'order')::int)
         FROM jsonb_array_elements(p.images) img),
        '[]'::jsonb
    ) as sorted_images,
    CASE
        WHEN p.images IS NOT NULL AND jsonb_array_length(p.images) > 0
        THEN (p.images->0->>'url')::text
        ELSE p.image_url
    END as primary_image_url
FROM public.products p;

-- 8. Fonction helper pour obtenir l'URL de la première image
CREATE OR REPLACE FUNCTION get_product_primary_image(product_id UUID)
RETURNS TEXT AS $$
DECLARE
    primary_url TEXT;
BEGIN
    SELECT
        CASE
            WHEN images IS NOT NULL AND jsonb_array_length(images) > 0
            THEN (images->0->>'url')::text
            ELSE image_url
        END
    INTO primary_url
    FROM public.products
    WHERE id = product_id;

    RETURN primary_url;
END;
$$ LANGUAGE plpgsql;

-- 9. Fonction helper pour ajouter une image à un produit
CREATE OR REPLACE FUNCTION add_product_image(
    p_product_id UUID,
    p_image_url TEXT,
    p_alt TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    current_images JSONB;
    new_order INT;
    new_images JSONB;
BEGIN
    -- Récupérer les images actuelles
    SELECT COALESCE(images, '[]'::jsonb) INTO current_images
    FROM public.products
    WHERE id = p_product_id;

    -- Vérifier qu'on ne dépasse pas 4 images
    IF jsonb_array_length(current_images) >= 4 THEN
        RAISE EXCEPTION 'Maximum 4 images per product';
    END IF;

    -- Calculer le nouvel ordre
    new_order := jsonb_array_length(current_images);

    -- Ajouter la nouvelle image
    new_images := current_images || jsonb_build_array(
        jsonb_build_object(
            'url', p_image_url,
            'alt', COALESCE(p_alt, ''),
            'order', new_order
        )
    );

    -- Mettre à jour le produit
    UPDATE public.products
    SET images = new_images
    WHERE id = p_product_id;

    RETURN new_images;
END;
$$ LANGUAGE plpgsql;

-- 10. Fonction helper pour supprimer une image d'un produit
CREATE OR REPLACE FUNCTION remove_product_image(
    p_product_id UUID,
    p_image_order INT
)
RETURNS JSONB AS $$
DECLARE
    current_images JSONB;
    new_images JSONB;
BEGIN
    -- Récupérer les images actuelles
    SELECT COALESCE(images, '[]'::jsonb) INTO current_images
    FROM public.products
    WHERE id = p_product_id;

    -- Filtrer l'image à supprimer et réordonner
    SELECT jsonb_agg(
        jsonb_set(
            img,
            '{order}',
            to_jsonb((row_number() OVER () - 1)::int)
        )
    )
    INTO new_images
    FROM jsonb_array_elements(current_images) img
    WHERE (img->>'order')::int != p_image_order;

    -- Mettre à jour le produit
    UPDATE public.products
    SET images = COALESCE(new_images, '[]'::jsonb)
    WHERE id = p_product_id;

    RETURN COALESCE(new_images, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- 11. Fonction helper pour réordonner les images
CREATE OR REPLACE FUNCTION reorder_product_images(
    p_product_id UUID,
    p_new_order INT[]
)
RETURNS JSONB AS $$
DECLARE
    current_images JSONB;
    new_images JSONB;
    img JSONB;
    i INT;
BEGIN
    -- Récupérer les images actuelles
    SELECT COALESCE(images, '[]'::jsonb) INTO current_images
    FROM public.products
    WHERE id = p_product_id;

    -- Vérifier que le nombre d'éléments correspond
    IF array_length(p_new_order, 1) != jsonb_array_length(current_images) THEN
        RAISE EXCEPTION 'Order array length must match number of images';
    END IF;

    -- Créer le nouveau tableau réordonné
    new_images := '[]'::jsonb;
    FOREACH i IN ARRAY p_new_order LOOP
        img := current_images->i;
        img := jsonb_set(img, '{order}', to_jsonb(array_position(p_new_order, i) - 1));
        new_images := new_images || jsonb_build_array(img);
    END LOOP;

    -- Mettre à jour le produit
    UPDATE public.products
    SET images = new_images
    WHERE id = p_product_id;

    RETURN new_images;
END;
$$ LANGUAGE plpgsql;
