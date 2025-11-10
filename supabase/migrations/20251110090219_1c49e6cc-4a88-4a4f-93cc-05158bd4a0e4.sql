-- Add display_name column to brands table
ALTER TABLE public.brands 
ADD COLUMN display_name text;