-- Enable PostGIS extension for geographical data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add new columns to business_cards table
ALTER TABLE business_cards ADD COLUMN IF NOT EXISTS latitude DECIMAL;
ALTER TABLE business_cards ADD COLUMN IF NOT EXISTS longitude DECIMAL;
ALTER TABLE business_cards ADD COLUMN IF NOT EXISTS business_sector VARCHAR(100);
ALTER TABLE business_cards ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE business_cards ADD COLUMN IF NOT EXISTS district VARCHAR(100);

-- Create index for geographical queries
CREATE INDEX IF NOT EXISTS idx_business_cards_location 
ON business_cards USING gist (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326));

-- Create business sectors table
CREATE TABLE IF NOT EXISTS business_sectors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES business_sectors(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add some default business sectors
INSERT INTO business_sectors (name) VALUES
    ('Services'),
    ('Commerce'),
    ('Artisanat'),
    ('Santé'),
    ('Education'),
    ('Art et Culture')
ON CONFLICT DO NOTHING; 