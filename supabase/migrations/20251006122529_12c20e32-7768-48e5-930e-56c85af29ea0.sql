-- Add unique constraint on creator name for proper upserts
ALTER TABLE creators ADD CONSTRAINT creators_name_unique UNIQUE (name);