-- One-time trigger to run the Redash brand sync now
select net.http_post(
  url:='https://svdswlryhqmdzmilslyz.supabase.co/functions/v1/sync-redash-brands',
  headers:='{"Content-Type": "application/json"}'::jsonb
) as request_id;