-- Création de la table media_content pour gérer les médias des cartes
CREATE TABLE IF NOT EXISTS public.media_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID NOT NULL REFERENCES public.business_cards(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('youtube', 'tiktok', 'vimeo', 'soundcloud', 'spotify', 'audio_file', 'video_file')),
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INTEGER, -- en secondes
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb, -- données spécifiques par type
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_media_content_card_id ON public.media_content(card_id);
CREATE INDEX IF NOT EXISTS idx_media_content_type ON public.media_content(type);
CREATE INDEX IF NOT EXISTS idx_media_content_order ON public.media_content(card_id, order_index);
CREATE INDEX IF NOT EXISTS idx_media_content_active ON public.media_content(is_active);

-- Index GIN pour les métadonnées JSONB
CREATE INDEX IF NOT EXISTS idx_media_content_metadata ON public.media_content USING GIN (metadata);

-- RLS (Row Level Security)
ALTER TABLE public.media_content ENABLE ROW LEVEL SECURITY;

-- Politiques pour media_content
CREATE POLICY "Media content is viewable by everyone" ON public.media_content
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can create media content for their own cards" ON public.media_content
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.business_cards 
            WHERE id = card_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update media content for their own cards" ON public.media_content
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.business_cards 
            WHERE id = card_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete media content for their own cards" ON public.media_content
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.business_cards 
            WHERE id = card_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all media content" ON public.media_content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_media_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour maintenir updated_at à jour
CREATE TRIGGER trigger_update_media_content_updated_at
    BEFORE UPDATE ON public.media_content
    FOR EACH ROW
    EXECUTE FUNCTION update_media_content_updated_at();

-- Fonction pour réorganiser automatiquement les order_index
CREATE OR REPLACE FUNCTION reorder_media_content()
RETURNS TRIGGER AS $$
BEGIN
    -- Réorganiser les order_index après suppression
    IF TG_OP = 'DELETE' THEN
        UPDATE public.media_content 
        SET order_index = order_index - 1
        WHERE card_id = OLD.card_id 
        AND order_index > OLD.order_index;
        RETURN OLD;
    END IF;
    
    -- Réorganiser les order_index après insertion
    IF TG_OP = 'INSERT' THEN
        -- Si order_index n'est pas spécifié, le mettre à la fin
        IF NEW.order_index IS NULL OR NEW.order_index = 0 THEN
            SELECT COALESCE(MAX(order_index), 0) + 1 
            INTO NEW.order_index
            FROM public.media_content 
            WHERE card_id = NEW.card_id;
        END IF;
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour réorganiser automatiquement
CREATE TRIGGER trigger_reorder_media_content
    AFTER INSERT OR DELETE ON public.media_content
    FOR EACH ROW
    EXECUTE FUNCTION reorder_media_content();

-- Commentaires pour la documentation
COMMENT ON TABLE public.media_content IS 'Table pour stocker le contenu média des cartes de visite';
COMMENT ON COLUMN public.media_content.type IS 'Type de média: youtube, tiktok, vimeo, soundcloud, spotify, audio_file, video_file';
COMMENT ON COLUMN public.media_content.metadata IS 'Métadonnées spécifiques au type de média (ex: video_id pour YouTube)';
COMMENT ON COLUMN public.media_content.order_index IS 'Ordre d''affichage des médias sur la carte';
