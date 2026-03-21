-- Migration: Portfolio/Services Module (Mon Univers)
-- Description: Création des tables pour le module Portfolio/Services
-- Date: 2025-10-14

-- =====================================================
-- 1. TABLE: portfolio_projects (Réalisations / Projets)
-- =====================================================
CREATE TABLE IF NOT EXISTS portfolio_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID REFERENCES business_cards(id) ON DELETE CASCADE,

  -- Informations générales
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(100), -- Ex: Graphisme, Conseil, Formation, Développement
  tags TEXT[], -- Tags pour le filtrage

  -- Contenu riche
  short_description TEXT, -- Description courte (160 caractères max)
  challenge TEXT, -- Le Défi du Client
  solution TEXT, -- La Solution Fournie
  result TEXT, -- Le Résultat Obtenu

  -- Médias
  featured_image TEXT, -- Image principale
  gallery_images TEXT[], -- Galerie d'images
  video_url TEXT, -- URL vidéo (YouTube, Vimeo)
  pdf_url TEXT, -- URL du PDF (plaquette)

  -- Call-to-Action
  cta_type VARCHAR(50) DEFAULT 'contact', -- contact, booking, quote, custom
  cta_label VARCHAR(100), -- Texte du bouton CTA
  cta_url TEXT, -- URL custom si besoin

  -- Témoignage lié
  testimonial_author VARCHAR(255),
  testimonial_role VARCHAR(255),
  testimonial_content TEXT,
  testimonial_rating INTEGER CHECK (testimonial_rating >= 1 AND testimonial_rating <= 5),
  testimonial_date DATE,

  -- Métadonnées
  is_published BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0, -- Pour l'ordre d'affichage

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_portfolio_projects_user_id ON portfolio_projects(user_id);
CREATE INDEX idx_portfolio_projects_card_id ON portfolio_projects(card_id);
CREATE INDEX idx_portfolio_projects_category ON portfolio_projects(category);
CREATE INDEX idx_portfolio_projects_is_published ON portfolio_projects(is_published);
CREATE INDEX idx_portfolio_projects_slug ON portfolio_projects(slug);

-- =====================================================
-- 2. TABLE: service_quotes (Demandes de Devis)
-- =====================================================
CREATE TABLE IF NOT EXISTS service_quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Propriétaire de la carte
  card_id UUID REFERENCES business_cards(id) ON DELETE CASCADE,
  project_id UUID REFERENCES portfolio_projects(id) ON DELETE SET NULL,

  -- Informations du client
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_phone VARCHAR(50),
  client_company VARCHAR(255),

  -- Détails de la demande
  service_requested TEXT NOT NULL,
  project_description TEXT,
  budget_range VARCHAR(100), -- Ex: 1000-5000, 5000-10000
  urgency VARCHAR(50), -- urgent, normal, flexible
  preferred_start_date DATE,

  -- Statut et suivi (CRM)
  status VARCHAR(50) DEFAULT 'new', -- new, in_progress, quoted, accepted, refused, closed
  priority VARCHAR(50) DEFAULT 'normal', -- low, normal, high, urgent

  -- Proposition/Devis généré
  quote_amount DECIMAL(10, 2),
  quote_currency VARCHAR(10) DEFAULT 'FCFA',
  quote_pdf_url TEXT,
  quote_sent_at TIMESTAMP WITH TIME ZONE,
  quote_expires_at TIMESTAMP WITH TIME ZONE,

  -- Conversion
  converted_to_invoice_id UUID, -- Référence à une facture si convertie
  conversion_date TIMESTAMP WITH TIME ZONE,

  -- Notes internes (pour le propriétaire)
  internal_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_contact_at TIMESTAMP WITH TIME ZONE
);

-- Index pour les performances
CREATE INDEX idx_service_quotes_user_id ON service_quotes(user_id);
CREATE INDEX idx_service_quotes_card_id ON service_quotes(card_id);
CREATE INDEX idx_service_quotes_project_id ON service_quotes(project_id);
CREATE INDEX idx_service_quotes_status ON service_quotes(status);
CREATE INDEX idx_service_quotes_client_email ON service_quotes(client_email);
CREATE INDEX idx_service_quotes_created_at ON service_quotes(created_at DESC);

-- =====================================================
-- 3. TABLE: portfolio_settings (Paramètres du Portfolio)
-- =====================================================
CREATE TABLE IF NOT EXISTS portfolio_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID UNIQUE REFERENCES business_cards(id) ON DELETE CASCADE,

  -- Activation
  is_enabled BOOLEAN DEFAULT false,

  -- Personnalisation
  title VARCHAR(255) DEFAULT 'Mon Univers',
  subtitle TEXT,
  cover_image TEXT,
  brand_color VARCHAR(7) DEFAULT '#8B5CF6',

  -- Options d'affichage
  show_categories BOOLEAN DEFAULT true,
  show_testimonials BOOLEAN DEFAULT true,
  projects_per_page INTEGER DEFAULT 12,
  default_view VARCHAR(50) DEFAULT 'grid', -- grid, list, masonry

  -- Intégrations
  booking_system VARCHAR(50), -- calendly, google_calendar, internal
  booking_url TEXT,

  -- Analytics
  track_project_views BOOLEAN DEFAULT true,
  track_quote_requests BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_portfolio_settings_user_id ON portfolio_settings(user_id);
CREATE INDEX idx_portfolio_settings_card_id ON portfolio_settings(card_id);

-- =====================================================
-- 4. TABLE: portfolio_analytics (Analytics détaillées)
-- =====================================================
CREATE TABLE IF NOT EXISTS portfolio_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID REFERENCES business_cards(id) ON DELETE CASCADE,
  project_id UUID REFERENCES portfolio_projects(id) ON DELETE CASCADE,

  -- Type d'événement
  event_type VARCHAR(50) NOT NULL, -- view, cta_click, quote_request, booking_click

  -- Détails
  visitor_ip VARCHAR(45),
  visitor_country VARCHAR(2),
  visitor_city VARCHAR(100),
  referrer_url TEXT,
  user_agent TEXT,

  -- Métadonnées
  metadata JSONB,

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_portfolio_analytics_user_id ON portfolio_analytics(user_id);
CREATE INDEX idx_portfolio_analytics_card_id ON portfolio_analytics(card_id);
CREATE INDEX idx_portfolio_analytics_project_id ON portfolio_analytics(project_id);
CREATE INDEX idx_portfolio_analytics_event_type ON portfolio_analytics(event_type);
CREATE INDEX idx_portfolio_analytics_created_at ON portfolio_analytics(created_at DESC);

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_analytics ENABLE ROW LEVEL SECURITY;

-- Policies pour portfolio_projects
CREATE POLICY "Users can view their own projects"
  ON portfolio_projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
  ON portfolio_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON portfolio_projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON portfolio_projects FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view published projects"
  ON portfolio_projects FOR SELECT
  USING (is_published = true);

-- Policies pour service_quotes
CREATE POLICY "Users can view their own quotes"
  ON service_quotes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create quotes"
  ON service_quotes FOR INSERT
  WITH CHECK (true); -- Les visiteurs peuvent créer des demandes

CREATE POLICY "Users can update their own quotes"
  ON service_quotes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quotes"
  ON service_quotes FOR DELETE
  USING (auth.uid() = user_id);

-- Policies pour portfolio_settings
CREATE POLICY "Users can view their own settings"
  ON portfolio_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON portfolio_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON portfolio_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view enabled portfolio settings"
  ON portfolio_settings FOR SELECT
  USING (is_enabled = true);

-- Policies pour portfolio_analytics (lecture seule pour le propriétaire)
CREATE POLICY "Users can view their own analytics"
  ON portfolio_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert analytics"
  ON portfolio_analytics FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 6. TRIGGERS POUR updated_at
-- =====================================================

-- Fonction générique pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_portfolio_projects_updated_at
  BEFORE UPDATE ON portfolio_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_quotes_updated_at
  BEFORE UPDATE ON service_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_settings_updated_at
  BEFORE UPDATE ON portfolio_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour générer un slug unique
CREATE OR REPLACE FUNCTION generate_unique_slug(title_text TEXT, user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Générer le slug de base
  base_slug := lower(regexp_replace(title_text, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := trim(both '-' from base_slug);

  final_slug := base_slug;

  -- Vérifier l'unicité et ajouter un suffixe si nécessaire
  WHILE EXISTS (SELECT 1 FROM portfolio_projects WHERE slug = final_slug AND user_id = user_uuid) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les statistiques du portfolio
CREATE OR REPLACE FUNCTION get_portfolio_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_projects', (SELECT COUNT(*) FROM portfolio_projects WHERE user_id = user_uuid),
    'published_projects', (SELECT COUNT(*) FROM portfolio_projects WHERE user_id = user_uuid AND is_published = true),
    'total_views', (SELECT COALESCE(SUM(view_count), 0) FROM portfolio_projects WHERE user_id = user_uuid),
    'total_quotes', (SELECT COUNT(*) FROM service_quotes WHERE user_id = user_uuid),
    'pending_quotes', (SELECT COUNT(*) FROM service_quotes WHERE user_id = user_uuid AND status IN ('new', 'in_progress')),
    'converted_quotes', (SELECT COUNT(*) FROM service_quotes WHERE user_id = user_uuid AND status = 'accepted'),
    'quote_conversion_rate', (
      CASE
        WHEN (SELECT COUNT(*) FROM service_quotes WHERE user_id = user_uuid) > 0
        THEN ROUND(
          (SELECT COUNT(*)::DECIMAL FROM service_quotes WHERE user_id = user_uuid AND status = 'accepted') * 100.0 /
          (SELECT COUNT(*) FROM service_quotes WHERE user_id = user_uuid),
          2
        )
        ELSE 0
      END
    )
  ) INTO stats;

  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. DONNÉES DE TEST (Optionnel)
-- =====================================================

-- Commenté par défaut - décommenter pour insérer des données de test
/*
-- Insérer un portfolio_settings de test
INSERT INTO portfolio_settings (user_id, is_enabled, title, subtitle)
SELECT
  id,
  true,
  'Mon Univers',
  'Découvrez mes réalisations et demandez un devis personnalisé'
FROM auth.users
LIMIT 1;

-- Insérer des projets de test
INSERT INTO portfolio_projects (user_id, title, slug, category, short_description, challenge, solution, result, is_published)
SELECT
  id,
  'Refonte Identité Visuelle',
  'refonte-identite-visuelle',
  'Graphisme',
  'Création complète d''une identité visuelle pour une startup tech',
  'La startup avait besoin d''une image professionnelle et moderne',
  'Développement d''un logo, charte graphique et supports de communication',
  'Identité forte et cohérente sur tous les supports',
  true
FROM auth.users
LIMIT 1;
*/

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
