-- Création de la table reviews pour les avis sur les produits
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewer_name TEXT NOT NULL,
    reviewer_email TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,
    images TEXT[], -- URLs des images
    helpful_votes INTEGER DEFAULT 0,
    is_verified_purchase BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    is_flagged BOOLEAN DEFAULT false,
    flag_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON public.reviews(is_approved);

-- Table pour les votes utiles
CREATE TABLE IF NOT EXISTS public.review_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    voter_ip INET,
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(review_id, user_id, voter_ip)
);

-- Index pour les votes
CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON public.review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_user_id ON public.review_votes(user_id);

-- Fonction pour mettre à jour le nombre de votes utiles
CREATE OR REPLACE FUNCTION update_review_helpful_votes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.reviews 
        SET helpful_votes = (
            SELECT COUNT(*) 
            FROM public.review_votes 
            WHERE review_id = NEW.review_id AND is_helpful = true
        )
        WHERE id = NEW.review_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.reviews 
        SET helpful_votes = (
            SELECT COUNT(*) 
            FROM public.review_votes 
            WHERE review_id = OLD.review_id AND is_helpful = true
        )
        WHERE id = OLD.review_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour maintenir le compteur de votes à jour
CREATE TRIGGER trigger_update_review_helpful_votes
    AFTER INSERT OR DELETE ON public.review_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_review_helpful_votes();

-- Fonction pour calculer la note moyenne d'un produit
CREATE OR REPLACE FUNCTION get_product_average_rating(product_uuid UUID)
RETURNS TABLE(
    average_rating DECIMAL(3,2),
    total_reviews INTEGER,
    rating_distribution JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROUND(AVG(r.rating)::DECIMAL, 2) as average_rating,
        COUNT(*)::INTEGER as total_reviews,
        json_build_object(
            '1', COUNT(*) FILTER (WHERE r.rating = 1),
            '2', COUNT(*) FILTER (WHERE r.rating = 2),
            '3', COUNT(*) FILTER (WHERE r.rating = 3),
            '4', COUNT(*) FILTER (WHERE r.rating = 4),
            '5', COUNT(*) FILTER (WHERE r.rating = 5)
        ) as rating_distribution
    FROM public.reviews r
    WHERE r.product_id = product_uuid 
    AND r.is_approved = true;
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

-- Politiques pour reviews
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can create reviews" ON public.reviews
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own reviews" ON public.reviews
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews" ON public.reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Politiques pour review_votes
CREATE POLICY "Votes are viewable by everyone" ON public.review_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can create votes" ON public.review_votes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own votes" ON public.review_votes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all votes" ON public.review_votes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    ); 