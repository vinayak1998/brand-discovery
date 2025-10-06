-- Add new columns to survey_responses table for improved survey structure
ALTER TABLE public.survey_responses
ADD COLUMN IF NOT EXISTS q1_value_rating INTEGER CHECK (q1_value_rating >= 1 AND q1_value_rating <= 5),
ADD COLUMN IF NOT EXISTS q2_actionability TEXT,
ADD COLUMN IF NOT EXISTS q4_missing_info TEXT,
ADD COLUMN IF NOT EXISTS q5_barriers TEXT,
ADD COLUMN IF NOT EXISTS q6_open_feedback TEXT;

-- Add comments to document the new survey structure
COMMENT ON COLUMN public.survey_responses.q1_value_rating IS 'Q1: How valuable were these brand insights? (1-5 star rating)';
COMMENT ON COLUMN public.survey_responses.q2_actionability IS 'Q2: How likely to take action? (Likert scale: Very Likely, Likely, Neutral, Unlikely, Very Unlikely)';
COMMENT ON COLUMN public.survey_responses.q3_themes IS 'Q3: Which insight themes most valuable? (Multi-select, max 3)';
COMMENT ON COLUMN public.survey_responses.q4_missing_info IS 'Q4: What additional information would help? (Checkboxes with Other)';
COMMENT ON COLUMN public.survey_responses.q5_barriers IS 'Q5: What barriers prevent action? (Conditional, shown if Q2 neutral or below)';
COMMENT ON COLUMN public.survey_responses.q6_open_feedback IS 'Q6: Any other feedback? (Optional textarea)';

-- Keep old columns for backward compatibility
COMMENT ON COLUMN public.survey_responses.q1_useful IS 'Legacy: Did you find insights useful? (Yes/No)';
COMMENT ON COLUMN public.survey_responses.q2_intent IS 'Legacy: Do you plan to create content? (Yes/Maybe/No)';