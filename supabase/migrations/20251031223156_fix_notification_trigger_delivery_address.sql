-- Fix: Corriger le trigger de notification pour gérer l'absence de delivery_address
-- Date: 2025-01-27
-- Problème: Le trigger notify_owner_via_email essaie d'accéder à NEW.delivery_address
-- qui peut ne pas exister ou être NULL, causant des erreurs

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
  BEGIN
    INSERT INTO notification_queue (type, payload, created_at)
    VALUES (TG_TABLE_NAME, payload, NOW());
    
    RAISE NOTICE 'Notification queued for %: %', TG_TABLE_NAME, NEW.id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to queue notification: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;



