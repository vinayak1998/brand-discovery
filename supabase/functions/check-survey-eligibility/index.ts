import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckEligibilityRequest {
  creator_id: number;
  survey_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { creator_id, survey_id }: CheckEligibilityRequest = await req.json();

    if (!creator_id || !survey_id) {
      throw new Error('creator_id and survey_id are required');
    }

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Check global rate limit (any survey in last 3 days)
    const { data: recentGlobal, error: globalError } = await supabase
      .from('survey_rate_limits')
      .select('last_shown_at')
      .eq('creator_id', creator_id)
      .gte('last_shown_at', threeDaysAgo.toISOString())
      .order('last_shown_at', { ascending: false })
      .limit(1);

    if (globalError) throw globalError;

    if (recentGlobal && recentGlobal.length > 0) {
      return new Response(
        JSON.stringify({ 
          eligible: false, 
          reason: 'global_rate_limit',
          next_eligible_at: new Date(new Date(recentGlobal[0].last_shown_at).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Check per-survey rate limit (this survey in last 14 days)
    const { data: recentSurvey, error: surveyError } = await supabase
      .from('survey_rate_limits')
      .select('last_shown_at')
      .eq('creator_id', creator_id)
      .eq('survey_id', survey_id)
      .gte('last_shown_at', fourteenDaysAgo.toISOString())
      .limit(1);

    if (surveyError) throw surveyError;

    if (recentSurvey && recentSurvey.length > 0) {
      return new Response(
        JSON.stringify({ 
          eligible: false, 
          reason: 'survey_rate_limit',
          next_eligible_at: new Date(new Date(recentSurvey[0].last_shown_at).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ eligible: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error checking survey eligibility:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
