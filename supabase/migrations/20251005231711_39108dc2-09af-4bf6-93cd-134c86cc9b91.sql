-- Remove theme metadata columns from creator_brand_insights
-- Keep only theme_id to reference hardcoded themes
ALTER TABLE creator_brand_insights 
DROP COLUMN IF EXISTS theme_title,
DROP COLUMN IF EXISTS theme_icon,
DROP COLUMN IF EXISTS theme_tagline,
DROP COLUMN IF EXISTS theme_color;