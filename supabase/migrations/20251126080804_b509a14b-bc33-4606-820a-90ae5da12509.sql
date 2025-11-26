-- Drop foreign key constraint on creator_brand_insights.brand_id so insights don't require brands to exist first
ALTER TABLE public.creator_brand_insights
  DROP CONSTRAINT IF EXISTS creator_brand_insights_brand_id_fkey;