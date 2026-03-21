-- =====================================================
-- Migration: Table de queue pour les notifications
-- Date: 2025-01-26
-- Description: Table de fallback si pg_net n'est pas disponible
-- =====================================================

-- Créer la table de queue (pour fallback)
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- 'appointments', 'product_inquiries', etc.
  payload JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  attempts INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Index pour la queue
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status, created_at);
CREATE INDEX IF NOT EXISTS idx_notification_queue_type ON notification_queue(type);

-- Fonction pour traiter la queue (peut être appelée par pg_cron)
CREATE OR REPLACE FUNCTION process_notification_queue()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  queue_item RECORD;
  response_status INTEGER;
  response_body TEXT;
  supabase_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Récupérer les variables d'environnement (à configurer dans Supabase)
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.supabase_service_role_key', true);

  IF supabase_url IS NULL OR service_role_key IS NULL THEN
    RAISE WARNING 'Supabase URL or service role key not configured';
    RETURN;
  END IF;

  -- Traiter les notifications en attente (max 10 à la fois)
  FOR queue_item IN
    SELECT * FROM notification_queue
    WHERE status = 'pending'
    AND attempts < 3
    ORDER BY created_at ASC
    LIMIT 10
    FOR UPDATE SKIP LOCKED
  LOOP
    BEGIN
      -- Marquer comme en traitement
      UPDATE notification_queue
      SET status = 'processing',
          attempts = attempts + 1,
          processed_at = NOW()
      WHERE id = queue_item.id;

      -- Appeler l'Edge Function via pg_net si disponible
      IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
        PERFORM
          net.http_post(
            url := supabase_url || '/functions/v1/send-notification-email',
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', 'Bearer ' || service_role_key
            ),
            body := queue_item.payload
          );
      ELSE
        -- Alternative: Utiliser l'extension http si disponible
        SELECT status INTO response_status
        FROM http((
          'POST',
          supabase_url || '/functions/v1/send-notification-email',
          ARRAY[
            http_header('Content-Type', 'application/json'),
            http_header('Authorization', 'Bearer ' || service_role_key)
          ],
          'application/json',
          queue_item.payload::text
        )::http_request);
      END IF;

      -- Marquer comme envoyé
      UPDATE notification_queue
      SET status = 'sent'
      WHERE id = queue_item.id;

    EXCEPTION WHEN OTHERS THEN
      -- Marquer comme échoué
      UPDATE notification_queue
      SET status = 'failed',
          last_error = SQLERRM
      WHERE id = queue_item.id;

      RAISE WARNING 'Failed to process notification %: %', queue_item.id, SQLERRM;
    END;
  END LOOP;
END;
$$;

-- RLS pour notification_queue (seulement service_role peut y accéder)
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- Politique: Seul le service_role peut gérer la queue
CREATE POLICY "notification_queue_service_role"
ON notification_queue
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

COMMENT ON TABLE notification_queue IS 'Queue pour les notifications email en attente d''envoi';




