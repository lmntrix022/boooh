-- Lien devis → produit physique pour déduction stock à la facture payée
-- Les lignes issues de "Ajouter un produit" auront product_id + card_id renseignés

ALTER TABLE public.quote_items
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS card_id UUID REFERENCES public.business_cards(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_quote_items_product_id ON public.quote_items(product_id) WHERE product_id IS NOT NULL;
COMMENT ON COLUMN public.quote_items.product_id IS 'Produit catalogue (déduction stock quand facture issue du devis est payée)';
COMMENT ON COLUMN public.quote_items.card_id IS 'Carte du produit (pour product_stock)';
