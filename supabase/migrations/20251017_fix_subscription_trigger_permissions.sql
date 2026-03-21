-- Fix: Ajouter les permissions manquantes pour le trigger de création d'abonnement
-- Le trigger create_default_subscription() a besoin de pouvoir insérer dans user_subscriptions

-- Policy pour permettre au trigger (SECURITY DEFINER) d'insérer des abonnements
CREATE POLICY "Allow trigger to insert default subscriptions"
ON user_subscriptions
FOR INSERT
WITH CHECK (true);  -- Le trigger utilise SECURITY DEFINER donc cette policy sera utilisée

-- Alternative: Si vous voulez être plus restrictif, utilisez:
-- WITH CHECK (plan_type = 'free' AND status = 'active');

-- Commentaire pour documentation
COMMENT ON POLICY "Allow trigger to insert default subscriptions" ON user_subscriptions
IS 'Permet au trigger on_auth_user_created_subscription de créer un abonnement FREE pour les nouveaux utilisateurs';
