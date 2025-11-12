-- Add clicks_90d column to creator_x_product_recommendations table
ALTER TABLE creator_x_product_recommendations
ADD COLUMN clicks_90d integer NOT NULL DEFAULT 0;