-- Add brand_sourcing field to creators table
ALTER TABLE public.creators 
ADD COLUMN brand_sourcing BOOLEAN NOT NULL DEFAULT false;

-- Add index for faster lookups
CREATE INDEX idx_creators_brand_sourcing ON public.creators(brand_sourcing);