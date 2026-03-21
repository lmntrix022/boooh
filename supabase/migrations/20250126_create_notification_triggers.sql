-- =====================================================
-- Migration: Triggers de notifications automatiques
-- Date: 2025-01-26
-- Description: Envoie automatiquement des emails aux propriétaires
-- =====================================================

-- =====================================================
-- FONCTION: Appeler l'Edge Function de notification
-- =====================================================

CREATE OR REPLACE FUNCTION notify_owner_via_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  card_user_id UUID;
  payload JSONB;
BEGIN
  -- Récupérer le user_id du propriétaire de la carte
  SELECT user_id INTO card_user_id
  FROM business_cards
  WHERE id = NEW.card_id;

  IF card_user_id IS NULL THEN
    RAISE WARNING 'Card not found for card_id: %', NEW.card_id;
    RETURN NEW;
  END IF;

  -- Construire le payload selon le type de notification
  CASE TG_TABLE_NAME
    WHEN 'appointments' THEN
      payload := jsonb_build_object(
        'type', 'appointment',
        'cardId', NEW.card_id,
        'ownerId', card_user_id,
        'clientName', COALESCE(NEW.client_name, 'Client'),
        'clientEmail', COALESCE(NEW.client_email, ''),
        'clientPhone', NEW.client_phone,
        'details', jsonb_build_object(
          'date', COALESCE(NEW.date::text, NEW.appointment_date::text, ''),
          'time', COALESCE(NEW.appointment_time::text, ''),
          'message', COALESCE(NEW.message, NEW.notes, '')
        )
      );
    
    WHEN 'product_inquiries' THEN
      payload := jsonb_build_object(
        'type', 'order_physical',
        'cardId', NEW.card_id,
        'ownerId', card_user_id,
        'clientName', COALESCE(NEW.client_name, 'Client'),
        'clientEmail', COALESCE(NEW.client_email, ''),
        'clientPhone', NEW.client_phone,
        'details', jsonb_build_object(
          'productName', (SELECT name FROM products WHERE id = NEW.product_id LIMIT 1),
          'quantity', NEW.quantity,
          'address', COALESCE(NEW.delivery_address, NEW.notes, '')
        )
      );
    
    WHEN 'digital_inquiries' THEN
      payload := jsonb_build_object(
        'type', 'order_digital',
        'cardId', NEW.card_id,
        'ownerId', card_user_id,
        'clientName', COALESCE(NEW.client_name, 'Client'),
        'clientEmail', COALESCE(NEW.client_email, ''),
        'clientPhone', NEW.client_phone,
        'details', jsonb_build_object(
          'productName', (SELECT title FROM digital_products WHERE id = NEW.digital_product_id LIMIT 1),
          'price', (SELECT price FROM digital_products WHERE id = NEW.digital_product_id LIMIT 1),
          'currency', COALESCE((SELECT currency FROM digital_products WHERE id = NEW.digital_product_id LIMIT 1), 'XOF')
        )
      );
    
    WHEN 'service_quotes' THEN
      payload := jsonb_build_object(
        'type', 'quote',
        'cardId', NEW.card_id,
        'ownerId', card_user_id,
        'clientName', COALESCE(NEW.client_name, 'Client'),
        'clientEmail', COALESCE(NEW.client_email, ''),
        'clientPhone', NEW.client_phone,
        'details', jsonb_build_object(
          'company', NEW.client_company,
          'service', NEW.service_requested,
          'budget', NEW.budget_range,
          'description', NEW.project_description
        )
      );
    
    ELSE
      RAISE WARNING 'Unknown table: %', TG_TABLE_NAME;
      RETURN NEW;
  END CASE;

  -- Insérer dans la queue de notifications
  -- L'envoi sera traité par un processus séparé (cron job ou webhook)
  BEGIN
    INSERT INTO notification_queue (type, payload, created_at)
    VALUES (TG_TABLE_NAME, payload, NOW());
    
    RAISE NOTICE 'Notification queued for %: %', TG_TABLE_NAME, NEW.id;
  EXCEPTION WHEN OTHERS THEN
    -- Log l'erreur mais ne bloque pas l'insertion
    RAISE WARNING 'Failed to queue notification: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- =====================================================
-- TRIGGERS pour chaque table
-- =====================================================

-- Trigger pour appointments
DROP TRIGGER IF EXISTS trigger_notify_appointment ON appointments;
CREATE TRIGGER trigger_notify_appointment
  AFTER INSERT ON appointments
  FOR EACH ROW
  WHEN (NEW.client_email IS NOT NULL AND NEW.client_email != '')
  EXECUTE FUNCTION notify_owner_via_email();

-- Trigger pour product_inquiries (commandes physiques)
DROP TRIGGER IF EXISTS trigger_notify_order_physical ON product_inquiries;
CREATE TRIGGER trigger_notify_order_physical
  AFTER INSERT ON product_inquiries
  FOR EACH ROW
  WHEN (NEW.client_email IS NOT NULL AND NEW.client_email != '')
  EXECUTE FUNCTION notify_owner_via_email();

-- Trigger pour digital_inquiries (commandes digitales)
DROP TRIGGER IF EXISTS trigger_notify_order_digital ON digital_inquiries;
CREATE TRIGGER trigger_notify_order_digital
  AFTER INSERT ON digital_inquiries
  FOR EACH ROW
  WHEN (NEW.client_email IS NOT NULL AND NEW.client_email != '')
  EXECUTE FUNCTION notify_owner_via_email();

-- Trigger pour service_quotes (devis)
DROP TRIGGER IF EXISTS trigger_notify_quote ON service_quotes;
CREATE TRIGGER trigger_notify_quote
  AFTER INSERT ON service_quotes
  FOR EACH ROW
  WHEN (NEW.client_email IS NOT NULL AND NEW.client_email != '')
  EXECUTE FUNCTION notify_owner_via_email();

-- =====================================================
-- VÉRIFICATION
-- =====================================================

SELECT 
    trigger_name,
    event_object_table,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE trigger_name LIKE 'trigger_notify_%'
ORDER BY event_object_table, trigger_name;

-- Résultat attendu:
-- ✅ trigger_notify_appointment sur appointments
-- ✅ trigger_notify_order_digital sur digital_inquiries
-- ✅ trigger_notify_order_physical sur product_inquiries
-- ✅ trigger_notify_quote sur service_quotes

COMMENT ON FUNCTION notify_owner_via_email() IS 
'Fonction trigger qui envoie automatiquement un email de notification au propriétaire de la carte lors de nouvelles demandes';

