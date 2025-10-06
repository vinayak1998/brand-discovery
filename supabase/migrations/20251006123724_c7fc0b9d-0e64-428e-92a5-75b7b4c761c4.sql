-- Drop existing tables and recreate with new structure
DROP TABLE IF EXISTS public.creator_brand_insights CASCADE;
DROP TABLE IF EXISTS public.survey_responses CASCADE;
DROP TABLE IF EXISTS public.brands CASCADE;
DROP TABLE IF EXISTS public.creators CASCADE;

-- Create brands table with brand_id as primary key
CREATE TABLE public.brands (
  brand_id BIGINT PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  brand_name TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create creators table with creator_id as primary key
CREATE TABLE public.creators (
  creator_id BIGINT PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create creator_brand_insights with new foreign keys
CREATE TABLE public.creator_brand_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id BIGINT NOT NULL REFERENCES public.creators(creator_id) ON DELETE CASCADE,
  brand_id BIGINT NOT NULL REFERENCES public.brands(brand_id) ON DELETE CASCADE,
  theme_id TEXT NOT NULL,
  metric TEXT NOT NULL,
  value NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(creator_id, brand_id, theme_id, metric)
);

-- Create survey_responses with new foreign key
CREATE TABLE public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id BIGINT NOT NULL REFERENCES public.creators(creator_id) ON DELETE CASCADE,
  q1_useful TEXT,
  q1_value_rating INTEGER,
  q2_intent TEXT,
  q2_actionability TEXT,
  q3_themes TEXT,
  q4_missing_info TEXT,
  q5_barriers TEXT,
  q6_open_feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_brand_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- Brands policies
CREATE POLICY "Anyone can view brands" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Admins can insert brands" ON public.brands FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update brands" ON public.brands FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete brands" ON public.brands FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Creators policies
CREATE POLICY "Anyone can view creators" ON public.creators FOR SELECT USING (true);
CREATE POLICY "Admins can insert creators" ON public.creators FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update creators" ON public.creators FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete creators" ON public.creators FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Insights policies
CREATE POLICY "Anyone can view insights" ON public.creator_brand_insights FOR SELECT USING (true);
CREATE POLICY "Admins can insert insights" ON public.creator_brand_insights FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update insights" ON public.creator_brand_insights FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete insights" ON public.creator_brand_insights FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Survey policies
CREATE POLICY "Anyone can view survey responses" ON public.survey_responses FOR SELECT USING (true);
CREATE POLICY "Anyone can insert survey responses" ON public.survey_responses FOR INSERT WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_creators_updated_at BEFORE UPDATE ON public.creators
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_insights_updated_at BEFORE UPDATE ON public.creator_brand_insights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert mock data for testing
-- Mock creators
INSERT INTO public.creators (creator_id, name) VALUES
  (1001, 'Sarah Johnson'),
  (1002, 'Mike Chen'),
  (1003, 'Emma Rodriguez');

-- Mock brands
INSERT INTO public.brands (brand_id, brand_name, logo_url, website_url) VALUES
  (2001, 'TechCorp', 'https://example.com/techcorp-logo.png', 'https://techcorp.com'),
  (2002, 'FashionHub', 'https://example.com/fashionhub-logo.png', 'https://fashionhub.com'),
  (2003, 'FoodieWorld', 'https://example.com/foodieworld-logo.png', 'https://foodieworld.com');

-- Mock creator brand insights
INSERT INTO public.creator_brand_insights (creator_id, brand_id, theme_id, metric, value) VALUES
  (1001, 2001, 'engagement', 'likes', 15000),
  (1001, 2001, 'engagement', 'comments', 2500),
  (1001, 2002, 'engagement', 'likes', 22000),
  (1001, 2002, 'engagement', 'shares', 3400),
  (1002, 2001, 'engagement', 'likes', 18500),
  (1002, 2003, 'engagement', 'likes', 12000),
  (1003, 2002, 'engagement', 'likes', 31000),
  (1003, 2003, 'engagement', 'comments', 4200);

-- Mock survey responses
INSERT INTO public.survey_responses (creator_id, q1_useful, q1_value_rating, q2_intent, q2_actionability) VALUES
  (1001, 'Very useful', 5, 'yes', 'high'),
  (1002, 'Somewhat useful', 4, 'maybe', 'medium');