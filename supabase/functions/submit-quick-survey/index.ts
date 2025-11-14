import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubmitSurveyRequest {
  creator_id: number;
  survey_id: string;
  context?: Record<string, any>;
  questions: Record<string, any>;
  time_to_complete_ms?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: SubmitSurveyRequest = await req.json();
    const { creator_id, survey_id, context = {}, questions, time_to_complete_ms } = body;

    if (!creator_id || !survey_id || !questions) {
      throw new Error('creator_id, survey_id, and questions are required');
    }

    // Insert survey response
    const { data: response, error: responseError } = await supabase
      .from('quick_survey_responses')
      .insert({
        creator_id,
        survey_id,
        context,
        questions,
        time_to_complete_ms,
      })
      .select()
      .single();

    if (responseError) throw responseError;

    // Update rate limit (upsert)
    const { error: rateLimitError } = await supabase
      .from('survey_rate_limits')
      .upsert(
        {
          creator_id,
          survey_id,
          last_shown_at: new Date().toISOString(),
        },
        { onConflict: 'creator_id,survey_id' }
      );

    if (rateLimitError) throw rateLimitError;

    console.log(`Survey ${survey_id} submitted for creator ${creator_id}`);

    return new Response(
      JSON.stringify({ success: true, response }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error submitting survey:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
