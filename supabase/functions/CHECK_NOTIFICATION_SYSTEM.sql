-- Vérifier le système de notifications
-- 1. Vérifier les triggers
SELECT 
  trigger_name,
  event_object_table,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE 'trigger_notify_%'
ORDER BY event_object_table;

-- 2. Vérifier la table notification_queue
SELECT 
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'sent') as sent,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  MAX(created_at) as last_notification
FROM notification_queue;

-- 3. Vérifier les dernières notifications
SELECT 
  id,
  type,
  status,
  attempts,
  last_error,
  created_at
FROM notification_queue
ORDER BY created_at DESC
LIMIT 10;

-- 4. Vérifier les dernières commandes
SELECT 
  id,
  card_id,
  client_name,
  client_email,
  status,
  created_at
FROM product_inquiries
ORDER BY created_at DESC
LIMIT 5;

SELECT 
  id,
  card_id,
  client_name,
  client_email,
  status,
  created_at
FROM digital_inquiries
ORDER BY created_at DESC
LIMIT 5;
