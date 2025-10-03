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

    const { creator_id, q1_useful, q2_intent, q3_themes } = await req.json();

    console.log('Submitting survey for creator:', creator_id);

    if (!creator_id) {
      return new Response(
        JSON.stringify({ error: 'creator_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify creator exists
    const { data: creator, error: creatorError } = await supabase
      .from('creators')
      .select('id')
      .eq('id', creator_id)
      .maybeSingle();

    if (creatorError) {
      console.error('Error checking creator:', creatorError);
      return new Response(
        JSON.stringify({ error: 'Error validating creator' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!creator) {
      return new Response(
        JSON.stringify({ error: 'Creator not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert survey response
    const { data: survey, error: surveyError } = await supabase
      .from('survey_responses')
      .insert({
        creator_id,
        q1_useful,
        q2_intent,
        q3_themes
      })
      .select()
      .single();

    if (surveyError) {
      console.error('Error inserting survey:', surveyError);
      return new Response(
        JSON.stringify({ error: surveyError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully submitted survey:', survey.id);

    return new Response(
      JSON.stringify({ success: true, survey }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in submit-survey function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
