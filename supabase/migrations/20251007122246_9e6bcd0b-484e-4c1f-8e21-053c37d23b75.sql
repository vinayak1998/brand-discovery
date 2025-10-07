-- First, keep only the row with the maximum value for each (creator_id, brand_id, theme_id) combination
DELETE FROM creator_brand_insights
WHERE id NOT IN (
  SELECT DISTINCT ON (creator_id, brand_id, theme_id) id
  FROM creator_brand_insights
  ORDER BY creator_id, brand_id, theme_id, value DESC
);

-- Drop the existing unique constraint on (creator_id, brand_id, theme_id, metric)
ALTER TABLE creator_brand_insights 
DROP CONSTRAINT IF EXISTS creator_brand_insights_creator_id_brand_id_theme_id_metric_key;

-- Remove the metric column from creator_brand_insights table
ALTER TABLE creator_brand_insights 
DROP COLUMN metric;

-- Add new unique constraint on (creator_id, brand_id, theme_id)
ALTER TABLE creator_brand_insights 
ADD CONSTRAINT creator_brand_insights_creator_id_brand_id_theme_id_key 
UNIQUE (creator_id, brand_id, theme_id);