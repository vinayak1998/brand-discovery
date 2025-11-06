-- Add foreign key constraint between creator_brand_insights and brands
ALTER TABLE creator_brand_insights
ADD CONSTRAINT fk_creator_brand_insights_brand
FOREIGN KEY (brand_id) 
REFERENCES brands(brand_id)
ON DELETE CASCADE;