-- Add company_logo_url column to business_cards table
ALTER TABLE business_cards 
ADD COLUMN company_logo_url TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN business_cards.company_logo_url IS 'URL of the company logo image'; 