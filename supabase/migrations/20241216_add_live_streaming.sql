-- =====================================================
-- BOOH EVENTS - Phase 2 Migration: Live Streaming
-- Created: 2024-12-16
-- Description: Tables et champs pour live streaming, chat, et tips
-- =====================================================

-- 1. Ajouter les champs de live streaming à la table events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS has_live_stream BOOLEAN DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS live_stream_url TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS live_stream_platform VARCHAR(50) CHECK (live_stream_platform IN ('youtube', 'twitch', 'facebook', 'custom', null));
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS live_stream_status VARCHAR(50) DEFAULT 'scheduled' CHECK (live_stream_status IN ('scheduled', 'live', 'ended', 'replay'));
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS live_started_at TIMESTAMPTZ;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS live_ended_at TIMESTAMPTZ;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS replay_url TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS current_viewers INTEGER DEFAULT 0;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS peak_viewers INTEGER DEFAULT 0;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS total_tips_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS enable_chat BOOLEAN DEFAULT true;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS enable_tips BOOLEAN DEFAULT true;

-- 2. Table des messages de chat en temps réel
CREATE TABLE IF NOT EXISTS public.event_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Informations utilisateur (dénormalisé pour performance)
    user_name VARCHAR(255) NOT NULL,
    user_avatar_url TEXT,

    -- Message
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'tip', 'emoji')),

    -- Metadata
    is_pinned BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Contraintes
    CHECK (LENGTH(message) <= 500)
);

-- 3. Table des tips en direct
CREATE TABLE IF NOT EXISTS public.event_tips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Informations donateur
    tipper_name VARCHAR(255) NOT NULL,
    tipper_email VARCHAR(255),

    -- Montant
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',

    -- Message associé
    message TEXT,
    is_anonymous BOOLEAN DEFAULT false,

    -- Paiement
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    -- Contraintes
    CHECK (amount > 0),
    CHECK (LENGTH(message) <= 200)
);

-- 4. Table des spectateurs en temps réel (pour tracking)
CREATE TABLE IF NOT EXISTS public.event_viewers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Session tracking
    session_id VARCHAR(255) NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(45),

    -- Informations spectateur
    viewer_name VARCHAR(255),
    is_anonymous BOOLEAN DEFAULT true,

    -- Timestamps
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,

    -- Statistiques
    watch_duration_seconds INTEGER DEFAULT 0,

    -- Contraintes
    UNIQUE(event_id, session_id)
);

-- 5. Index pour performance
CREATE INDEX IF NOT EXISTS idx_event_chat_messages_event_id ON public.event_chat_messages(event_id);
CREATE INDEX IF NOT EXISTS idx_event_chat_messages_created_at ON public.event_chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_tips_event_id ON public.event_tips(event_id);
CREATE INDEX IF NOT EXISTS idx_event_tips_status ON public.event_tips(payment_status);
CREATE INDEX IF NOT EXISTS idx_event_viewers_event_id ON public.event_viewers(event_id);
CREATE INDEX IF NOT EXISTS idx_event_viewers_session ON public.event_viewers(session_id);
CREATE INDEX IF NOT EXISTS idx_event_viewers_active ON public.event_viewers(event_id, left_at) WHERE left_at IS NULL;

-- 6. RLS Policies pour event_chat_messages
ALTER TABLE public.event_chat_messages ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les messages des événements publics
CREATE POLICY "Anyone can read chat messages for public events"
    ON public.event_chat_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE events.id = event_chat_messages.event_id
            AND events.is_public = true
        )
    );

-- Les utilisateurs authentifiés peuvent envoyer des messages
CREATE POLICY "Authenticated users can send chat messages"
    ON public.event_chat_messages
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres messages
CREATE POLICY "Users can delete their own messages"
    ON public.event_chat_messages
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Les organisateurs peuvent modérer (supprimer/épingler)
CREATE POLICY "Event organizers can moderate chat"
    ON public.event_chat_messages
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE events.id = event_chat_messages.event_id
            AND events.user_id = auth.uid()
        )
    );

-- 7. RLS Policies pour event_tips
ALTER TABLE public.event_tips ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les tips publics (non anonymes)
CREATE POLICY "Anyone can read public tips"
    ON public.event_tips
    FOR SELECT
    USING (is_anonymous = false OR auth.uid() = user_id);

-- Les utilisateurs peuvent créer des tips
CREATE POLICY "Anyone can create tips"
    ON public.event_tips
    FOR INSERT
    WITH CHECK (true);

-- Les organisateurs peuvent voir tous les tips de leurs événements
CREATE POLICY "Event organizers can view all tips"
    ON public.event_tips
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE events.id = event_tips.event_id
            AND events.user_id = auth.uid()
        )
    );

-- 8. RLS Policies pour event_viewers
ALTER TABLE public.event_viewers ENABLE ROW LEVEL SECURITY;

-- Les organisateurs peuvent voir les spectateurs de leurs événements
CREATE POLICY "Event organizers can view viewers"
    ON public.event_viewers
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE events.id = event_viewers.event_id
            AND events.user_id = auth.uid()
        )
    );

-- Les spectateurs peuvent créer leur propre entrée
CREATE POLICY "Anyone can join as viewer"
    ON public.event_viewers
    FOR INSERT
    WITH CHECK (true);

-- Les spectateurs peuvent mettre à jour leur last_seen
CREATE POLICY "Viewers can update their session"
    ON public.event_viewers
    FOR UPDATE
    USING (session_id = current_setting('request.headers')::json->>'x-session-id' OR user_id = auth.uid())
    WITH CHECK (session_id = current_setting('request.headers')::json->>'x-session-id' OR user_id = auth.uid());

-- 9. Fonctions utilitaires

-- Fonction pour obtenir le nombre de spectateurs actifs
CREATE OR REPLACE FUNCTION get_active_viewers_count(event_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM public.event_viewers
        WHERE event_id = event_uuid
        AND left_at IS NULL
        AND last_seen_at > NOW() - INTERVAL '30 seconds'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour le compteur de spectateurs
CREATE OR REPLACE FUNCTION update_viewers_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.events
    SET
        current_viewers = get_active_viewers_count(NEW.event_id),
        peak_viewers = GREATEST(
            peak_viewers,
            get_active_viewers_count(NEW.event_id)
        )
    WHERE id = NEW.event_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le compteur automatiquement
DROP TRIGGER IF EXISTS trigger_update_viewers_count ON public.event_viewers;
CREATE TRIGGER trigger_update_viewers_count
    AFTER INSERT OR UPDATE ON public.event_viewers
    FOR EACH ROW
    EXECUTE FUNCTION update_viewers_count();

-- Fonction pour mettre à jour le total des tips
CREATE OR REPLACE FUNCTION update_total_tips()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payment_status = 'completed' THEN
        UPDATE public.events
        SET total_tips_amount = total_tips_amount + NEW.amount
        WHERE id = NEW.event_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le total des tips
DROP TRIGGER IF EXISTS trigger_update_total_tips ON public.event_tips;
CREATE TRIGGER trigger_update_total_tips
    AFTER INSERT OR UPDATE ON public.event_tips
    FOR EACH ROW
    WHEN (NEW.payment_status = 'completed')
    EXECUTE FUNCTION update_total_tips();

-- 10. Fonction pour nettoyer les spectateurs inactifs (à exécuter périodiquement)
CREATE OR REPLACE FUNCTION cleanup_inactive_viewers()
RETURNS void AS $$
BEGIN
    UPDATE public.event_viewers
    SET left_at = NOW()
    WHERE left_at IS NULL
    AND last_seen_at < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Commentaires pour documentation
COMMENT ON TABLE public.event_chat_messages IS 'Messages de chat en temps réel pour les événements live';
COMMENT ON TABLE public.event_tips IS 'Tips (pourboires) envoyés pendant les événements live';
COMMENT ON TABLE public.event_viewers IS 'Tracking des spectateurs en temps réel';
COMMENT ON COLUMN public.events.has_live_stream IS 'Indique si l''événement inclut un live streaming';
COMMENT ON COLUMN public.events.live_stream_status IS 'Statut du live: scheduled, live, ended, replay';
COMMENT ON COLUMN public.events.current_viewers IS 'Nombre de spectateurs actuellement connectés';
COMMENT ON COLUMN public.events.peak_viewers IS 'Pic maximum de spectateurs atteint';
COMMENT ON COLUMN public.events.total_tips_amount IS 'Montant total des tips reçus';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
