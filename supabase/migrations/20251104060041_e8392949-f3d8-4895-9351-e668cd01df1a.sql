-- Add product_id column to creator_x_product_recommendations
ALTER TABLE public.creator_x_product_recommendations
ADD COLUMN product_id bigint;