-- Ajout des avis sur les professionnels
CREATE TABLE IF NOT EXISTS public.professional_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    professional_id UUID NOT NULL REFERENCES public.business_cards(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewer_name TEXT NOT NULL,
    reviewer_email TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,
    images TEXT[], -- URLs des images
    helpful_votes INTEGER DEFAULT 0,
    is_verified_contact BOOLEAN DEFAULT false, -- A eu un contact avec le pro
    is_approved BOOLEAN DEFAULT false,
    is_flagged BOOLEAN DEFAULT false,
    flag_reason TEXT,
    review_type TEXT DEFAULT 'general', -- 'general', 'service', 'communication', 'professionalism'
    service_category TEXT, -- Pour catégoriser le type de service
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_professional_reviews_professional_id ON public.professional_reviews(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_reviews_reviewer_id ON public.professional_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_professional_reviews_rating ON public.professional_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_professional_reviews_created_at ON public.professional_reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_professional_reviews_is_approved ON public.professional_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_professional_reviews_review_type ON public.professional_reviews(review_type);

-- Table pour les votes sur les avis de pros
CREATE TABLE IF NOT EXISTS public.professional_review_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID NOT NULL REFERENCES public.professional_reviews(id) ON DELETE CASCADE,
    voter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    voter_ip INET,
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(review_id, voter_id, voter_ip)
);

-- Index pour les votes
CREATE INDEX IF NOT EXISTS idx_professional_review_votes_review_id ON public.professional_review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_professional_review_votes_voter_id ON public.professional_review_votes(voter_id);

-- Fonction pour mettre à jour le nombre de votes utiles pour les avis de pros
CREATE OR REPLACE FUNCTION update_professional_review_helpful_votes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.professional_reviews 
        SET helpful_votes = (
            SELECT COUNT(*) 
            FROM public.professional_review_votes 
            WHERE review_id = NEW.review_id AND is_helpful = true
        )
        WHERE id = NEW.review_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.professional_reviews 
        SET helpful_votes = (
            SELECT COUNT(*) 
            FROM public.professional_review_votes 
            WHERE review_id = OLD.review_id AND is_helpful = true
        )
        WHERE id = OLD.review_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour maintenir le compteur de votes à jour
CREATE TRIGGER trigger_update_professional_review_helpful_votes
    AFTER INSERT OR DELETE ON public.professional_review_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_professional_review_helpful_votes();

-- Fonction pour calculer la note moyenne d'un professionnel
CREATE OR REPLACE FUNCTION get_professional_average_rating(professional_uuid UUID)
RETURNS TABLE(
    average_rating DECIMAL(3,2),
    total_reviews INTEGER,
    rating_distribution JSON,
    review_type_distribution JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROUND(AVG(pr.rating)::DECIMAL, 2) as average_rating,
        COUNT(*)::INTEGER as total_reviews,
        json_build_object(
            '1', COUNT(*) FILTER (WHERE pr.rating = 1),
            '2', COUNT(*) FILTER (WHERE pr.rating = 2),
            '3', COUNT(*) FILTER (WHERE pr.rating = 3),
            '4', COUNT(*) FILTER (WHERE pr.rating = 4),
            '5', COUNT(*) FILTER (WHERE pr.rating = 5)
        ) as rating_distribution,
        json_build_object(
            'general', COUNT(*) FILTER (WHERE pr.review_type = 'general'),
            'service', COUNT(*) FILTER (WHERE pr.review_type = 'service'),
            'communication', COUNT(*) FILTER (WHERE pr.review_type = 'communication'),
            'professionalism', COUNT(*) FILTER (WHERE pr.review_type = 'professionalism')
        ) as review_type_distribution
    FROM public.professional_reviews pr
    WHERE pr.professional_id = professional_uuid 
    AND pr.is_approved = true;
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security)
ALTER TABLE public.professional_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_review_votes ENABLE ROW LEVEL SECURITY;

-- Politiques pour professional_reviews
CREATE POLICY "Professional reviews are viewable by everyone" ON public.professional_reviews
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can create professional reviews" ON public.professional_reviews
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own professional reviews" ON public.professional_reviews
    FOR UPDATE USING (auth.uid() = reviewer_id);

CREATE POLICY "Admins can manage all professional reviews" ON public.professional_reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Politiques pour professional_review_votes
CREATE POLICY "Professional review votes are viewable by everyone" ON public.professional_review_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can create professional review votes" ON public.professional_review_votes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own professional review votes" ON public.professional_review_votes
    FOR UPDATE USING (auth.uid() = voter_id);

CREATE POLICY "Admins can manage all professional review votes" ON public.professional_review_votes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Ajouter des colonnes pour les statistiques d'avis dans business_cards
ALTER TABLE public.business_cards 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_review_at TIMESTAMP WITH TIME ZONE;

-- Fonction pour mettre à jour automatiquement les stats d'un pro
CREATE OR REPLACE FUNCTION update_professional_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour les statistiques du professionnel
    UPDATE public.business_cards 
    SET 
        average_rating = (
            SELECT COALESCE(AVG(rating), 0) 
            FROM public.professional_reviews 
            WHERE professional_id = NEW.professional_id AND is_approved = true
        ),
        total_reviews = (
            SELECT COUNT(*) 
            FROM public.professional_reviews 
            WHERE professional_id = NEW.professional_id AND is_approved = true
        ),
        last_review_at = NEW.created_at
    WHERE id = NEW.professional_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour maintenir les stats à jour
CREATE TRIGGER trigger_update_professional_stats
    AFTER INSERT OR UPDATE OR DELETE ON public.professional_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_professional_stats(); 