import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EngagementEvent {
  creator_id: number;
  event_type: 'page_view' | 'theme_view' | 'brand_click' | 'brand_website_click' | 'cta_click' | 'survey_start' | 'survey_submit' | 'session_start' | 'session_end';
  theme_id?: string;
  brand_id?: number;
  metadata?: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const events: EngagementEvent | EngagementEvent[] = body;

    // Handle both single event and batch events
    const eventsArray = Array.isArray(events) ? events : [events];

    console.log(`Tracking ${eventsArray.length} engagement event(s)`);

    // Validate and insert events
    const validEvents = eventsArray.map(event => ({
      creator_id: event.creator_id,
      event_type: event.event_type,
      theme_id: event.theme_id || null,
      brand_id: event.brand_id || null,
      metadata: event.metadata || {},
    }));

    const { data, error } = await supabase
      .from('creator_engagement_events')
      .insert(validEvents)
      .select();

    if (error) {
      console.error('Error inserting events:', error);
      throw error;
    }

    console.log(`Successfully tracked ${data.length} event(s)`);

    return new Response(
      JSON.stringify({ success: true, count: data.length }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in track-engagement:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});