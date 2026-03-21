-- Script SQL pour configurer les webhooks pour tous les merchants Bööh
-- 
-- Ce script configure le webhook URL et secret pour tous les merchants
-- qui ont un utilisateur Bööh associé.
--
-- IMPORTANT: 
-- 1. Remplacer 'YOUR_WEBHOOK_URL' par votre URL Supabase
-- 2. Remplacer 'YOUR_WEBHOOK_SECRET' par votre secret généré
-- 3. Exécuter ce script dans la base de données BoohPay

-- Configuration
DO $$
DECLARE
  webhook_url TEXT := 'https://your-project.supabase.co/functions/v1/boohpay-webhook';
  webhook_secret TEXT := 'your-webhook-secret-here';
BEGIN
  -- Mettre à jour tous les merchants qui ont un webhook_url NULL ou vide
  -- (ou tous les merchants si vous voulez forcer la mise à jour)
  UPDATE merchants
  SET 
    webhook_url = webhook_url,
    webhook_secret = webhook_secret,
    updated_at = NOW()
  WHERE id IN (
    -- Récupérer tous les merchants Bööh depuis la table boohpay_merchants
    -- Note: Cette requête nécessite une connexion entre les deux bases de données
    -- ou une migration manuelle des IDs
    SELECT boohpay_merchant_id::uuid
    FROM (
      -- Liste des IDs des merchants Bööh (à remplir manuellement)
      VALUES 
        ('merchant-id-1'),
        ('merchant-id-2')
        -- Ajouter plus d'IDs ici
    ) AS booh_merchants(boohpay_merchant_id)
  );
  
  RAISE NOTICE 'Webhooks configurés pour % merchants', SQL%ROWCOUNT;
END $$;

-- Alternative: Mettre à jour tous les merchants (sans filtre)
-- UPDATE merchants
-- SET 
--   webhook_url = 'https://your-project.supabase.co/functions/v1/boohpay-webhook',
--   webhook_secret = 'your-webhook-secret-here',
--   updated_at = NOW()
-- WHERE webhook_url IS NULL OR webhook_url = '';

-- Vérifier la configuration
SELECT 
  id,
  name,
  webhook_url,
  CASE 
    WHEN webhook_secret IS NOT NULL THEN '***configured***'
    ELSE 'NOT SET'
  END as webhook_secret_status,
  updated_at
FROM merchants
WHERE webhook_url IS NOT NULL
ORDER BY updated_at DESC;








