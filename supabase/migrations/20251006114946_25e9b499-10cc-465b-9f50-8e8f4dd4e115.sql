-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Add unique constraint on brand_name for upserts
ALTER TABLE brands ADD CONSTRAINT brands_brand_name_unique UNIQUE (brand_name);

-- Schedule the sync-redash-brands function to run every 24 hours
SELECT cron.schedule(
  'sync-redash-brands-daily',
  '0 0 * * *', -- Run at midnight every day
  $$
  SELECT
    net.http_post(
        url:='https://svdswlryhqmdzmilslyz.supabase.co/functions/v1/sync-redash-brands',
        headers:='{"Content-Type": "application/json"}'::jsonb
    ) as request_id;
  $$
);