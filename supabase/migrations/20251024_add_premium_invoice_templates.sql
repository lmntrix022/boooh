-- Migration to add premium invoice templates
-- Date: 2025-10-24
-- Description: Adds new premium PDF templates (premium, elegant, corporate, light) to invoice_settings

-- Update the CHECK constraint on invoice_settings.pdf_template to include new templates
ALTER TABLE invoice_settings
DROP CONSTRAINT IF EXISTS invoice_settings_pdf_template_check;

ALTER TABLE invoice_settings
ADD CONSTRAINT invoice_settings_pdf_template_check 
CHECK (pdf_template IN ('modern', 'minimal', 'classic', 'premium', 'elegant', 'corporate', 'light'));

-- Add comment for documentation
COMMENT ON CONSTRAINT invoice_settings_pdf_template_check ON invoice_settings IS 
'Valid PDF template styles: modern (colorful), minimal (clean), classic (traditional), premium (elegant), elegant (sophisticated), corporate (professional), light (minimalist)';
