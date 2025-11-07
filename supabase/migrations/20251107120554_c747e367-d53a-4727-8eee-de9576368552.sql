-- Add commission_pct column to creator_x_product_recommendations table
ALTER TABLE creator_x_product_recommendations
ADD COLUMN IF NOT EXISTS commission_pct numeric;