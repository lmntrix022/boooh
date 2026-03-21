-- Migration: Fix Portfolio Multi-Cards Support
-- Description: Permet à chaque carte d'avoir son propre portfolio indépendant
-- Date: 2025-01-16

-- =====================================================
-- 1. MODIFIER portfolio_settings POUR SUPPORT MULTI-CARTES
-- =====================================================

-- Supprimer la contrainte UNIQUE sur user_id
ALTER TABLE portfolio_settings DROP CONSTRAINT IF EXISTS portfolio_settings_user_id_key;

-- Supprimer la contrainte UNIQUE sur card_id
ALTER TABLE portfolio_settings DROP CONSTRAINT IF EXISTS portfolio_settings_card_id_key;

-- Rendre card_id NOT NULL (obligatoire)
ALTER TABLE portfolio_settings ALTER COLUMN card_id SET NOT NULL;

-- Créer une contrainte UNIQUE sur (user_id, card_id)
-- Cela permet à un utilisateur d'avoir plusieurs portfolios (un par carte)
-- mais empêche les doublons pour la même carte
ALTER TABLE portfolio_settings
  ADD CONSTRAINT portfolio_settings_user_card_unique
  UNIQUE (user_id, card_id);

-- =====================================================
-- 2. MODIFIER LES RLS POLICIES
-- =====================================================

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Users can view their own settings" ON portfolio_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON portfolio_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON portfolio_settings;
DROP POLICY IF EXISTS "Public can view enabled portfolio settings" ON portfolio_settings;

-- Recréer les policies avec support multi-cartes
CREATE POLICY "Users can view their own portfolio settings"
  ON portfolio_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert portfolio settings for their cards"
  ON portfolio_settings FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM business_cards
      WHERE id = card_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own portfolio settings"
  ON portfolio_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolio settings"
  ON portfolio_settings FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view enabled portfolio settings by card"
  ON portfolio_settings FOR SELECT
  USING (is_enabled = true);

-- =====================================================
-- 3. MODIFIER LES POLICIES DES PROJETS POUR CARD_ID
-- =====================================================

-- Supprimer les anciennes policies de projets
DROP POLICY IF EXISTS "Public can view published projects" ON portfolio_projects;

-- Recréer avec support card_id
CREATE POLICY "Public can view published projects"
  ON portfolio_projects FOR SELECT
  USING (is_published = true);

-- =====================================================
-- 4. FONCTION POUR OBTENIR LES STATS PAR CARTE
-- =====================================================

-- Fonction pour obtenir les statistiques du portfolio par carte
CREATE OR REPLACE FUNCTION get_portfolio_stats_by_card(card_uuid UUID)
RETURNS JSON AS $$
DECLARE
  stats JSON;
  owner_id UUID;
BEGIN
  -- Récupérer le user_id de la carte
  SELECT user_id INTO owner_id FROM business_cards WHERE id = card_uuid;

  IF owner_id IS NULL THEN
    RETURN json_build_object('error', 'Card not found');
  END IF;

  SELECT json_build_object(
    'total_projects', (SELECT COUNT(*) FROM portfolio_projects WHERE card_id = card_uuid),
    'published_projects', (SELECT COUNT(*) FROM portfolio_projects WHERE card_id = card_uuid AND is_published = true),
    'total_views', (SELECT COALESCE(SUM(view_count), 0) FROM portfolio_projects WHERE card_id = card_uuid),
    'total_quotes', (SELECT COUNT(*) FROM service_quotes WHERE card_id = card_uuid),
    'pending_quotes', (SELECT COUNT(*) FROM service_quotes WHERE card_id = card_uuid AND status IN ('new', 'in_progress')),
    'converted_quotes', (SELECT COUNT(*) FROM service_quotes WHERE card_id = card_uuid AND status = 'accepted'),
    'quote_conversion_rate', (
      CASE
        WHEN (SELECT COUNT(*) FROM service_quotes WHERE card_id = card_uuid) > 0
        THEN ROUND(
          (SELECT COUNT(*)::DECIMAL FROM service_quotes WHERE card_id = card_uuid AND status = 'accepted') * 100.0 /
          (SELECT COUNT(*) FROM service_quotes WHERE card_id = card_uuid),
          2
        )
        ELSE 0
      END
    )
  ) INTO stats;

  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. INDEX POUR PERFORMANCES
-- =====================================================

-- Créer un index composite pour (user_id, card_id)
CREATE INDEX IF NOT EXISTS idx_portfolio_settings_user_card
  ON portfolio_settings(user_id, card_id);

-- Optimiser les requêtes de projets par carte
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_card_published
  ON portfolio_projects(card_id, is_published);

-- Optimiser les requêtes de quotes par carte
CREATE INDEX IF NOT EXISTS idx_service_quotes_card_status
  ON service_quotes(card_id, status);

-- =====================================================
-- 6. COMMENTAIRES POUR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE portfolio_settings IS
  'Paramètres du portfolio - Un portfolio par carte. Chaque carte peut avoir son propre portfolio indépendant.';

COMMENT ON COLUMN portfolio_settings.card_id IS
  'Référence à la carte - OBLIGATOIRE. Chaque portfolio est lié à une carte spécifique.';

COMMENT ON CONSTRAINT portfolio_settings_user_card_unique ON portfolio_settings IS
  'Un utilisateur peut avoir plusieurs portfolios (un par carte) mais pas de doublons pour la même carte.';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
