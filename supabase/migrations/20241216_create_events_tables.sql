-- =====================================================
-- BOOH EVENTS - Phase 1 Migration
-- Created: 2024-12-16
-- Description: Tables pour gestion d'événements, ticketing et analytics
-- =====================================================

-- 1. Table principale des événements
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_id UUID REFERENCES public.business_cards(id) ON DELETE SET NULL,

    -- Informations de base
    title VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255) UNIQUE,

    -- Type et statut
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('physical', 'online', 'hybrid')),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed', 'archived')),
    category VARCHAR(100), -- conference, workshop, concert, networking, sale, etc.

    -- Dates
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    timezone VARCHAR(100) DEFAULT 'UTC',

    -- Localisation (pour événements physiques)
    location_name VARCHAR(255),
    location_address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Capacité et gestion
    max_capacity INTEGER,
    current_attendees INTEGER DEFAULT 0,
    allow_waitlist BOOLEAN DEFAULT false,

    -- Media
    cover_image_url TEXT,
    promo_video_url TEXT,
    images_urls JSONB DEFAULT '[]'::jsonb,

    -- Ticketing
    is_free BOOLEAN DEFAULT true,
    tickets_config JSONB DEFAULT '[]'::jsonb, -- Configuration des types de tickets

    -- SEO et visibilité
    is_public BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,

    -- Contraintes
    CHECK (end_date > start_date),
    CHECK (max_capacity IS NULL OR max_capacity > 0)
);

-- 2. Table des tickets
CREATE TABLE IF NOT EXISTS public.event_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Informations du ticket
    ticket_type VARCHAR(100) NOT NULL, -- standard, vip, early_bird, etc.
    ticket_number VARCHAR(100) UNIQUE NOT NULL,
    qr_code TEXT UNIQUE NOT NULL,

    -- Informations participant
    attendee_name VARCHAR(255) NOT NULL,
    attendee_email VARCHAR(255) NOT NULL,
    attendee_phone VARCHAR(50),

    -- Paiement
    price DECIMAL(10, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'EUR',
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_id VARCHAR(255), -- BoohPay transaction ID
    payment_method VARCHAR(50), -- mobile_money, card, free

    -- Validation
    is_validated BOOLEAN DEFAULT false,
    validated_at TIMESTAMPTZ,
    validated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Statut
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'transferred', 'expired')),

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table analytics des événements
CREATE TABLE IF NOT EXISTS public.event_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,

    -- Métriques quotidiennes
    date DATE NOT NULL,

    -- Vues et engagement
    page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    favorites INTEGER DEFAULT 0,

    -- Tickets
    tickets_sold INTEGER DEFAULT 0,
    tickets_validated INTEGER DEFAULT 0,
    revenue DECIMAL(10, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'EUR',

    -- Sources de traffic
    traffic_sources JSONB DEFAULT '{}'::jsonb, -- {direct: 10, social: 5, email: 3}

    -- Conversions
    conversion_rate DECIMAL(5, 2), -- pourcentage vue -> achat

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Index unique pour éviter les doublons
    UNIQUE(event_id, date)
);

-- 4. Table des participants / attendees
CREATE TABLE IF NOT EXISTS public.event_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ticket_id UUID REFERENCES public.event_tickets(id) ON DELETE SET NULL,

    -- Informations
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),

    -- Statut
    attendance_status VARCHAR(50) DEFAULT 'registered' CHECK (attendance_status IN ('registered', 'attended', 'no_show', 'cancelled')),

    -- Check-in
    checked_in BOOLEAN DEFAULT false,
    checked_in_at TIMESTAMPTZ,

    -- Communication
    notifications_enabled BOOLEAN DEFAULT true,
    reminder_sent BOOLEAN DEFAULT false,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Un participant unique par événement (même email)
    UNIQUE(event_id, email)
);

-- 5. Table des favoris / wishlist événements
CREATE TABLE IF NOT EXISTS public.event_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Notifications
    notify_on_update BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Un favori unique par utilisateur/événement
    UNIQUE(event_id, user_id)
);

-- =====================================================
-- INDEX pour performance
-- =====================================================

-- Events
CREATE INDEX idx_events_user_id ON public.events(user_id);
CREATE INDEX idx_events_card_id ON public.events(card_id);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_event_type ON public.events(event_type);
CREATE INDEX idx_events_start_date ON public.events(start_date);
CREATE INDEX idx_events_location ON public.events(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_events_slug ON public.events(slug);
CREATE INDEX idx_events_category ON public.events(category);
CREATE INDEX idx_events_is_public ON public.events(is_public) WHERE is_public = true;

-- Tickets
CREATE INDEX idx_tickets_event_id ON public.event_tickets(event_id);
CREATE INDEX idx_tickets_user_id ON public.event_tickets(user_id);
CREATE INDEX idx_tickets_qr_code ON public.event_tickets(qr_code);
CREATE INDEX idx_tickets_payment_status ON public.event_tickets(payment_status);
CREATE INDEX idx_tickets_status ON public.event_tickets(status);

-- Analytics
CREATE INDEX idx_analytics_event_id ON public.event_analytics(event_id);
CREATE INDEX idx_analytics_date ON public.event_analytics(date);

-- Attendees
CREATE INDEX idx_attendees_event_id ON public.event_attendees(event_id);
CREATE INDEX idx_attendees_user_id ON public.event_attendees(user_id);
CREATE INDEX idx_attendees_email ON public.event_attendees(email);

-- Favorites
CREATE INDEX idx_favorites_event_id ON public.event_favorites(event_id);
CREATE INDEX idx_favorites_user_id ON public.event_favorites(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS sur toutes les tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_favorites ENABLE ROW LEVEL SECURITY;

-- ===== POLICIES: events =====

-- Les utilisateurs peuvent voir leurs propres événements + les événements publics
CREATE POLICY "Users can view own events and public events"
    ON public.events FOR SELECT
    USING (
        user_id = auth.uid()
        OR (is_public = true AND status = 'published')
    );

-- Les utilisateurs peuvent créer leurs propres événements
CREATE POLICY "Users can create own events"
    ON public.events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leurs propres événements
CREATE POLICY "Users can update own events"
    ON public.events FOR UPDATE
    USING (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres événements
CREATE POLICY "Users can delete own events"
    ON public.events FOR DELETE
    USING (auth.uid() = user_id);

-- ===== POLICIES: event_tickets =====

-- Les utilisateurs peuvent voir leurs propres tickets
CREATE POLICY "Users can view own tickets"
    ON public.event_tickets FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.events
            WHERE events.id = event_tickets.event_id
            AND events.user_id = auth.uid()
        )
    );

-- Les tickets peuvent être créés (achat)
CREATE POLICY "Anyone can create tickets"
    ON public.event_tickets FOR INSERT
    WITH CHECK (true); -- La validation se fait côté application

-- Les organisateurs peuvent mettre à jour les tickets de leurs événements
CREATE POLICY "Event organizers can update tickets"
    ON public.event_tickets FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE events.id = event_tickets.event_id
            AND events.user_id = auth.uid()
        )
    );

-- ===== POLICIES: event_analytics =====

-- Les organisateurs peuvent voir les analytics de leurs événements
CREATE POLICY "Event organizers can view analytics"
    ON public.event_analytics FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE events.id = event_analytics.event_id
            AND events.user_id = auth.uid()
        )
    );

-- Les analytics sont créées/mises à jour automatiquement
CREATE POLICY "System can manage analytics"
    ON public.event_analytics FOR ALL
    USING (true)
    WITH CHECK (true);

-- ===== POLICIES: event_attendees =====

-- Les organisateurs peuvent voir les participants de leurs événements
CREATE POLICY "Event organizers can view attendees"
    ON public.event_attendees FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.events
            WHERE events.id = event_attendees.event_id
            AND events.user_id = auth.uid()
        )
    );

-- Les participants peuvent être ajoutés
CREATE POLICY "Anyone can register as attendee"
    ON public.event_attendees FOR INSERT
    WITH CHECK (true);

-- Les organisateurs peuvent mettre à jour les participants
CREATE POLICY "Event organizers can update attendees"
    ON public.event_attendees FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE events.id = event_attendees.event_id
            AND events.user_id = auth.uid()
        )
    );

-- ===== POLICIES: event_favorites =====

-- Les utilisateurs peuvent voir leurs propres favoris
CREATE POLICY "Users can view own favorites"
    ON public.event_favorites FOR SELECT
    USING (auth.uid() = user_id);

-- Les utilisateurs peuvent ajouter aux favoris
CREATE POLICY "Users can add favorites"
    ON public.event_favorites FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs favoris
CREATE POLICY "Users can delete favorites"
    ON public.event_favorites FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON public.event_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_updated_at BEFORE UPDATE ON public.event_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendees_updated_at BEFORE UPDATE ON public.event_attendees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour générer le slug automatiquement
CREATE OR REPLACE FUNCTION generate_event_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug = LOWER(REGEXP_REPLACE(NEW.title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 8);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_event_slug_trigger BEFORE INSERT ON public.events
    FOR EACH ROW EXECUTE FUNCTION generate_event_slug();

-- Trigger pour incrémenter current_attendees
CREATE OR REPLACE FUNCTION increment_event_attendees()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.attendance_status = 'registered' OR NEW.attendance_status = 'attended' THEN
        UPDATE public.events
        SET current_attendees = current_attendees + 1
        WHERE id = NEW.event_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_attendees_trigger AFTER INSERT ON public.event_attendees
    FOR EACH ROW EXECUTE FUNCTION increment_event_attendees();

-- Trigger pour décrémenter current_attendees
CREATE OR REPLACE FUNCTION decrement_event_attendees()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.attendance_status IN ('registered', 'attended')
       AND NEW.attendance_status = 'cancelled' THEN
        UPDATE public.events
        SET current_attendees = GREATEST(current_attendees - 1, 0)
        WHERE id = OLD.event_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER decrement_attendees_trigger AFTER UPDATE ON public.event_attendees
    FOR EACH ROW EXECUTE FUNCTION decrement_event_attendees();

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour obtenir les statistiques d'un événement
CREATE OR REPLACE FUNCTION get_event_stats(event_uuid UUID)
RETURNS TABLE (
    total_tickets INTEGER,
    tickets_sold INTEGER,
    tickets_validated INTEGER,
    total_revenue DECIMAL,
    current_attendees INTEGER,
    max_capacity INTEGER,
    availability_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as total_tickets,
        COUNT(*) FILTER (WHERE payment_status = 'completed')::INTEGER as tickets_sold,
        COUNT(*) FILTER (WHERE is_validated = true)::INTEGER as tickets_validated,
        COALESCE(SUM(price) FILTER (WHERE payment_status = 'completed'), 0)::DECIMAL as total_revenue,
        e.current_attendees,
        e.max_capacity,
        CASE
            WHEN e.max_capacity IS NOT NULL AND e.max_capacity > 0
            THEN (e.current_attendees::DECIMAL / e.max_capacity::DECIMAL * 100)
            ELSE 0
        END as availability_rate
    FROM public.event_tickets et
    RIGHT JOIN public.events e ON e.id = et.event_id
    WHERE e.id = event_uuid
    GROUP BY e.current_attendees, e.max_capacity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les événements à venir
CREATE OR REPLACE FUNCTION get_upcoming_events(limit_count INTEGER DEFAULT 10)
RETURNS SETOF public.events AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.events
    WHERE status = 'published'
      AND is_public = true
      AND start_date > NOW()
    ORDER BY start_date ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON TABLE public.events IS 'Table principale pour la gestion des événements BOOH';
COMMENT ON TABLE public.event_tickets IS 'Tickets générés pour les événements avec QR codes';
COMMENT ON TABLE public.event_analytics IS 'Analytics et métriques des événements par jour';
COMMENT ON TABLE public.event_attendees IS 'Liste des participants aux événements';
COMMENT ON TABLE public.event_favorites IS 'Événements favoris des utilisateurs';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
