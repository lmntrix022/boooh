-- Migration pour créer des abonnements pour tous les utilisateurs existants
-- Détecte automatiquement le plan approprié selon leurs données existantes

-- Créer une vue temporaire pour analyser l'usage de chaque utilisateur
WITH user_usage AS (
  SELECT
    au.id as user_id,
    au.created_at as user_created_at,

    -- Compter les cartes de visite
    COALESCE(COUNT(DISTINCT bc.id), 0) as card_count,

    -- Compter les produits (si table digital_products existe)
    COALESCE(
      (SELECT COUNT(*)
       FROM digital_products dp
       WHERE dp.user_id = au.id),
      0
    ) as product_count,

    -- Vérifier si e-commerce est utilisé (produits > 0)
    CASE
      WHEN EXISTS (
        SELECT 1 FROM digital_products dp WHERE dp.user_id = au.id
      ) THEN true
      ELSE false
    END as has_ecommerce_data

  FROM auth.users au
  LEFT JOIN business_cards bc ON bc.user_id = au.id
  WHERE NOT EXISTS (
    -- Ne traiter que les utilisateurs sans abonnement
    SELECT 1 FROM user_subscriptions us WHERE us.user_id = au.id
  )
  GROUP BY au.id, au.created_at
),
-- Déterminer le plan approprié pour chaque utilisateur
user_plan_assignment AS (
  SELECT
    user_id,
    user_created_at,
    card_count,
    product_count,
    has_ecommerce_data,

    -- Logique de détection du plan:
    -- MAGIC: 2+ cartes OU 20+ produits
    -- BUSINESS: 1 carte avec e-commerce (produits > 0)
    -- FREE: 1 carte sans e-commerce OU 0 cartes
    CASE
      WHEN card_count >= 2 OR product_count > 20 THEN 'magic'
      WHEN card_count >= 1 AND has_ecommerce_data AND product_count > 0 THEN 'business'
      ELSE 'free'
    END as detected_plan

  FROM user_usage
)
-- Insérer les abonnements détectés
INSERT INTO user_subscriptions (
  user_id,
  plan_type,
  status,
  addons,
  start_date,
  created_at,
  updated_at
)
SELECT
  user_id,
  detected_plan as plan_type,
  'active' as status,
  '[]'::jsonb as addons,
  COALESCE(user_created_at, NOW()) as start_date,  -- Utiliser NOW() si created_at est null
  NOW() as created_at,
  NOW() as updated_at
FROM user_plan_assignment;

-- Vérifier le résultat et afficher les statistiques
DO $$
DECLARE
  users_without_subscription INTEGER;
  total_subscriptions INTEGER;
  free_count INTEGER;
  business_count INTEGER;
  magic_count INTEGER;
BEGIN
  -- Compter les utilisateurs sans abonnement (devrait être 0 maintenant)
  SELECT COUNT(*) INTO users_without_subscription
  FROM auth.users au
  WHERE NOT EXISTS (
    SELECT 1 FROM user_subscriptions us WHERE us.user_id = au.id
  );

  -- Compter le total d'abonnements
  SELECT COUNT(*) INTO total_subscriptions
  FROM user_subscriptions;

  -- Compter par type de plan
  SELECT COUNT(*) INTO free_count
  FROM user_subscriptions WHERE plan_type = 'free';

  SELECT COUNT(*) INTO business_count
  FROM user_subscriptions WHERE plan_type = 'business';

  SELECT COUNT(*) INTO magic_count
  FROM user_subscriptions WHERE plan_type = 'magic';

  -- Afficher les résultats
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE 'Migration de backfill des abonnements terminée';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Statistiques:';
  RAISE NOTICE '  • Total abonnements: %', total_subscriptions;
  RAISE NOTICE '  • Plan FREE: % utilisateurs', free_count;
  RAISE NOTICE '  • Plan BUSINESS: % utilisateurs', business_count;
  RAISE NOTICE '  • Plan MAGIC: % utilisateurs', magic_count;
  RAISE NOTICE '  • Utilisateurs sans abonnement: %', users_without_subscription;
  RAISE NOTICE '';

  IF users_without_subscription > 0 THEN
    RAISE WARNING '⚠ Attention: % utilisateur(s) n''ont toujours pas d''abonnement!', users_without_subscription;
  ELSE
    RAISE NOTICE '✓ Tous les utilisateurs ont maintenant un abonnement';
  END IF;
  RAISE NOTICE '═══════════════════════════════════════════════════';
END $$;
