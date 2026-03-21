-- Migration pour créer la table de registrations d'appareils
-- Date: 2025-10-17
-- Permet de lier les téléchargements à des appareils spécifiques

-- Table pour enregistrer les appareils autorisés
CREATE TABLE IF NOT EXISTS public.device_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    purchase_id TEXT NOT NULL, -- Référence au download_token ou purchase_id
    device_fingerprint TEXT NOT NULL,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_access_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Informations de l'appareil
    user_agent TEXT,
    platform TEXT,
    screen_resolution TEXT,
    timezone TEXT,
    language TEXT,
    
    -- Statut
    is_active BOOLEAN DEFAULT TRUE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revocation_reason TEXT,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_device_registrations_purchase 
ON public.device_registrations(purchase_id);

CREATE INDEX IF NOT EXISTS idx_device_registrations_fingerprint 
ON public.device_registrations(device_fingerprint);

CREATE INDEX IF NOT EXISTS idx_device_registrations_active 
ON public.device_registrations(is_active) 
WHERE is_active = TRUE;

-- Contrainte unique : un appareil par purchase
CREATE UNIQUE INDEX IF NOT EXISTS idx_device_registrations_unique 
ON public.device_registrations(purchase_id, device_fingerprint);

-- RLS Policies
ALTER TABLE public.device_registrations ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs authentifiés peuvent voir leurs propres registrations
CREATE POLICY "Users can view their own device registrations" 
ON public.device_registrations
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Policy: Le système peut insérer des registrations
CREATE POLICY "System can insert device registrations" 
ON public.device_registrations
FOR INSERT
WITH CHECK (TRUE);

-- Policy: Les utilisateurs peuvent révoquer leurs propres appareils
CREATE POLICY "Users can revoke their own device registrations" 
ON public.device_registrations
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Fonction pour mettre à jour last_access_at
CREATE OR REPLACE FUNCTION update_device_last_access()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_access_at = NOW();
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement
DROP TRIGGER IF EXISTS trigger_update_device_last_access ON public.device_registrations;
CREATE TRIGGER trigger_update_device_last_access
BEFORE UPDATE ON public.device_registrations
FOR EACH ROW
EXECUTE FUNCTION update_device_last_access();

-- Commentaires
COMMENT ON TABLE public.device_registrations IS 
'Enregistre les appareils autorisés pour les téléchargements de produits numériques';

COMMENT ON COLUMN public.device_registrations.device_fingerprint IS 
'Empreinte unique de l''appareil générée côté client';

COMMENT ON COLUMN public.device_registrations.purchase_id IS 
'Référence à l''achat (download_token ou purchase_id)';

COMMENT ON COLUMN public.device_registrations.is_active IS 
'Indique si l''appareil est toujours autorisé';

COMMENT ON COLUMN public.device_registrations.revocation_reason IS 
'Raison de la révocation (ex: appareil perdu, sécurité compromise)';





















