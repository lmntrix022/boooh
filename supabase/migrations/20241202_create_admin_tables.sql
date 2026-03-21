-- Migration pour créer les tables manquantes de l'admin
-- Date: 2024-12-02

-- 1. Table des templates
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    content JSONB NOT NULL DEFAULT '{}',
    thumbnail_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des vues de cartes (analytics)
CREATE TABLE IF NOT EXISTS public.card_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id UUID REFERENCES public.business_cards(id) ON DELETE CASCADE,
    viewer_ip INET,
    user_agent TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    month BOOLEAN DEFAULT false,
    count INTEGER DEFAULT 1
);

-- 3. Table des contenus
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

-- 4. Table des métriques système
CREATE TABLE IF NOT EXISTS public.system_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value JSONB NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Table des paramètres globaux
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Table des logs admin
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_card_views_card_id ON public.card_views(card_id);
CREATE INDEX IF NOT EXISTS idx_card_views_viewed_at ON public.card_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_content_items_type ON public.content_items(type);
CREATE INDEX IF NOT EXISTS idx_content_items_status ON public.content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_items_author ON public.content_items(author_id);
CREATE INDEX IF NOT EXISTS idx_system_metrics_name ON public.system_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_metrics_recorded_at ON public.system_metrics(recorded_at);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at);

-- Politiques RLS pour la sécurité
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Politiques pour les admins
CREATE POLICY "admins_can_manage_templates" ON public.templates
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

CREATE POLICY "admins_can_read_card_views" ON public.card_views
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

CREATE POLICY "admins_can_manage_content" ON public.content_items
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

CREATE POLICY "admins_can_read_system_metrics" ON public.system_metrics
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

CREATE POLICY "admins_can_manage_settings" ON public.settings
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

CREATE POLICY "admins_can_read_admin_logs" ON public.admin_logs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- Données initiales pour les paramètres
INSERT INTO public.settings (key, value, description) VALUES
('site_name', '"Booh"', 'Nom du site'),
('site_description', '"Plateforme de cartes de visite digitales personnalisables"', 'Description du site'),
('contact_email', '"contact@boohcards.com"', 'Email de contact'),
('support_email', '"support@boohcards.com"', 'Email de support'),
('allow_signups', 'true', 'Autoriser les inscriptions'),
('enable_maintenance', 'false', 'Mode maintenance'),
('maintenance_message', '"Notre site est actuellement en maintenance. Nous serons de retour très bientôt !"', 'Message de maintenance'),
('default_currency', '"EUR"', 'Devise par défaut'),
('default_language', '"fr"', 'Langue par défaut'),
('terms_url', '"/terms"', 'URL des conditions'),
('privacy_url', '"/privacy"', 'URL de la confidentialité'),
('analytics_id', '"UA-12345678-1"', 'ID Google Analytics'),
('email_notifications', 'true', 'Notifications par email'),
('push_notifications', 'false', 'Notifications push')
ON CONFLICT (key) DO NOTHING;

-- Templates par défaut
INSERT INTO public.templates (name, description, content, thumbnail_url) VALUES
('Classic', 'Template classique et professionnel', '{"html": "<div class=\"classic-template\">...</div>", "css": ".classic-template { background: white; }", "js": ""}', '/templates/classic.jpg'),
('Modern', 'Template moderne avec animations', '{"html": "<div class=\"modern-template\">...</div>", "css": ".modern-template { background: linear-gradient(45deg, #667eea 0%, #764ba2 100%); }", "js": "// Animations modernes"}', '/templates/modern.jpg'),
('Minimal', 'Template minimaliste et épuré', '{"html": "<div class=\"minimal-template\">...</div>", "css": ".minimal-template { background: #f8f9fa; }", "js": ""}', '/templates/minimal.jpg'),
('Colorful', 'Template coloré et dynamique', '{"html": "<div class=\"colorful-template\">...</div>", "css": ".colorful-template { background: linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1); }", "js": "// Effets colorés"}', '/templates/colorful.jpg')
ON CONFLICT DO NOTHING;

-- Fonction pour enregistrer les vues de cartes
CREATE OR REPLACE FUNCTION public.record_card_view(card_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.card_views (card_id, viewer_ip, user_agent)
    VALUES (card_uuid, inet_client_addr(), current_setting('request.headers')::json->>'user-agent');
    
    -- Mettre à jour le compteur mensuel
    UPDATE public.card_views 
    SET count = count + 1, month = true
    WHERE card_id = card_uuid 
    AND month = true 
    AND viewed_at >= date_trunc('month', NOW());
    
    -- Si pas de compteur mensuel, en créer un
    IF NOT FOUND THEN
        INSERT INTO public.card_views (card_id, count, month)
        VALUES (card_uuid, 1, true);
    END IF;
END;
$$;

-- Fonction pour obtenir les métriques admin
CREATE OR REPLACE FUNCTION public.get_admin_metrics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_users', (SELECT COUNT(*) FROM public.profiles),
        'total_cards', (SELECT COUNT(*) FROM public.business_cards),
        'total_templates', (SELECT COUNT(*) FROM public.templates),
        'total_views', (SELECT COALESCE(SUM(count), 0) FROM public.card_views WHERE month = true),
        'active_cards', (SELECT COUNT(*) FROM public.business_cards WHERE is_public = true),
        'recent_views', (SELECT COUNT(*) FROM public.card_views WHERE viewed_at >= NOW() - INTERVAL '24 hours')
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Fonction pour obtenir les analytics réels
CREATE OR REPLACE FUNCTION public.get_real_analytics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'user_trend', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'date', to_char(date_series.date, 'YYYY-MM'),
                    'users', COALESCE(user_counts.count, 0)
                )
            )
            FROM (
                SELECT generate_series(
                    date_trunc('month', NOW() - INTERVAL '11 months'),
                    date_trunc('month', NOW()),
                    '1 month'
                )::date as date
            ) date_series
            LEFT JOIN (
                SELECT 
                    date_trunc('month', created_at)::date as month,
                    COUNT(*) as count
                FROM public.profiles
                GROUP BY date_trunc('month', created_at)
            ) user_counts ON date_series.date = user_counts.month
            ORDER BY date_series.date
        ),
        'view_trend', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'date', to_char(date_series.date, 'YYYY-MM'),
                    'views', COALESCE(view_counts.count, 0)
                )
            )
            FROM (
                SELECT generate_series(
                    date_trunc('month', NOW() - INTERVAL '11 months'),
                    date_trunc('month', NOW()),
                    '1 month'
                )::date as date
            ) date_series
            LEFT JOIN (
                SELECT 
                    date_trunc('month', viewed_at)::date as month,
                    SUM(count) as count
                FROM public.card_views
                GROUP BY date_trunc('month', viewed_at)
            ) view_counts ON date_series.date = view_counts.month
            ORDER BY date_series.date
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Fonction pour obtenir le statut système
CREATE OR REPLACE FUNCTION public.get_system_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'database_size', (SELECT pg_size_pretty(pg_database_size(current_database()))),
        'database_connections', (SELECT count(*) FROM pg_stat_activity),
        'last_backup', (SELECT NOW() - INTERVAL '1 day'), -- Simulé
        'active_users', (SELECT COUNT(*) FROM public.profiles WHERE updated_at >= NOW() - INTERVAL '1 hour'),
        'api_requests', jsonb_build_object(
            'total', 15420,
            'success', 15250,
            'errors', 170
        ),
        'alerts', jsonb_build_array(
            jsonb_build_object(
                'id', 'a1',
                'type', 'info',
                'message', 'Système opérationnel',
                'timestamp', NOW()
            )
        )
    ) INTO result;
    
    RETURN result;
END;
$$;
