-- Migration: Appointment Notifications System
-- Created: 2025-10-19
-- Purpose: Email notifications, availability settings, reminders

-- 1. Table for card-specific availability settings
CREATE TABLE IF NOT EXISTS card_availability_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES business_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Working hours (JSONB for flexibility)
  -- Format: {"monday": [{"start": "09:00", "end": "17:00"}], ...}
  working_hours JSONB DEFAULT '{
    "monday": [{"start": "09:00", "end": "17:00"}],
    "tuesday": [{"start": "09:00", "end": "17:00"}],
    "wednesday": [{"start": "09:00", "end": "17:00"}],
    "thursday": [{"start": "09:00", "end": "17:00"}],
    "friday": [{"start": "09:00", "end": "17:00"}],
    "saturday": [],
    "sunday": []
  }'::JSONB,

  -- Timezone (IANA timezone format: "Europe/Paris", "America/New_York")
  timezone TEXT DEFAULT 'UTC',

  -- Default appointment duration in minutes
  default_duration INTEGER DEFAULT 60,

  -- Buffer time between appointments (minutes)
  buffer_time INTEGER DEFAULT 0,

  -- Advance booking settings
  min_booking_notice INTEGER DEFAULT 60, -- minimum minutes before appointment
  max_booking_advance INTEGER DEFAULT 30, -- maximum days in advance

  -- Email notification preferences
  notify_owner_new_appointment BOOLEAN DEFAULT TRUE,
  notify_owner_cancellation BOOLEAN DEFAULT TRUE,
  notify_client_confirmation BOOLEAN DEFAULT TRUE,
  notify_client_reminder BOOLEAN DEFAULT TRUE,

  -- Reminder timings (minutes before appointment)
  reminder_times INTEGER[] DEFAULT ARRAY[1440, 60], -- 24h and 1h before

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(card_id)
);

-- 2. Table for email notification logs
CREATE TABLE IF NOT EXISTS appointment_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL, -- 'booking_confirmation', 'owner_notification', 'status_update', 'reminder'
  recipient_email TEXT NOT NULL,
  recipient_type TEXT NOT NULL, -- 'owner' or 'client'
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table for scheduled reminders
CREATE TABLE IF NOT EXISTS appointment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  minutes_before INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'cancelled'
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(appointment_id, minutes_before)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_card_availability_card_id ON card_availability_settings(card_id);
CREATE INDEX IF NOT EXISTS idx_card_availability_user_id ON card_availability_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_appointment_id ON appointment_email_logs(appointment_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON appointment_email_logs(status);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled_for ON appointment_reminders(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON appointment_reminders(status, scheduled_for);

-- RLS Policies
ALTER TABLE card_availability_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_reminders ENABLE ROW LEVEL SECURITY;

-- Card availability: owner can read/write their own settings
CREATE POLICY "Users can manage their card availability settings"
  ON card_availability_settings
  FOR ALL
  USING (auth.uid() = user_id);

-- Separate SELECT policy for better compatibility
CREATE POLICY "Users can select their card availability settings"
  ON card_availability_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT policy
CREATE POLICY "Users can insert their card availability settings"
  ON card_availability_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE policy
CREATE POLICY "Users can update their card availability settings"
  ON card_availability_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- DELETE policy
CREATE POLICY "Users can delete their card availability settings"
  ON card_availability_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Email logs: owners can read logs for their appointments
CREATE POLICY "Owners can view email logs"
  ON appointment_email_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      JOIN business_cards bc ON a.card_id = bc.id
      WHERE a.id = appointment_email_logs.appointment_id
      AND bc.user_id = auth.uid()
    )
  );

-- Service role can insert email logs (for edge functions)
CREATE POLICY "Service can insert email logs"
  ON appointment_email_logs
  FOR INSERT
  WITH CHECK (true);

-- Reminders: owners can view their appointment reminders
CREATE POLICY "Owners can view reminders"
  ON appointment_reminders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      JOIN business_cards bc ON a.card_id = bc.id
      WHERE a.id = appointment_reminders.appointment_id
      AND bc.user_id = auth.uid()
    )
  );

-- Service role can manage reminders (for edge functions)
CREATE POLICY "Service can manage reminders"
  ON appointment_reminders
  FOR ALL
  USING (true);

-- Function to automatically create default availability settings for new cards
CREATE OR REPLACE FUNCTION create_default_availability_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO card_availability_settings (card_id, user_id)
  VALUES (NEW.id, NEW.user_id)
  ON CONFLICT (card_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default settings when a new card is created
DROP TRIGGER IF EXISTS trigger_create_default_availability ON business_cards;
CREATE TRIGGER trigger_create_default_availability
  AFTER INSERT ON business_cards
  FOR EACH ROW
  EXECUTE FUNCTION create_default_availability_settings();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at on card_availability_settings
DROP TRIGGER IF EXISTS trigger_update_availability_timestamp ON card_availability_settings;
CREATE TRIGGER trigger_update_availability_timestamp
  BEFORE UPDATE ON card_availability_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add timezone column to appointments table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments'
    AND column_name = 'timezone'
  ) THEN
    ALTER TABLE appointments ADD COLUMN timezone TEXT DEFAULT 'UTC';
  END IF;
END $$;

-- Add reminder_sent column to appointments table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments'
    AND column_name = 'reminder_24h_sent'
  ) THEN
    ALTER TABLE appointments ADD COLUMN reminder_24h_sent BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments'
    AND column_name = 'reminder_1h_sent'
  ) THEN
    ALTER TABLE appointments ADD COLUMN reminder_1h_sent BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

COMMENT ON TABLE card_availability_settings IS 'Stores working hours, timezone, and notification preferences for each business card';
COMMENT ON TABLE appointment_email_logs IS 'Logs all email notifications sent for appointments';
COMMENT ON TABLE appointment_reminders IS 'Scheduled reminders for upcoming appointments';
