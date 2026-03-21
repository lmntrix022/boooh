-- Ajout des nouveaux champs à la table profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;

-- Mise à jour des politiques pour les nouveaux champs
ALTER POLICY "Les utilisateurs peuvent voir leur propre profil" ON profiles
USING (auth.uid() = id);

ALTER POLICY "Les utilisateurs peuvent mettre à jour leur propre profil" ON profiles
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Ajout d'un index sur le champ location pour les futures recherches géographiques
CREATE INDEX IF NOT EXISTS profiles_location_idx ON profiles USING GIN (to_tsvector('french', location)); 