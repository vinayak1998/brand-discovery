-- Create feature_flags table for admin controls
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_key text NOT NULL UNIQUE,
  flag_name text NOT NULL,
  description text,
  is_enabled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Anyone can read feature flags
CREATE POLICY "Anyone can view feature flags"
  ON public.feature_flags
  FOR SELECT
  USING (true);

-- Only admins can manage feature flags
CREATE POLICY "Admins can insert feature flags"
  ON public.feature_flags
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update feature flags"
  ON public.feature_flags
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete feature flags"
  ON public.feature_flags
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default quick_surveys feature flag
INSERT INTO public.feature_flags (flag_key, flag_name, description, is_enabled)
VALUES 
  ('quick_surveys_enabled', 'Quick Surveys', 'Enable/disable all quick survey popups across the application', true)
ON CONFLICT (flag_key) DO NOTHING;