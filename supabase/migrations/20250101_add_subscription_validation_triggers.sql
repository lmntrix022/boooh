-- Migration: Add Server-Side Subscription Validation Triggers
-- Date: 2025-01-01
-- Purpose: P0 - Enforce subscription limits at database level (URGENT - SECURITY)

-- 1. TRIGGER: Enforce max_cards constraint
-- Prevents users from creating more business cards than their plan allows

CREATE OR REPLACE FUNCTION enforce_max_cards()
RETURNS TRIGGER AS $$
DECLARE
  max_allowed INTEGER;
  current_count INTEGER;
  user_plan_id UUID;
  error_msg TEXT;
BEGIN
  -- Get user's active subscription
  SELECT plan_id INTO user_plan_id
  FROM subscriptions
  WHERE user_id = NEW.user_id AND status = 'active'
  LIMIT 1;
  
  -- If no active subscription, default to FREE plan
  IF user_plan_id IS NULL THEN
    max_allowed := 1;
  ELSE
    -- Get maxCards from plan features
    SELECT COALESCE((features->>'max_cards')::INTEGER, 1)
    INTO max_allowed
    FROM subscription_plans
    WHERE id = user_plan_id;
  END IF;
  
  -- Count existing cards for user
  SELECT COUNT(*) INTO current_count
  FROM business_cards
  WHERE user_id = NEW.user_id;
  
  -- Check limit
  IF current_count >= max_allowed THEN
    error_msg := FORMAT(
      'Subscription limit exceeded: Max %L cards allowed for user %L, currently has %L',
      max_allowed, NEW.user_id, current_count
    );
    RAISE EXCEPTION '%', error_msg;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS check_max_cards_before_insert ON business_cards;

-- Create trigger
CREATE TRIGGER check_max_cards_before_insert
  BEFORE INSERT ON business_cards
  FOR EACH ROW
  EXECUTE FUNCTION enforce_max_cards();

---

-- 2. TRIGGER: Enforce max_products constraint
-- Prevents users from creating more products than their plan allows

CREATE OR REPLACE FUNCTION enforce_max_products()
RETURNS TRIGGER AS $$
DECLARE
  max_allowed INTEGER;
  current_count INTEGER;
  user_id UUID;
  user_plan_id UUID;
  error_msg TEXT;
BEGIN
  -- Get the user who owns this card
  SELECT user_id INTO user_id
  FROM business_cards
  WHERE id = NEW.card_id;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Card % not found', NEW.card_id;
  END IF;
  
  -- Get user's active subscription
  SELECT plan_id INTO user_plan_id
  FROM subscriptions
  WHERE user_id = user_id AND status = 'active'
  LIMIT 1;
  
  -- If no active subscription, default to FREE plan (1 product)
  IF user_plan_id IS NULL THEN
    max_allowed := 1;
  ELSE
    -- Get maxProducts from plan features
    SELECT COALESCE((features->>'max_products')::INTEGER, 1)
    INTO max_allowed
    FROM subscription_plans
    WHERE id = user_plan_id;
  END IF;
  
  -- If max_allowed is -1, it means unlimited
  IF max_allowed = -1 THEN
    RETURN NEW;
  END IF;
  
  -- Count existing products for this card
  SELECT COUNT(*) INTO current_count
  FROM products
  WHERE card_id = NEW.card_id;
  
  -- Check limit
  IF current_count >= max_allowed THEN
    error_msg := FORMAT(
      'Product limit exceeded: Max %L products allowed, currently has %L for card %L',
      max_allowed, current_count, NEW.card_id
    );
    RAISE EXCEPTION '%', error_msg;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS check_max_products_before_insert ON products;

-- Create trigger
CREATE TRIGGER check_max_products_before_insert
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION enforce_max_products();

---

-- 3. TRIGGER: Enforce digital_products feature check
-- Prevents creating digital products if not included in plan

CREATE OR REPLACE FUNCTION enforce_digital_products_feature()
RETURNS TRIGGER AS $$
DECLARE
  user_id UUID;
  has_feature BOOLEAN;
  user_plan_id UUID;
  error_msg TEXT;
BEGIN
  -- Get the user who owns this card
  SELECT user_id INTO user_id
  FROM business_cards
  WHERE id = NEW.card_id;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Card % not found', NEW.card_id;
  END IF;
  
  -- Only check if is_digital is TRUE
  IF NEW.is_digital IS NOT TRUE THEN
    RETURN NEW;
  END IF;
  
  -- Get user's active subscription
  SELECT plan_id INTO user_plan_id
  FROM subscriptions
  WHERE user_id = user_id AND status = 'active'
  LIMIT 1;
  
  -- If no active subscription, default to FREE (no digital products)
  IF user_plan_id IS NULL THEN
    RAISE EXCEPTION 'Digital products not available in FREE plan';
  END IF;
  
  -- Check if plan has digital_products feature
  SELECT COALESCE((features->>'digital_products')::BOOLEAN, FALSE)
  INTO has_feature
  FROM subscription_plans
  WHERE id = user_plan_id;
  
  IF NOT has_feature THEN
    error_msg := FORMAT(
      'Digital products not available in your subscription plan. Please upgrade.'
    );
    RAISE EXCEPTION '%', error_msg;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS check_digital_products_before_insert ON products;

-- Create trigger
CREATE TRIGGER check_digital_products_before_insert
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION enforce_digital_products_feature();

---

-- 4. Create audit log for subscription violations (optional but recommended)

CREATE TABLE IF NOT EXISTS subscription_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'limit_exceeded', 'feature_denied', etc
  resource_type VARCHAR(50) NOT NULL, -- 'card', 'product', etc
  limit_name VARCHAR(100) NOT NULL, -- 'max_cards', 'max_products', etc
  current_value INTEGER,
  limit_value INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance
CREATE INDEX idx_subscription_audit_log_user_id ON subscription_audit_log(user_id);
CREATE INDEX idx_subscription_audit_log_created_at ON subscription_audit_log(created_at);

-- Enable RLS
ALTER TABLE subscription_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs"
  ON subscription_audit_log FOR SELECT
  USING (auth.uid() = user_id);

---

-- 5. Test validations (these should FAIL with new constraints)

-- Test 1: Verify trigger exists
-- SELECT * FROM information_schema.triggers WHERE trigger_name = 'check_max_cards_before_insert';

-- Test 2: Try to create a card for FREE user (should fail after 1 card)
-- INSERT INTO business_cards (user_id, name, is_public) 
-- VALUES ('test-user-id', 'Card 2', FALSE); 
-- → Should raise: "Subscription limit exceeded"

-- Test 3: Try to create digital product in FREE plan (should fail)
-- INSERT INTO products (card_id, name, is_digital, price)
-- VALUES ('card-id', 'Ebook', TRUE, 99.99);
-- → Should raise: "Digital products not available"

---

COMMIT;
