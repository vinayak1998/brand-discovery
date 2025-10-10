import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      throw new Error('Admin access required');
    }

    const url = new URL(req.url);
    const dateFrom = url.searchParams.get('date_from') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const dateTo = url.searchParams.get('date_to') || new Date().toISOString();
    const creatorId = url.searchParams.get('creator_id');

    console.log(`Fetching analytics from ${dateFrom} to ${dateTo}`);

    // Build base query
    let eventsQuery = supabase
      .from('creator_engagement_events')
      .select('*')
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo);

    if (creatorId) {
      eventsQuery = eventsQuery.eq('creator_id', parseInt(creatorId));
    }

    const { data: events, error: eventsError } = await eventsQuery;

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      throw eventsError;
    }

    // Calculate aggregate metrics
    const metrics = {
      total_events: events.length,
      unique_creators: new Set(events.map(e => e.creator_id)).size,
      
      // Event type breakdown
      events_by_type: events.reduce((acc, e) => {
        acc[e.event_type] = (acc[e.event_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      
      // Theme engagement
      theme_engagement: events
        .filter(e => e.theme_id)
        .reduce((acc, e) => {
          acc[e.theme_id!] = (acc[e.theme_id!] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      
      // Brand clicks
      brand_clicks: events.filter(e => e.event_type === 'brand_click').length,
      brand_website_clicks: events.filter(e => e.event_type === 'brand_website_click').length,
      
      // Conversion metrics
      cta_clicks: events.filter(e => e.event_type === 'cta_click').length,
      survey_starts: events.filter(e => e.event_type === 'survey_start').length,
      survey_submits: events.filter(e => e.event_type === 'survey_submit').length,
      
      // Creator-level metrics
      creator_metrics: Object.values(
        events.reduce((acc, e) => {
          if (!acc[e.creator_id]) {
            acc[e.creator_id] = {
              creator_id: e.creator_id,
              page_views: 0,
              brand_clicks: 0,
              website_clicks: 0,
              cta_clicks: 0,
              survey_submitted: false,
              themes_viewed: new Set(),
              first_visit: e.created_at,
              last_visit: e.created_at,
            };
          }
          
          const creator = acc[e.creator_id];
          
          if (e.event_type === 'page_view') creator.page_views++;
          if (e.event_type === 'brand_click') creator.brand_clicks++;
          if (e.event_type === 'brand_website_click') creator.website_clicks++;
          if (e.event_type === 'cta_click') creator.cta_clicks++;
          if (e.event_type === 'survey_submit') creator.survey_submitted = true;
          if (e.theme_id) creator.themes_viewed.add(e.theme_id);
          
          if (new Date(e.created_at) < new Date(creator.first_visit)) {
            creator.first_visit = e.created_at;
          }
          if (new Date(e.created_at) > new Date(creator.last_visit)) {
            creator.last_visit = e.created_at;
          }
          
          return acc;
        }, {} as Record<number, any>)
      ).map(c => ({
        ...c,
        themes_viewed: Array.from(c.themes_viewed),
        total_engagement: c.page_views + c.brand_clicks + c.website_clicks + c.cta_clicks
      })),
      
      // Daily breakdown
      daily_breakdown: Object.entries(
        events.reduce((acc, e) => {
          const date = new Date(e.created_at).toISOString().split('T')[0];
          if (!acc[date]) {
            acc[date] = { date, events: 0, unique_creators: new Set() };
          }
          acc[date].events++;
          acc[date].unique_creators.add(e.creator_id);
          return acc;
        }, {} as Record<string, any>)
      ).map(([_, data]) => ({
        date: data.date,
        events: data.events,
        unique_creators: data.unique_creators.size
      })).sort((a, b) => a.date.localeCompare(b.date)),
    };

    // Fetch creator names for the creator metrics
    const creatorIds = [...new Set(events.map(e => e.creator_id))];
    const { data: creators } = await supabase
      .from('creators')
      .select('creator_id, name')
      .in('creator_id', creatorIds);

    const creatorMap = new Map(creators?.map(c => [c.creator_id, c.name]) || []);
    
    metrics.creator_metrics = metrics.creator_metrics.map(cm => ({
      ...cm,
      creator_name: creatorMap.get(cm.creator_id) || `Creator ${cm.creator_id}`
    }));

    // Fetch survey responses
    let surveyQuery = supabase
      .from('survey_responses')
      .select('creator_id, q1_value_rating, q2_actionability, q3_themes, q4_missing_info, q5_barriers, q6_open_feedback, submitted_at')
      .gte('submitted_at', dateFrom)
      .lte('submitted_at', dateTo);

    if (creatorId) {
      surveyQuery = surveyQuery.eq('creator_id', parseInt(creatorId));
    }

    const { data: surveyResponses } = await surveyQuery;

    const surveyResponsesWithNames = surveyResponses?.map(sr => ({
      ...sr,
      creator_name: creatorMap.get(sr.creator_id) || `Creator ${sr.creator_id}`
    })) || [];

    console.log(`Returning analytics for ${metrics.unique_creators} creators`);

    return new Response(
      JSON.stringify({
        ...metrics,
        survey_responses: surveyResponsesWithNames
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in get-analytics:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message === 'Unauthorized' || error.message === 'Admin access required' ? 403 : 400 
      }
    );
  }
});