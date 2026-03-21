-- Migration pour ajouter un trigger qui rafraîchit automatiquement la vue matérialisée card_click_stats
-- Date: 2025-01-27
-- Objectif: Rafraîchir automatiquement les stats après chaque insertion de clic

-- Fonction qui rafraîchit la vue matérialisée (version simplifiée sans CONCURRENTLY pour les triggers)
CREATE OR REPLACE FUNCTION refresh_card_click_stats_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Rafraîchir la vue matérialisée pour la carte concernée
  -- Note: On utilise REFRESH sans CONCURRENTLY dans un trigger car CONCURRENTLY nécessite un index unique
  -- et peut causer des problèmes dans un contexte transactionnel
  REFRESH MATERIALIZED VIEW card_click_stats;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger après insertion dans card_clicks
DROP TRIGGER IF EXISTS trigger_refresh_click_stats ON card_clicks;
CREATE TRIGGER trigger_refresh_click_stats
  AFTER INSERT ON card_clicks
  FOR EACH ROW
  EXECUTE FUNCTION refresh_card_click_stats_on_insert();

-- Commentaire
COMMENT ON FUNCTION refresh_card_click_stats_on_insert() IS 'Fonction trigger pour rafraîchir automatiquement card_click_stats après chaque insertion de clic';

