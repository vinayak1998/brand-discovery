-- Create table for wishlisted products
CREATE TABLE public.creator_wishlisted_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(creator_id, product_id)
);

-- Enable RLS
ALTER TABLE public.creator_wishlisted_products ENABLE ROW LEVEL SECURITY;

-- Anyone can insert wishlisted products (creators save without auth)
CREATE POLICY "Anyone can insert wishlisted products" ON public.creator_wishlisted_products
  FOR INSERT WITH CHECK (true);

-- Anyone can view wishlisted products
CREATE POLICY "Anyone can view wishlisted products" ON public.creator_wishlisted_products
  FOR SELECT USING (true);

-- Anyone can delete wishlisted products
CREATE POLICY "Anyone can delete wishlisted products" ON public.creator_wishlisted_products
  FOR DELETE USING (true);