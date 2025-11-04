-- Add count_90_days column to creator_x_product_recommendations
ALTER TABLE public.creator_x_product_recommendations 
ADD COLUMN count_90_days integer NOT NULL DEFAULT 0;