-- Migration pour simplifier la table card_views
-- Date: 2025-01-11
-- Problème: La colonne "month" et la logique de compteur sont confuses
-- Solution: Supprimer "month" et garder une structure simple avec une ligne par vue

-- 1. Supprimer la colonne "month" qui crée de la confusion
ALTER TABLE card_views DROP COLUMN IF EXISTS month;

-- 2. S'assurer que les colonnes nécessaires existent
DO $$
BEGIN
    -- Ajouter visitor_id si manquant
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'card_views' AND column_name = 'visitor_id'
    ) THEN
        ALTER TABLE card_views ADD COLUMN visitor_id TEXT;
        CREATE INDEX IF NOT EXISTS idx_card_views_visitor_id ON card_views(visitor_id) WHERE visitor_id IS NOT NULL;
    END IF;

    -- Ajouter referrer si manquant
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'card_views' AND column_name = 'referrer'
    ) THEN
        ALTER TABLE card_views ADD COLUMN referrer TEXT;
        CREATE INDEX IF NOT EXISTS idx_card_views_referrer ON card_views(referrer) WHERE referrer IS NOT NULL;
    END IF;
END $$;

-- 3. Modifier la colonne count pour avoir une valeur par défaut de 1
ALTER TABLE card_views ALTER COLUMN count SET DEFAULT 1;

-- 4. S'assurer que viewed_at a un index pour les requêtes de performance
CREATE INDEX IF NOT EXISTS idx_card_views_viewed_at_desc ON card_views(viewed_at DESC);

-- 5. Index composite pour les requêtes courantes
CREATE INDEX IF NOT EXISTS idx_card_views_card_viewed ON card_views(card_id, viewed_at DESC);

-- 6. Commentaires pour documentation
COMMENT ON TABLE card_views IS
'Enregistre chaque vue de carte de visite. Chaque ligne représente une vue unique.';

COMMENT ON COLUMN card_views.card_id IS
'Référence à la carte de visite consultée';

COMMENT ON COLUMN card_views.viewer_ip IS
'Adresse IP du visiteur (peut être NULL)';

COMMENT ON COLUMN card_views.user_agent IS
'User-Agent du navigateur du visiteur';

COMMENT ON COLUMN card_views.visitor_id IS
'Identifiant anonyme unique du visiteur (hash de IP + User-Agent)';

COMMENT ON COLUMN card_views.referrer IS
'URL de provenance (pour tracking des partages)';

COMMENT ON COLUMN card_views.viewed_at IS
'Date et heure de la consultation';

COMMENT ON COLUMN card_views.count IS
'Nombre de vues (toujours 1 pour une ligne individuelle, peut être utilisé pour agréger)';
