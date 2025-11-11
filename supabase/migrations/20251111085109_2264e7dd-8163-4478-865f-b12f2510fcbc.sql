-- Rename category to cat
ALTER TABLE creator_x_product_recommendations 
RENAME COLUMN category TO cat;

-- Rename subcategory to sscat
ALTER TABLE creator_x_product_recommendations 
RENAME COLUMN subcategory TO sscat;

-- Rename header to gender
ALTER TABLE creator_x_product_recommendations 
RENAME COLUMN header TO gender;