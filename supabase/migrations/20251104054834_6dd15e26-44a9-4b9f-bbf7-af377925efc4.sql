-- Create creator_x_product_recommendations table
CREATE TABLE public.creator_x_product_recommendations (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  creator_id bigint REFERENCES public.creators(creator_id) ON DELETE CASCADE,
  sim_score numeric NOT NULL,
  post_clicks integer NOT NULL DEFAULT 0,
  thumbnail_url text,
  platform text,
  name text NOT NULL,
  brand text,
  header text,
  purchase_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.creator_x_product_recommendations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view product recommendations"
ON public.creator_x_product_recommendations
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert product recommendations"
ON public.creator_x_product_recommendations
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update product recommendations"
ON public.creator_x_product_recommendations
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete product recommendations"
ON public.creator_x_product_recommendations
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_creator_x_product_recommendations_updated_at
BEFORE UPDATE ON public.creator_x_product_recommendations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();