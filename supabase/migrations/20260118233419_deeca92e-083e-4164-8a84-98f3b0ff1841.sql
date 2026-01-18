-- Add content_themes array column for multi-theme support
ALTER TABLE creator_x_product_recommendations 
ADD COLUMN content_themes TEXT[];

-- Create GIN index for efficient array filtering
CREATE INDEX idx_product_content_themes 
ON creator_x_product_recommendations USING GIN(content_themes);