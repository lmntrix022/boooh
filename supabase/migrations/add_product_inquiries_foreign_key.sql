-- Ajout de la clé étrangère entre product_inquiries et products
ALTER TABLE product_inquiries
ADD CONSTRAINT product_inquiries_product_id_fkey
FOREIGN KEY (product_id)
REFERENCES products(id)
ON DELETE CASCADE; 