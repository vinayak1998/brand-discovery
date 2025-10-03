import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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

    const { creator_id, theme_id } = await req.json();

    console.log('Fetching insights for creator:', creator_id, 'theme:', theme_id);

    if (!creator_id) {
      return new Response(
        JSON.stringify({ error: 'creator_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build query for insights with joins
    let query = supabase
      .from('creator_brand_insights')
      .select(`
        id,
        theme_id,
        metric,
        value,
        brands (
          id,
          brand_name,
          logo_url
        )
      `)
      .eq('creator_id', creator_id);

    // Filter by theme if provided
    if (theme_id) {
      query = query.eq('theme_id', theme_id);
    }

    const { data: insights, error } = await query;

    if (error) {
      console.error('Error fetching insights:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully fetched insights:', insights?.length || 0);

    return new Response(
      JSON.stringify({ insights: insights || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-creator-insights function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
