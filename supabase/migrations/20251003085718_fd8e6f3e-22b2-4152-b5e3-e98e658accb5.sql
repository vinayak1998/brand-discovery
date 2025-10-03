-- Create creators table
CREATE TABLE public.creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create brands table
CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create creator_brand_insights table
CREATE TABLE public.creator_brand_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE NOT NULL,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  theme_id TEXT NOT NULL,
  metric TEXT NOT NULL,
  value DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(creator_id, brand_id, theme_id)
);

-- Create survey_responses table
CREATE TABLE public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE NOT NULL,
  q1_useful TEXT,
  q2_intent TEXT,
  q3_themes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_creators_id ON public.creators(id);
CREATE INDEX idx_brands_name ON public.brands(brand_name);
CREATE INDEX idx_cbi_creator ON public.creator_brand_insights(creator_id);
CREATE INDEX idx_cbi_theme ON public.creator_brand_insights(theme_id);
CREATE INDEX idx_survey_creator ON public.survey_responses(creator_id);

-- Enable RLS on all tables
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_brand_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- Public read policies (admin write to be added later)
CREATE POLICY "Anyone can view creators"
  ON public.creators FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view brands"
  ON public.brands FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view insights"
  ON public.creator_brand_insights FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert survey responses"
  ON public.survey_responses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view survey responses"
  ON public.survey_responses FOR SELECT
  USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_creators_updated_at
  BEFORE UPDATE ON public.creators
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_insights_updated_at
  BEFORE UPDATE ON public.creator_brand_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();