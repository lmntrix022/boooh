-- Migration: Contact Interactions Table
-- Date: 2025-10-18
-- Description: Table pour stocker les notes et historique d'interactions avec les contacts

-- 1. Créer la table
CREATE TABLE IF NOT EXISTS public.contact_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.scanned_contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Type d'interaction
  type TEXT NOT NULL CHECK (type IN ('note', 'email', 'call', 'meeting', 'whatsapp', 'sms')),
  
  -- Contenu
  subject TEXT,
  content TEXT NOT NULL,
  
  -- Métadonnées additionnelles (optionnel)
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Index pour performance
CREATE INDEX idx_contact_interactions_contact_id ON public.contact_interactions(contact_id);
CREATE INDEX idx_contact_interactions_user_id ON public.contact_interactions(user_id);
CREATE INDEX idx_contact_interactions_type ON public.contact_interactions(type);
CREATE INDEX idx_contact_interactions_created_at ON public.contact_interactions(created_at DESC);

-- 3. Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_contact_interactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contact_interactions_updated_at
  BEFORE UPDATE ON public.contact_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_interactions_updated_at();

-- 4. Row Level Security (RLS)
ALTER TABLE public.contact_interactions ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs ne voient que leurs propres interactions
CREATE POLICY "Users can view their own contact interactions"
  ON public.contact_interactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent créer leurs propres interactions
CREATE POLICY "Users can create their own contact interactions"
  ON public.contact_interactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent modifier leurs propres interactions
CREATE POLICY "Users can update their own contact interactions"
  ON public.contact_interactions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent supprimer leurs propres interactions
CREATE POLICY "Users can delete their own contact interactions"
  ON public.contact_interactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Commentaires
COMMENT ON TABLE public.contact_interactions IS 'Historique des interactions et notes avec les contacts CRM';
COMMENT ON COLUMN public.contact_interactions.type IS 'Type d''interaction: note, email, call, meeting, whatsapp, sms';
COMMENT ON COLUMN public.contact_interactions.metadata IS 'Données additionnelles en JSON (ex: email_id, call_duration, etc)';

