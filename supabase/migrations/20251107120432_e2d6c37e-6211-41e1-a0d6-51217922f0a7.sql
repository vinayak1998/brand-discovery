-- Add missing columns to creator_x_product_recommendations table
ALTER TABLE creator_x_product_recommendations
ADD COLUMN IF NOT EXISTS price numeric,
ADD COLUMN IF NOT EXISTS short_code text,
ADD COLUMN IF NOT EXISTS brand_id bigint;