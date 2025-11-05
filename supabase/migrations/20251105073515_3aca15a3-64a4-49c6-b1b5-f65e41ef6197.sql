-- Create view for distinct creator-brand pairs
CREATE VIEW creator_brand_pairs AS
SELECT DISTINCT
    c.creator_id,
    b.brand_name
FROM creator_brand_insights c
JOIN brands b
    ON c.brand_id = b.brand_id;