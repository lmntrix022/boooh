-- Migration: Appointment Conflict Prevention & Enhanced Status Management
-- Created: 2025-11-27
-- Purpose: Prevent double-booking, add no_show/completed statuses, enable appointment modification

-- 1. Function to atomically book an appointment with conflict checking
CREATE OR REPLACE FUNCTION book_appointment_atomic(
  p_card_id UUID,
  p_client_name TEXT,
  p_client_email TEXT,
  p_date TIMESTAMP WITH TIME ZONE,
  p_client_phone TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_duration INTEGER DEFAULT 60,
  p_timezone TEXT DEFAULT 'UTC'
)
RETURNS JSON AS $$
DECLARE
  v_settings RECORD;
  v_conflict_count INTEGER;
  v_buffer_time INTEGER;
  v_appointment_id UUID;
  v_slot_start TIMESTAMP WITH TIME ZONE;
  v_slot_end TIMESTAMP WITH TIME ZONE;
  v_next_available TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get card availability settings
  SELECT buffer_time, default_duration 
  INTO v_settings
  FROM card_availability_settings 
  WHERE card_id = p_card_id;
  
  -- Use default buffer if no settings
  v_buffer_time := COALESCE(v_settings.buffer_time, 0);
  
  -- Calculate slot boundaries with buffer
  v_slot_start := p_date - (v_buffer_time || ' minutes')::INTERVAL;
  v_slot_end := p_date + ((p_duration + v_buffer_time) || ' minutes')::INTERVAL;
  
  -- Lock and check for conflicts (FOR UPDATE SKIP LOCKED prevents race conditions)
  SELECT COUNT(*) INTO v_conflict_count
  FROM appointments
  WHERE card_id = p_card_id
    AND status NOT IN ('cancelled', 'no_show')
    AND (
      -- New appointment overlaps with existing
      (date >= v_slot_start AND date < v_slot_end)
      OR
      -- Existing appointment overlaps with new
      (date + (duration || ' minutes')::INTERVAL > p_date AND date < v_slot_end)
    )
  FOR UPDATE SKIP LOCKED;
  
  -- If conflict exists, find next available slot
  IF v_conflict_count > 0 THEN
    -- Find next available slot (same day, after requested time)
    SELECT MIN(apt_end) INTO v_next_available
    FROM (
      SELECT date + (duration || ' minutes')::INTERVAL + (v_buffer_time || ' minutes')::INTERVAL AS apt_end
      FROM appointments
      WHERE card_id = p_card_id
        AND status NOT IN ('cancelled', 'no_show')
        AND date::DATE = p_date::DATE
        AND date >= p_date
      ORDER BY date
    ) subq;
    
    -- If no slot found today, suggest next day at same time
    IF v_next_available IS NULL THEN
      v_next_available := (p_date::DATE + INTERVAL '1 day') + p_date::TIME;
    END IF;
    
    RETURN json_build_object(
      'success', false,
      'error', 'SLOT_CONFLICT',
      'message', 'Ce créneau est déjà réservé',
      'next_available', v_next_available,
      'next_available_formatted', to_char(v_next_available, 'DD/MM/YYYY à HH24:MI')
    );
  END IF;
  
  -- No conflict - create the appointment
  INSERT INTO appointments (
    card_id, 
    client_name, 
    client_email, 
    client_phone, 
    notes, 
    date, 
    duration, 
    status,
    timezone
  ) VALUES (
    p_card_id,
    p_client_name,
    p_client_email,
    p_client_phone,
    p_notes,
    p_date,
    p_duration,
    'pending',
    p_timezone
  )
  RETURNING id INTO v_appointment_id;
  
  RETURN json_build_object(
    'success', true,
    'appointment_id', v_appointment_id,
    'message', 'Rendez-vous créé avec succès'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', 'BOOKING_ERROR',
    'message', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Function to check slot availability in real-time (for live UI updates)
CREATE OR REPLACE FUNCTION check_slot_availability(
  p_card_id UUID,
  p_date TIMESTAMP WITH TIME ZONE,
  p_duration INTEGER DEFAULT 60,
  p_exclude_appointment_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_buffer_time INTEGER;
  v_is_available BOOLEAN;
  v_conflict_appointment RECORD;
BEGIN
  -- Get buffer time from settings
  SELECT COALESCE(buffer_time, 0) INTO v_buffer_time
  FROM card_availability_settings 
  WHERE card_id = p_card_id;
  
  v_buffer_time := COALESCE(v_buffer_time, 0);
  
  -- Check for conflicts
  SELECT id, client_name, date, duration INTO v_conflict_appointment
  FROM appointments
  WHERE card_id = p_card_id
    AND status NOT IN ('cancelled', 'no_show')
    AND (p_exclude_appointment_id IS NULL OR id != p_exclude_appointment_id)
    AND (
      -- Check overlap
      (date - (v_buffer_time || ' minutes')::INTERVAL < p_date + (p_duration || ' minutes')::INTERVAL)
      AND
      (date + (duration || ' minutes')::INTERVAL + (v_buffer_time || ' minutes')::INTERVAL > p_date)
    )
  LIMIT 1;
  
  v_is_available := v_conflict_appointment.id IS NULL;
  
  IF v_is_available THEN
    RETURN json_build_object(
      'available', true
    );
  ELSE
    RETURN json_build_object(
      'available', false,
      'conflict_with', v_conflict_appointment.client_name,
      'conflict_time', to_char(v_conflict_appointment.date, 'HH24:MI'),
      'conflict_duration', v_conflict_appointment.duration
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function to get next available slots when current is taken
CREATE OR REPLACE FUNCTION get_next_available_slots(
  p_card_id UUID,
  p_after_date TIMESTAMP WITH TIME ZONE,
  p_duration INTEGER DEFAULT 60,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  slot_time TIMESTAMP WITH TIME ZONE,
  slot_formatted TEXT
) AS $$
DECLARE
  v_settings RECORD;
  v_current_date DATE;
  v_end_date DATE;
  v_day_of_week TEXT;
  v_working_hours JSONB;
  v_slot RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Get settings
  SELECT working_hours, buffer_time, default_duration, timezone
  INTO v_settings
  FROM card_availability_settings
  WHERE card_id = p_card_id;
  
  v_current_date := p_after_date::DATE;
  v_end_date := v_current_date + INTERVAL '14 days'; -- Look up to 14 days ahead
  
  -- Loop through days
  WHILE v_current_date <= v_end_date AND v_count < p_limit LOOP
    -- Get day name
    v_day_of_week := LOWER(to_char(v_current_date, 'day'));
    v_day_of_week := TRIM(v_day_of_week);
    
    -- Convert day to English for JSONB key
    v_day_of_week := CASE v_day_of_week
      WHEN 'lundi' THEN 'monday'
      WHEN 'mardi' THEN 'tuesday'
      WHEN 'mercredi' THEN 'wednesday'
      WHEN 'jeudi' THEN 'thursday'
      WHEN 'vendredi' THEN 'friday'
      WHEN 'samedi' THEN 'saturday'
      WHEN 'dimanche' THEN 'sunday'
      ELSE v_day_of_week
    END;
    
    -- Get working hours for this day
    v_working_hours := v_settings.working_hours->v_day_of_week;
    
    IF v_working_hours IS NOT NULL AND jsonb_array_length(v_working_hours) > 0 THEN
      -- For each time slot in working hours
      FOR v_slot IN 
        SELECT 
          (v_current_date + (elem->>'start')::TIME)::TIMESTAMP WITH TIME ZONE AS slot_start
        FROM jsonb_array_elements(v_working_hours) AS elem
      LOOP
        -- Check if slot is available and in the future
        IF v_slot.slot_start > p_after_date THEN
          -- Check availability
          IF (SELECT (check_slot_availability(p_card_id, v_slot.slot_start, p_duration))->>'available')::BOOLEAN THEN
            slot_time := v_slot.slot_start;
            slot_formatted := to_char(v_slot.slot_start, 'DD/MM/YYYY à HH24:MI');
            v_count := v_count + 1;
            RETURN NEXT;
            
            IF v_count >= p_limit THEN
              RETURN;
            END IF;
          END IF;
        END IF;
      END LOOP;
    END IF;
    
    v_current_date := v_current_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to update appointment (for owner modifications)
CREATE OR REPLACE FUNCTION update_appointment_with_notification(
  p_appointment_id UUID,
  p_new_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_new_duration INTEGER DEFAULT NULL,
  p_new_status TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_modification_reason TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_old_appointment RECORD;
  v_conflict_check JSON;
  v_changes JSONB := '{}';
BEGIN
  -- Get current appointment
  SELECT * INTO v_old_appointment
  FROM appointments
  WHERE id = p_appointment_id
  FOR UPDATE;
  
  IF v_old_appointment IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'NOT_FOUND',
      'message', 'Rendez-vous non trouvé'
    );
  END IF;
  
  -- If date is changing, check for conflicts
  IF p_new_date IS NOT NULL AND p_new_date != v_old_appointment.date THEN
    v_conflict_check := check_slot_availability(
      v_old_appointment.card_id,
      p_new_date,
      COALESCE(p_new_duration, v_old_appointment.duration),
      p_appointment_id
    );
    
    IF NOT (v_conflict_check->>'available')::BOOLEAN THEN
      RETURN json_build_object(
        'success', false,
        'error', 'SLOT_CONFLICT',
        'message', 'Le nouveau créneau est déjà réservé',
        'conflict', v_conflict_check
      );
    END IF;
    
    v_changes := v_changes || jsonb_build_object(
      'date', jsonb_build_object(
        'old', v_old_appointment.date,
        'new', p_new_date
      )
    );
  END IF;
  
  -- Track other changes
  IF p_new_duration IS NOT NULL AND p_new_duration != v_old_appointment.duration THEN
    v_changes := v_changes || jsonb_build_object(
      'duration', jsonb_build_object(
        'old', v_old_appointment.duration,
        'new', p_new_duration
      )
    );
  END IF;
  
  IF p_new_status IS NOT NULL AND p_new_status != v_old_appointment.status THEN
    v_changes := v_changes || jsonb_build_object(
      'status', jsonb_build_object(
        'old', v_old_appointment.status,
        'new', p_new_status
      )
    );
  END IF;
  
  -- Update the appointment
  UPDATE appointments
  SET
    date = COALESCE(p_new_date, date),
    duration = COALESCE(p_new_duration, duration),
    status = COALESCE(p_new_status, status),
    notes = COALESCE(p_notes, notes),
    updated_at = NOW()
  WHERE id = p_appointment_id;
  
  -- Log the modification for notification
  INSERT INTO appointment_modifications (
    appointment_id,
    modified_by,
    changes,
    reason,
    created_at
  ) VALUES (
    p_appointment_id,
    auth.uid(),
    v_changes,
    p_modification_reason,
    NOW()
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Rendez-vous modifié avec succès',
    'changes', v_changes,
    'needs_notification', jsonb_array_length(v_changes::JSONB) > 0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create table to track appointment modifications (for audit and notifications)
CREATE TABLE IF NOT EXISTS appointment_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  modified_by UUID REFERENCES auth.users(id),
  changes JSONB NOT NULL DEFAULT '{}',
  reason TEXT,
  notification_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_appointment_modifications_appointment_id 
  ON appointment_modifications(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_modifications_notification 
  ON appointment_modifications(notification_sent) WHERE NOT notification_sent;

-- RLS for modifications table
ALTER TABLE appointment_modifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their appointment modifications"
  ON appointment_modifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      JOIN business_cards bc ON a.card_id = bc.id
      WHERE a.id = appointment_modifications.appointment_id
      AND bc.user_id = auth.uid()
    )
  );

CREATE POLICY "Service can manage modifications"
  ON appointment_modifications
  FOR ALL
  USING (true);

-- 6. Cron job to auto-complete past confirmed appointments
CREATE OR REPLACE FUNCTION auto_complete_past_appointments()
RETURNS void AS $$
BEGIN
  UPDATE appointments
  SET status = 'completed', updated_at = NOW()
  WHERE status = 'confirmed'
    AND date < NOW() - INTERVAL '2 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Add updated_at column to appointments if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments'
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE appointments ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- 8. Trigger to update updated_at on appointments
CREATE OR REPLACE FUNCTION update_appointment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_appointment_timestamp ON appointments;
CREATE TRIGGER trigger_update_appointment_timestamp
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_appointment_timestamp();

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION book_appointment_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION check_slot_availability TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_available_slots TO authenticated;
GRANT EXECUTE ON FUNCTION update_appointment_with_notification TO authenticated;

COMMENT ON FUNCTION book_appointment_atomic IS 'Atomically books an appointment with conflict prevention';
COMMENT ON FUNCTION check_slot_availability IS 'Checks if a time slot is available in real-time';
COMMENT ON FUNCTION get_next_available_slots IS 'Returns next available slots when requested slot is taken';
COMMENT ON FUNCTION update_appointment_with_notification IS 'Updates appointment and tracks changes for notification';
COMMENT ON TABLE appointment_modifications IS 'Audit log of appointment modifications for notifications';

