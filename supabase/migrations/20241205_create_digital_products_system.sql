-- Migration pour créer le système de produits numériques
-- Date: 2024-12-05
-- Intégration cohérente avec l'architecture existante

-- 1. Types ENUM pour les produits numériques
CREATE TYPE digital_product_type AS ENUM (
    'music_album',
    'music_track', 
    'ebook_pdf',
    'ebook_epub',
    'course_video',
    'course_audio',
    'course_pdf',
    'formation_pack'
);

CREATE TYPE digital_product_status AS ENUM (
    'draft',
    'published',
    'archived',
    'suspended'
);

CREATE TYPE download_protection AS ENUM (
    'none',
    'watermark',
    'drm_light',
    'token_based'
);

-- 2. Table des produits numériques (extension de la table products existante)
CREATE TABLE IF NOT EXISTS public.digital_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID NOT NULL REFERENCES public.business_cards(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE, -- Lien vers le produit physique associé
    
    -- Informations de base
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type digital_product_type NOT NULL,
    status digital_product_status DEFAULT 'draft',
    
    -- Fichiers et médias
    file_url TEXT, -- URL du fichier principal
    preview_url TEXT, -- URL du fichier de prévisualisation
    thumbnail_url TEXT, -- Image de couverture
    
    -- Métadonnées techniques
    file_size BIGINT, -- Taille en bytes
    duration INTEGER, -- Durée en secondes (pour audio/vidéo)
    format VARCHAR(20), -- Format du fichier (MP3, PDF, etc.)
    quality VARCHAR(20), -- Qualité (HD, SD, etc.)
    
    -- Prix et monétisation
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'XOF',
    is_free BOOLEAN DEFAULT false,
    is_premium BOOLEAN DEFAULT false,
    
    -- Protection et téléchargement
    protection download_protection DEFAULT 'token_based',
    download_limit INTEGER DEFAULT 1,
    preview_duration INTEGER DEFAULT 30, -- Durée de prévisualisation en secondes
    expires_after_days INTEGER, -- Expiration du lien de téléchargement
    
    -- Métadonnées étendues
    metadata JSONB DEFAULT '{}', -- Informations spécifiques au type
    tags TEXT[], -- Tags pour la recherche
    category VARCHAR(100), -- Catégorie du produit
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    purchase_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- 3. Table des achats de produits numériques
CREATE TABLE IF NOT EXISTS public.digital_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
    
    -- Informations acheteur
    buyer_email VARCHAR(255) NOT NULL,
    buyer_name VARCHAR(255),
    buyer_phone VARCHAR(50),
    
    -- Transaction
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'XOF',
    payment_method VARCHAR(50), -- mobile_money, bank_transfer, etc.
    payment_reference VARCHAR(255),
    
    -- Téléchargement sécurisé
    download_token TEXT UNIQUE NOT NULL,
    download_count INTEGER DEFAULT 0,
    max_downloads INTEGER DEFAULT 1,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Statut
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'expired', 'refunded')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_download_at TIMESTAMP WITH TIME ZONE
);

-- 4. Table des téléchargements (audit trail)
CREATE TABLE IF NOT EXISTS public.digital_downloads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_id UUID NOT NULL REFERENCES public.digital_purchases(id) ON DELETE CASCADE,
    download_token TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    file_size BIGINT,
    download_duration INTEGER, -- Temps de téléchargement en secondes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Table des abonnements créateurs (extension du système d'abonnement existant)
CREATE TABLE IF NOT EXISTS public.creator_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan VARCHAR(50) NOT NULL CHECK (plan IN ('creator_basic', 'creator_pro', 'creator_enterprise')),
    
    -- Limites du plan
    max_products INTEGER DEFAULT 10,
    max_file_size_mb INTEGER DEFAULT 100,
    max_monthly_downloads INTEGER DEFAULT 1000,
    
    -- Fonctionnalités
    features JSONB DEFAULT '{}',
    
    -- Période
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Table des commissions (pour la monétisation)
CREATE TABLE IF NOT EXISTS public.digital_commissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_id UUID NOT NULL REFERENCES public.digital_purchases(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Commission
    commission_rate DECIMAL(5,4) NOT NULL, -- Taux de commission (ex: 0.15 = 15%)
    commission_amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    seller_earnings DECIMAL(10,2) NOT NULL,
    
    -- Statut
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'disputed')),
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_digital_products_card_id ON public.digital_products(card_id);
CREATE INDEX IF NOT EXISTS idx_digital_products_type ON public.digital_products(type);
CREATE INDEX IF NOT EXISTS idx_digital_products_status ON public.digital_products(status);
CREATE INDEX IF NOT EXISTS idx_digital_products_price ON public.digital_products(price);
CREATE INDEX IF NOT EXISTS idx_digital_products_created_at ON public.digital_products(created_at);

CREATE INDEX IF NOT EXISTS idx_digital_purchases_product_id ON public.digital_purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_digital_purchases_buyer_email ON public.digital_purchases(buyer_email);
CREATE INDEX IF NOT EXISTS idx_digital_purchases_download_token ON public.digital_purchases(download_token);
CREATE INDEX IF NOT EXISTS idx_digital_purchases_created_at ON public.digital_purchases(created_at);

CREATE INDEX IF NOT EXISTS idx_digital_downloads_purchase_id ON public.digital_downloads(purchase_id);
CREATE INDEX IF NOT EXISTS idx_digital_downloads_created_at ON public.digital_downloads(created_at);

CREATE INDEX IF NOT EXISTS idx_creator_subscriptions_user_id ON public.creator_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_subscriptions_status ON public.creator_subscriptions(status);

-- 8. Fonctions utilitaires
CREATE OR REPLACE FUNCTION update_digital_product_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_download_token()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_commission(
    sale_price DECIMAL,
    seller_tier VARCHAR
) RETURNS DECIMAL AS $$
DECLARE
    commission_rate DECIMAL;
BEGIN
    CASE seller_tier
        WHEN 'basic' THEN commission_rate := 0.15;
        WHEN 'premium' THEN commission_rate := 0.10;
        WHEN 'pro' THEN commission_rate := 0.05;
        WHEN 'enterprise' THEN commission_rate := 0.03;
        ELSE commission_rate := 0.15;
    END CASE;
    
    RETURN sale_price * commission_rate;
END;
$$ LANGUAGE plpgsql;

-- 9. Triggers
CREATE TRIGGER update_digital_product_timestamp_trigger
    BEFORE UPDATE ON public.digital_products
    FOR EACH ROW
    EXECUTE FUNCTION update_digital_product_timestamp();

CREATE TRIGGER update_creator_subscription_timestamp_trigger
    BEFORE UPDATE ON public.creator_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_digital_product_timestamp();

-- 10. RLS (Row Level Security)
ALTER TABLE public.digital_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_commissions ENABLE ROW LEVEL SECURITY;

-- 11. Politiques RLS
-- Les créateurs peuvent voir leurs propres produits
CREATE POLICY "Users can view their own digital products" ON public.digital_products
    FOR SELECT USING (card_id IN (
        SELECT id FROM public.business_cards WHERE user_id = auth.uid()
    ));

-- Les créateurs peuvent modifier leurs propres produits
CREATE POLICY "Users can modify their own digital products" ON public.digital_products
    FOR ALL USING (card_id IN (
        SELECT id FROM public.business_cards WHERE user_id = auth.uid()
    ));

-- Les acheteurs peuvent voir leurs achats
CREATE POLICY "Buyers can view their purchases" ON public.digital_purchases
    FOR SELECT USING (buyer_email = auth.jwt() ->> 'email');

-- Les créateurs peuvent voir les commissions de leurs ventes
CREATE POLICY "Sellers can view their commissions" ON public.digital_commissions
    FOR SELECT USING (seller_id = auth.uid());

-- Les utilisateurs peuvent voir leurs abonnements créateurs
CREATE POLICY "Users can view their creator subscriptions" ON public.creator_subscriptions
    FOR ALL USING (user_id = auth.uid());

-- 12. Données de base pour les plans créateurs
INSERT INTO public.creator_subscriptions (user_id, plan, max_products, max_file_size_mb, max_monthly_downloads, current_period_start, current_period_end, features)
SELECT 
    u.id,
    'creator_basic',
    5,
    50,
    500,
    NOW(),
    NOW() + INTERVAL '1 month',
    '{"watermarking": true, "analytics": false, "priority_support": false}'::jsonb
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.creator_subscriptions cs WHERE cs.user_id = u.id
);

-- 13. Vues utiles pour les analytics
CREATE VIEW public.digital_product_analytics AS
SELECT 
    dp.id,
    dp.title,
    dp.type,
    dp.price,
    dp.view_count,
    dp.download_count,
    dp.purchase_count,
    COALESCE(SUM(dpur.amount), 0) as total_revenue,
    COALESCE(AVG(dpur.amount), 0) as avg_sale_price,
    dp.created_at,
    dp.published_at
FROM public.digital_products dp
LEFT JOIN public.digital_purchases dpur ON dp.id = dpur.product_id
GROUP BY dp.id, dp.title, dp.type, dp.price, dp.view_count, dp.download_count, dp.purchase_count, dp.created_at, dp.published_at;

-- 14. Fonction pour créer un achat sécurisé
CREATE OR REPLACE FUNCTION create_secure_purchase(
    p_product_id UUID,
    p_buyer_email VARCHAR,
    p_buyer_name VARCHAR DEFAULT NULL,
    p_buyer_phone VARCHAR DEFAULT NULL,
    p_payment_method VARCHAR DEFAULT NULL,
    p_payment_reference VARCHAR DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_purchase_id UUID;
    v_download_token TEXT;
    v_expires_at TIMESTAMP WITH TIME ZONE;
    v_max_downloads INTEGER;
BEGIN
    -- Générer un token de téléchargement sécurisé
    v_download_token := generate_download_token();
    
    -- Définir l'expiration (24h par défaut)
    v_expires_at := NOW() + INTERVAL '24 hours';
    
    -- Récupérer les limites du produit
    SELECT download_limit INTO v_max_downloads 
    FROM public.digital_products 
    WHERE id = p_product_id;
    
    -- Créer l'achat
    INSERT INTO public.digital_purchases (
        product_id,
        buyer_email,
        buyer_name,
        buyer_phone,
        amount,
        payment_method,
        payment_reference,
        download_token,
        max_downloads,
        expires_at
    ) VALUES (
        p_product_id,
        p_buyer_email,
        p_buyer_name,
        p_buyer_phone,
        (SELECT price FROM public.digital_products WHERE id = p_product_id),
        p_payment_method,
        p_payment_reference,
        v_download_token,
        COALESCE(v_max_downloads, 1),
        v_expires_at
    ) RETURNING id INTO v_purchase_id;
    
    -- Mettre à jour les statistiques du produit
    UPDATE public.digital_products 
    SET purchase_count = purchase_count + 1
    WHERE id = p_product_id;
    
    RETURN v_purchase_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Fonction pour valider un téléchargement
CREATE OR REPLACE FUNCTION validate_download(
    p_download_token TEXT
) RETURNS TABLE (
    is_valid BOOLEAN,
    file_url TEXT,
    product_title VARCHAR,
    error_message TEXT
) AS $$
DECLARE
    v_purchase RECORD;
    v_product RECORD;
BEGIN
    -- Vérifier si le token existe et est valide
    SELECT * INTO v_purchase
    FROM public.digital_purchases
    WHERE download_token = p_download_token
    AND expires_at > NOW()
    AND download_count < max_downloads;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::TEXT, NULL::VARCHAR, 'Token invalide ou expiré'::TEXT;
        RETURN;
    END IF;
    
    -- Récupérer les informations du produit
    SELECT * INTO v_product
    FROM public.digital_products
    WHERE id = v_purchase.product_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::TEXT, NULL::VARCHAR, 'Produit introuvable'::TEXT;
        RETURN;
    END IF;
    
    -- Incrémenter le compteur de téléchargements
    UPDATE public.digital_purchases
    SET download_count = download_count + 1,
        last_download_at = NOW()
    WHERE id = v_purchase.id;
    
    -- Enregistrer le téléchargement
    INSERT INTO public.digital_downloads (
        purchase_id,
        download_token,
        ip_address,
        user_agent
    ) VALUES (
        v_purchase.id,
        p_download_token,
        inet_client_addr(),
        current_setting('request.headers', true)
    );
    
    -- Mettre à jour les statistiques du produit
    UPDATE public.digital_products
    SET download_count = download_count + 1
    WHERE id = v_product.id;
    
    RETURN QUERY SELECT true, v_product.file_url, v_product.title, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
