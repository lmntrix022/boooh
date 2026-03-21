-- Migration pour ajouter le champ boohpay_subscription_id à user_subscriptions
-- Ce champ permet de lier les abonnements locaux avec les abonnements BoohPay

ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS boohpay_subscription_id TEXT;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_boohpay_subscription_id 
ON user_subscriptions(boohpay_subscription_id);

-- Commentaire
COMMENT ON COLUMN user_subscriptions.boohpay_subscription_id IS 'ID de l\'abonnement dans BoohPay pour synchronisation';








