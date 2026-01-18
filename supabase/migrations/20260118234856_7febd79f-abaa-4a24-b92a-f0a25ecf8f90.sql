-- Create function for bulk updating content_themes
CREATE OR REPLACE FUNCTION public.bulk_update_content_themes(
  updates JSONB
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER := 0;
  update_item JSONB;
BEGIN
  FOR update_item IN SELECT * FROM jsonb_array_elements(updates)
  LOOP
    UPDATE creator_x_product_recommendations
    SET content_themes = ARRAY(
      SELECT jsonb_array_elements_text(update_item->'content_themes')
    ),
    updated_at = now()
    WHERE id = (update_item->>'id')::bigint;
    
    updated_count := updated_count + 1;
  END LOOP;
  RETURN updated_count;
END;
$$;