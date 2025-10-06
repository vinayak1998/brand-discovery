-- Trigger sync with user-provided URL now (manual override)
select net.http_post(
  url:='https://svdswlryhqmdzmilslyz.supabase.co/functions/v1/sync-redash-brands',
  headers:='{"Content-Type": "application/json"}'::jsonb,
  body:='{"url": "https://redash.wishlink.one/api/queries/16254/results.csv?api_key=hYj7Zs61jah0VbLVy0UtD7TUo55JCRa7H1g9p7Ty"}'::jsonb
) as request_id;