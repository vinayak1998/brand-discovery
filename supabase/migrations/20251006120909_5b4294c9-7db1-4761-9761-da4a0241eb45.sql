-- Remove the cron job for sync-redash-brands since we're removing that functionality
SELECT cron.unschedule('sync-redash-brands-daily');