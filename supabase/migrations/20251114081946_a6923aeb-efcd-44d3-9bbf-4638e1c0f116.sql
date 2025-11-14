-- Create quick_survey_responses table
CREATE TABLE public.quick_survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id bigint NOT NULL,
  survey_id text NOT NULL,
  context jsonb DEFAULT '{}'::jsonb,
  questions jsonb NOT NULL,
  time_to_complete_ms integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create survey_rate_limits table
CREATE TABLE public.survey_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id bigint NOT NULL,
  survey_id text NOT NULL,
  last_shown_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(creator_id, survey_id)
);

-- Enable RLS
ALTER TABLE public.quick_survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quick_survey_responses
CREATE POLICY "Anyone can insert survey responses"
ON public.quick_survey_responses
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all survey responses"
ON public.quick_survey_responses
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for survey_rate_limits
CREATE POLICY "Anyone can insert rate limits"
ON public.survey_rate_limits
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view their own rate limits"
ON public.survey_rate_limits
FOR SELECT
USING (true);

CREATE POLICY "Anyone can update rate limits"
ON public.survey_rate_limits
FOR UPDATE
USING (true);

-- Create indexes for performance
CREATE INDEX idx_quick_survey_responses_creator_id ON public.quick_survey_responses(creator_id);
CREATE INDEX idx_quick_survey_responses_survey_id ON public.quick_survey_responses(survey_id);
CREATE INDEX idx_quick_survey_responses_created_at ON public.quick_survey_responses(created_at);

CREATE INDEX idx_survey_rate_limits_creator_id ON public.survey_rate_limits(creator_id);
CREATE INDEX idx_survey_rate_limits_survey_id ON public.survey_rate_limits(survey_id);
CREATE INDEX idx_survey_rate_limits_last_shown_at ON public.survey_rate_limits(last_shown_at);