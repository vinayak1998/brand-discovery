-- Add new columns to creator_x_product_recommendations table
ALTER TABLE creator_x_product_recommendations
ADD COLUMN median_sales numeric,
ADD COLUMN median_reach numeric,
ADD COLUMN top_3_posts_by_views jsonb;