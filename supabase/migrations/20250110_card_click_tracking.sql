-- Migration pour ajouter le tracking des clics sur les cartes de visite
-- Date: 2025-01-10
-- Objectif: Mesurer le taux de conversion (CTR) et identifier les liens les plus performants

-- Table pour tracker les clics sur les liens de la carte
CREATE TABLE IF NOT EXISTS card_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES business_cards(id) ON DELETE CASCADE,

  -- Type de lien cliqué
  link_type TEXT NOT NULL CHECK (link_type IN (
    'phone',        -- Numéro de téléphone
    'email',        -- Email
    'social',       -- Réseau social (WhatsApp, Instagram, etc.)
    'website',      -- Site web
    'vcard',        -- Téléchargement vCard (Enregistrer le contact)
    'appointment',  -- Prise de rendez-vous
    'marketplace',  -- Accès au marketplace/produits
    'other'         -- Autres liens personnalisés
  )),

  -- Label du lien (ex: "WhatsApp", "Email principal", "Instagram")
  link_label TEXT NOT NULL,

  -- URL du lien (optionnel)
  link_url TEXT,

  -- Informations sur le visiteur (pour calcul du CTR)
  visitor_id TEXT, -- Hash anonyme du visiteur (IP + UserAgent hashé)
  viewer_ip TEXT,
  user_agent TEXT,
  referrer TEXT,

  -- Horodatage
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_card_clicks_card_id ON card_clicks(card_id);
CREATE INDEX IF NOT EXISTS idx_card_clicks_link_type ON card_clicks(link_type);
CREATE INDEX IF NOT EXISTS idx_card_clicks_clicked_at ON card_clicks(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_card_clicks_visitor_id ON card_clicks(visitor_id) WHERE visitor_id IS NOT NULL;

-- Amélioration de la table card_views pour capturer l'IP
-- Note: Si la colonne viewer_ip existe déjà (mais toujours NULL),
-- cette migration garantit qu'elle sera remplie à l'avenir

-- Ajout d'un champ visitor_id pour identifier les visiteurs uniques de manière anonyme
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'card_views' AND column_name = 'visitor_id'
  ) THEN
    ALTER TABLE card_views ADD COLUMN visitor_id TEXT;
  END IF;
END $$;

-- Index pour les vues uniques
CREATE INDEX IF NOT EXISTS idx_card_views_visitor_id ON card_views(visitor_id) WHERE visitor_id IS NOT NULL;

-- Vue matérialisée pour les statistiques de vues (performances optimisées)
CREATE MATERIALIZED VIEW IF NOT EXISTS card_view_stats AS
SELECT
  card_id,
  COUNT(*) as total_views,
  COUNT(DISTINCT visitor_id) FILTER (WHERE visitor_id IS NOT NULL) as unique_views,
  COUNT(*) FILTER (WHERE DATE(viewed_at) = CURRENT_DATE) as views_today,
  COUNT(*) FILTER (WHERE viewed_at >= NOW() - INTERVAL '7 days') as views_last_7_days,
  COUNT(*) FILTER (WHERE viewed_at >= NOW() - INTERVAL '30 days') as views_last_30_days,
  MAX(viewed_at) as last_viewed_at
FROM card_views
GROUP BY card_id;

-- Index sur la vue matérialisée
CREATE UNIQUE INDEX IF NOT EXISTS idx_card_view_stats_card_id ON card_view_stats(card_id);

-- Vue matérialisée pour les statistiques de clics (performances optimisées)
CREATE MATERIALIZED VIEW IF NOT EXISTS card_click_stats AS
SELECT
  card_id,
  COUNT(*) as total_clicks,
  COUNT(DISTINCT visitor_id) FILTER (WHERE visitor_id IS NOT NULL) as unique_clickers,
  COUNT(*) FILTER (WHERE DATE(clicked_at) = CURRENT_DATE) as clicks_today,
  COUNT(*) FILTER (WHERE clicked_at >= NOW() - INTERVAL '7 days') as clicks_last_7_days,
  COUNT(*) FILTER (WHERE clicked_at >= NOW() - INTERVAL '30 days') as clicks_last_30_days,

  -- Breakdown par type de lien
  COUNT(*) FILTER (WHERE link_type = 'phone') as phone_clicks,
  COUNT(*) FILTER (WHERE link_type = 'email') as email_clicks,
  COUNT(*) FILTER (WHERE link_type = 'social') as social_clicks,
  COUNT(*) FILTER (WHERE link_type = 'website') as website_clicks,
  COUNT(*) FILTER (WHERE link_type = 'vcard') as vcard_clicks,
  COUNT(*) FILTER (WHERE link_type = 'appointment') as appointment_clicks,
  COUNT(*) FILTER (WHERE link_type = 'marketplace') as marketplace_clicks,

  MAX(clicked_at) as last_clicked_at
FROM card_clicks
GROUP BY card_id;

-- Index sur la vue matérialisée
CREATE UNIQUE INDEX IF NOT EXISTS idx_card_click_stats_card_id ON card_click_stats(card_id);

-- Vue combinée pour le tableau de bord (vues + clics + CTR)
CREATE OR REPLACE VIEW card_analytics_dashboard AS
SELECT
  c.id as card_id,
  c.name as card_name,
  c.user_id,

  -- Statistiques de vues
  COALESCE(v.total_views, 0) as total_views,
  COALESCE(v.unique_views, 0) as unique_views,
  COALESCE(v.views_today, 0) as views_today,
  COALESCE(v.views_last_7_days, 0) as views_last_7_days,
  COALESCE(v.views_last_30_days, 0) as views_last_30_days,
  v.last_viewed_at,

  -- Statistiques de clics
  COALESCE(cl.total_clicks, 0) as total_clicks,
  COALESCE(cl.unique_clickers, 0) as unique_clickers,
  COALESCE(cl.clicks_today, 0) as clicks_today,
  COALESCE(cl.clicks_last_7_days, 0) as clicks_last_7_days,
  COALESCE(cl.clicks_last_30_days, 0) as clicks_last_30_days,

  -- Breakdown des clics
  COALESCE(cl.phone_clicks, 0) as phone_clicks,
  COALESCE(cl.email_clicks, 0) as email_clicks,
  COALESCE(cl.social_clicks, 0) as social_clicks,
  COALESCE(cl.website_clicks, 0) as website_clicks,
  COALESCE(cl.vcard_clicks, 0) as vcard_clicks,
  COALESCE(cl.appointment_clicks, 0) as appointment_clicks,
  COALESCE(cl.marketplace_clicks, 0) as marketplace_clicks,

  cl.last_clicked_at,

  -- Taux de conversion (CTR) global
  CASE
    WHEN COALESCE(v.total_views, 0) > 0 THEN
      ROUND((COALESCE(cl.total_clicks, 0)::NUMERIC / v.total_views::NUMERIC) * 100, 2)
    ELSE 0
  END as ctr_percentage,

  -- CTR basé sur les vues uniques
  CASE
    WHEN COALESCE(v.unique_views, 0) > 0 THEN
      ROUND((COALESCE(cl.unique_clickers, 0)::NUMERIC / v.unique_views::NUMERIC) * 100, 2)
    ELSE 0
  END as unique_ctr_percentage

FROM business_cards c
LEFT JOIN card_view_stats v ON c.id = v.card_id
LEFT JOIN card_click_stats cl ON c.id = cl.card_id;

-- Fonction pour rafraîchir les vues matérialisées
CREATE OR REPLACE FUNCTION refresh_card_analytics_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY card_view_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY card_click_stats;
END;
$$ LANGUAGE plpgsql;

-- Commentaires pour documentation
COMMENT ON TABLE card_clicks IS 'Tracking des clics sur les liens de la carte de visite pour mesurer le CTR';
COMMENT ON COLUMN card_clicks.link_type IS 'Type de lien: phone, email, social, website, vcard, appointment, marketplace, other';
COMMENT ON COLUMN card_clicks.visitor_id IS 'Identifiant anonyme du visiteur (hash de IP + UserAgent)';
COMMENT ON VIEW card_analytics_dashboard IS 'Vue consolidée pour le tableau de bord analytics avec vues, clics et CTR';

-- Permissions RLS (Row Level Security)
ALTER TABLE card_clicks ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir les clics sur leurs propres cartes
CREATE POLICY "Users can view clicks on their cards"
  ON card_clicks
  FOR SELECT
  USING (
    card_id IN (
      SELECT id FROM business_cards WHERE user_id = auth.uid()
    )
  );

-- Politique: Tout le monde peut créer des clics (tracking public)
CREATE POLICY "Anyone can create clicks"
  ON card_clicks
  FOR INSERT
  WITH CHECK (true);

-- Politique: Les utilisateurs ne peuvent pas modifier ou supprimer les clics (intégrité des données)
-- Pas de politique UPDATE/DELETE = personne ne peut modifier
