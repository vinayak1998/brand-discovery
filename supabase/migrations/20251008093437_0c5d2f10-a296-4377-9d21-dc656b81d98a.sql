-- Create analytics events table for tracking creator engagement
CREATE TABLE public.creator_engagement_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id BIGINT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'theme_view', 'brand_click', 'brand_website_click', 'cta_click', 'survey_start', 'survey_submit', 'session_start', 'session_end')),
  theme_id TEXT CHECK (theme_id IN ('top_trending', 'best_reach', 'fastest_selling', 'highest_commission')),
  brand_id BIGINT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.creator_engagement_events ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert events (for tracking)
CREATE POLICY "Anyone can insert engagement events" 
ON public.creator_engagement_events 
FOR INSERT 
WITH CHECK (true);

-- Policy: Admins can view all events
CREATE POLICY "Admins can view all engagement events" 
ON public.creator_engagement_events 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better query performance
CREATE INDEX idx_creator_engagement_creator_id ON public.creator_engagement_events(creator_id);
CREATE INDEX idx_creator_engagement_event_type ON public.creator_engagement_events(event_type);
CREATE INDEX idx_creator_engagement_theme_id ON public.creator_engagement_events(theme_id);
CREATE INDEX idx_creator_engagement_created_at ON public.creator_engagement_events(created_at DESC);
CREATE INDEX idx_creator_engagement_composite ON public.creator_engagement_events(creator_id, event_type, created_at DESC);