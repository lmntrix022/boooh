-- Migration pour s'assurer que la table content_items existe avec tous les éléments nécessaires
-- Date: 2025-10-29

-- 1. Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.content_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('image', 'article', 'product', 'other')),
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('published', 'draft', 'archived')),
    content TEXT,
    metadata JSONB DEFAULT '{}',
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ajouter les colonnes manquantes si elles n'existent pas
DO $$ 
BEGIN
    -- Vérifier et ajouter des colonnes supplémentaires si nécessaire
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'content_items' 
                   AND column_name = 'slug') THEN
        ALTER TABLE public.content_items ADD COLUMN slug VARCHAR(255);
    END IF;
END $$;

-- 3. Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_content_items_author_id ON public.content_items(author_id);
CREATE INDEX IF NOT EXISTS idx_content_items_type ON public.content_items(type);
CREATE INDEX IF NOT EXISTS idx_content_items_status ON public.content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_items_created_at ON public.content_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_items_slug ON public.content_items(slug) WHERE slug IS NOT NULL;

-- Index GIN pour les métadonnées JSONB (recherche dans metadata)
CREATE INDEX IF NOT EXISTS idx_content_items_metadata ON public.content_items USING GIN (metadata);

-- 4. Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_content_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger s'il n'existe pas
DROP TRIGGER IF EXISTS update_content_items_updated_at_trigger ON public.content_items;
CREATE TRIGGER update_content_items_updated_at_trigger
    BEFORE UPDATE ON public.content_items
    FOR EACH ROW
    EXECUTE FUNCTION update_content_items_updated_at();

-- 5. Fonction pour générer un slug à partir du titre
CREATE OR REPLACE FUNCTION generate_content_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(
        regexp_replace(
            regexp_replace(
                regexp_replace(trim(title), '[^a-zA-Z0-9\s-]', '', 'g'),
                '\s+', '-', 'g'
            ),
            '-+', '-', 'g'
        )
    );
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger pour générer automatiquement le slug si vide
CREATE OR REPLACE FUNCTION auto_generate_content_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug = generate_content_slug(NEW.title);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_generate_content_slug_trigger ON public.content_items;
CREATE TRIGGER auto_generate_content_slug_trigger
    BEFORE INSERT OR UPDATE ON public.content_items
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_content_slug();

-- 7. RLS (Row Level Security)
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

-- 8. Politiques RLS pour content_items

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Content items are viewable by everyone when published" ON public.content_items;
DROP POLICY IF EXISTS "Users can view their own content items" ON public.content_items;
DROP POLICY IF EXISTS "Users can create content items" ON public.content_items;
DROP POLICY IF EXISTS "Users can update their own content items" ON public.content_items;
DROP POLICY IF EXISTS "Users can delete their own content items" ON public.content_items;
DROP POLICY IF EXISTS "Admins can view all content items" ON public.content_items;
DROP POLICY IF EXISTS "Admins can update all content items" ON public.content_items;
DROP POLICY IF EXISTS "Admins can delete all content items" ON public.content_items;

-- Politiques pour les utilisateurs
-- SELECT: Les articles publiés sont visibles par tous, les brouillons uniquement par l'auteur et les admins
CREATE POLICY "Content items are viewable by everyone when published"
    ON public.content_items
    FOR SELECT
    USING (
        status = 'published' 
        OR author_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- INSERT: Les utilisateurs authentifiés peuvent créer du contenu
CREATE POLICY "Users can create content items"
    ON public.content_items
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND author_id = auth.uid());

-- UPDATE: Les utilisateurs peuvent modifier leur propre contenu, les admins peuvent tout modifier
CREATE POLICY "Users can update their own content items"
    ON public.content_items
    FOR UPDATE
    USING (
        author_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    )
    WITH CHECK (
        author_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- DELETE: Les utilisateurs peuvent supprimer leur propre contenu, les admins peuvent tout supprimer
CREATE POLICY "Users can delete their own content items"
    ON public.content_items
    FOR DELETE
    USING (
        author_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 9. Commentaires pour la documentation
COMMENT ON TABLE public.content_items IS 'Table pour stocker les articles de blog et autres contenus';
COMMENT ON COLUMN public.content_items.title IS 'Titre du contenu';
COMMENT ON COLUMN public.content_items.type IS 'Type de contenu: article, image, product, other';
COMMENT ON COLUMN public.content_items.status IS 'Statut: published, draft, archived';
COMMENT ON COLUMN public.content_items.content IS 'Contenu HTML ou texte brut';
COMMENT ON COLUMN public.content_items.metadata IS 'Métadonnées JSON: summary, tags, image, readTime, author, date, featured';
COMMENT ON COLUMN public.content_items.slug IS 'Slug URL-friendly généré automatiquement depuis le titre';

