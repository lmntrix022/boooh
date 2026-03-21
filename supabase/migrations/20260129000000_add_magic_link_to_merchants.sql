-- Add magic_link column to boohpay_merchants table
ALTER TABLE boohpay_merchants
ADD COLUMN IF NOT EXISTS magic_link TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_boohpay_merchants_magic_link 
ON boohpay_merchants(magic_link);

-- Add comment
COMMENT ON COLUMN boohpay_merchants.magic_link IS 'Magic link URL for merchant dashboard access';
