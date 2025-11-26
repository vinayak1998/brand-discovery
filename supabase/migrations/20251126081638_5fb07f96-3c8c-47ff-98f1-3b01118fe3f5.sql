-- Re-add foreign key constraint on creator_brand_insights.brand_id
ALTER TABLE public.creator_brand_insights
  ADD CONSTRAINT creator_brand_insights_brand_id_fkey 
  FOREIGN KEY (brand_id) 
  REFERENCES public.brands(brand_id);