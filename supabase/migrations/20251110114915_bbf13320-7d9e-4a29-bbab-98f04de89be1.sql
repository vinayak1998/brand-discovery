-- Add category and subcategory columns to creator_x_product_recommendations
ALTER TABLE creator_x_product_recommendations 
ADD COLUMN category text,
ADD COLUMN subcategory text;