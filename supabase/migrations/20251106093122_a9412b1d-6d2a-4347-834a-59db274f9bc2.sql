-- Remove duplicate foreign key constraint
-- The constraint creator_brand_insights_brand_id_fkey already existed
ALTER TABLE creator_brand_insights
DROP CONSTRAINT IF EXISTS fk_creator_brand_insights_brand;