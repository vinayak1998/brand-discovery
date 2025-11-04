-- Disable Row Level Security for creator_x_product_recommendations
ALTER TABLE public.creator_x_product_recommendations DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view product recommendations" ON public.creator_x_product_recommendations;
DROP POLICY IF EXISTS "Admins can insert product recommendations" ON public.creator_x_product_recommendations;
DROP POLICY IF EXISTS "Admins can update product recommendations" ON public.creator_x_product_recommendations;
DROP POLICY IF EXISTS "Admins can delete product recommendations" ON public.creator_x_product_recommendations;