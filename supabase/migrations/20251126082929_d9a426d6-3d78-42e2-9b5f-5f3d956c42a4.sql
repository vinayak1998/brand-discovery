-- Index on creator_id for faster creator-based queries
CREATE INDEX idx_creator_x_product_recommendations_creator_id 
ON creator_x_product_recommendations (creator_id);

-- Index on updated_at for faster time-based queries/sorting
CREATE INDEX idx_creator_x_product_recommendations_updated_at 
ON creator_x_product_recommendations (updated_at);