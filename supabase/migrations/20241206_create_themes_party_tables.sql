-- Migration pour créer les tables themes_party et party
-- Date: 2024-12-06

-- Table des catégories de fêtes/événements
CREATE TABLE IF NOT EXISTS party (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  duration_days INTEGER DEFAULT 1,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des thèmes de fêtes
CREATE TABLE IF NOT EXISTS themes_party (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  party_id UUID REFERENCES party(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT,
  preview_image_url TEXT,
  background_color VARCHAR(20) DEFAULT '#ffffff',
  text_color VARCHAR(20) DEFAULT '#000000',
  accent_color VARCHAR(20) DEFAULT '#3b82f6',
  is_premium BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_themes_party_party_id ON themes_party(party_id);
CREATE INDEX IF NOT EXISTS idx_themes_party_active ON themes_party(is_active);
CREATE INDEX IF NOT EXISTS idx_themes_party_sort_order ON themes_party(sort_order);
CREATE INDEX IF NOT EXISTS idx_party_active ON party(is_active);

-- RLS (Row Level Security) - Politiques de sécurité
ALTER TABLE party ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes_party ENABLE ROW LEVEL SECURITY;

-- Politiques pour la table party
CREATE POLICY "Les utilisateurs authentifiés peuvent voir les fêtes actives" ON party
  FOR SELECT USING (is_active = true);

CREATE POLICY "Les admins peuvent gérer toutes les fêtes" ON party
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Politiques pour la table themes_party
CREATE POLICY "Les utilisateurs authentifiés peuvent voir les thèmes actifs" ON themes_party
  FOR SELECT USING (is_active = true);

CREATE POLICY "Les admins peuvent gérer tous les thèmes" ON themes_party
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_party_updated_at 
  BEFORE UPDATE ON party 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_themes_party_updated_at 
  BEFORE UPDATE ON themes_party 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertion de données de base pour les fêtes
INSERT INTO party (name, description, duration_days, start_date, end_date) VALUES
('Noël', 'Fête de Noël et période des fêtes de fin d''année', 12, '2024-12-20', '2024-12-31'),
('Nouvel An', 'Célébration du Nouvel An', 1, '2025-01-01', '2025-01-01'),
('Saint-Valentin', 'Fête des amoureux', 1, '2025-02-14', '2025-02-14'),
('Pâques', 'Fête de Pâques et période pascale', 4, '2025-04-20', '2025-04-23'),
('Halloween', 'Fête d''Halloween', 1, '2024-10-31', '2024-10-31'),
('Anniversaire', 'Célébration d''anniversaire', 1, NULL, NULL),
('Mariage', 'Cérémonie de mariage', 1, NULL, NULL),
('Naissance', 'Célébration de naissance', 1, NULL, NULL),
('Diplôme', 'Célébration de diplôme', 1, NULL, NULL),
('Retraite', 'Célébration de retraite', 1, NULL, NULL)
ON CONFLICT (name) DO NOTHING;

-- Insertion de thèmes de base pour Noël
INSERT INTO themes_party (party_id, name, description, background_color, text_color, accent_color, is_premium, sort_order) 
SELECT 
  p.id,
  'Noël Classique',
  'Thème traditionnel de Noël avec rouge et vert',
  '#1a1a1a',
  '#ffffff',
  '#dc2626',
  false,
  1
FROM party p WHERE p.name = 'Noël';

INSERT INTO themes_party (party_id, name, description, background_color, text_color, accent_color, is_premium, sort_order) 
SELECT 
  p.id,
  'Noël Moderne',
  'Thème moderne de Noël avec doré et blanc',
  '#0f172a',
  '#ffffff',
  '#fbbf24',
  true,
  2
FROM party p WHERE p.name = 'Noël';

INSERT INTO themes_party (party_id, name, description, background_color, text_color, accent_color, is_premium, sort_order) 
SELECT 
  p.id,
  'Noël Minimaliste',
  'Thème épuré de Noël avec tons neutres',
  '#f8fafc',
  '#1e293b',
  '#059669',
  false,
  3
FROM party p WHERE p.name = 'Noël';

-- Insertion de thèmes pour Halloween
INSERT INTO themes_party (party_id, name, description, background_color, text_color, accent_color, is_premium, sort_order) 
SELECT 
  p.id,
  'Halloween Sombre',
  'Thème sombre et mystérieux d''Halloween',
  '#000000',
  '#ffffff',
  '#dc2626',
  false,
  1
FROM party p WHERE p.name = 'Halloween';

INSERT INTO themes_party (party_id, name, description, background_color, text_color, accent_color, is_premium, sort_order) 
SELECT 
  p.id,
  'Halloween Orange',
  'Thème orange classique d''Halloween',
  '#1f2937',
  '#ffffff',
  '#f97316',
  false,
  2
FROM party p WHERE p.name = 'Halloween';

-- Insertion de thèmes pour Saint-Valentin
INSERT INTO themes_party (party_id, name, description, background_color, text_color, accent_color, is_premium, sort_order) 
SELECT 
  p.id,
  'Romance Rose',
  'Thème romantique avec rose et rouge',
  '#fdf2f8',
  '#1f2937',
  '#ec4899',
  false,
  1
FROM party p WHERE p.name = 'Saint-Valentin';

INSERT INTO themes_party (party_id, name, description, background_color, text_color, accent_color, is_premium, sort_order) 
SELECT 
  p.id,
  'Amour Élégant',
  'Thème élégant pour Saint-Valentin',
  '#1e1b4b',
  '#ffffff',
  '#f472b6',
  true,
  2
FROM party p WHERE p.name = 'Saint-Valentin';
