import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InsightRow {
  creator_id: number;
  brand_id: number;
  theme_id: string;
  metric: string;
  value: number;
}

interface CreatorRow {
  creator_id: number;
  name: string;
}

interface BrandRow {
  brand_id: number;
  brand_name: string;
  logo_url?: string;
  website_url?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { csvType, csvData } = await req.json();

    console.log('Processing bulk upload, type:', csvType);

    if (!csvType || !csvData) {
      return new Response(
        JSON.stringify({ error: 'csvType and csvData are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let stats = { created: 0, updated: 0, errors: 0 };

    if (csvType === 'creators') {
      stats = await processCreators(supabase, csvData);
    } else if (csvType === 'brands') {
      stats = await processBrands(supabase, csvData);
    } else if (csvType === 'insights') {
      stats = await processInsights(supabase, csvData);
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid csvType. Must be "creators", "brands", or "insights"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Bulk upload complete:', stats);

    return new Response(
      JSON.stringify(stats),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-bulk-upload function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processCreators(supabase: any, rows: CreatorRow[]) {
  const stats = { created: 0, updated: 0, errors: 0 };

  for (const row of rows) {
    const { error } = await supabase
      .from('creators')
      .upsert({ 
        creator_id: row.creator_id,
        name: row.name 
      }, { onConflict: 'creator_id', ignoreDuplicates: false });

    if (error) {
      console.error('Error upserting creator:', error);
      stats.errors++;
    } else {
      stats.created++;
    }
  }

  return stats;
}

async function processBrands(supabase: any, rows: BrandRow[]) {
  const stats = { created: 0, updated: 0, errors: 0 };

  for (const row of rows) {
    const { error } = await supabase
      .from('brands')
      .upsert({
        brand_id: row.brand_id,
        brand_name: row.brand_name,
        logo_url: row.logo_url,
        website_url: row.website_url
      }, { onConflict: 'brand_id', ignoreDuplicates: false });

    if (error) {
      console.error('Error upserting brand:', error);
      stats.errors++;
    } else {
      stats.created++;
    }
  }

  return stats;
}

async function processInsights(supabase: any, rows: InsightRow[]) {
  const stats = { created: 0, updated: 0, errors: 0 };

  for (const row of rows) {
    const { error } = await supabase
      .from('creator_brand_insights')
      .upsert({
        creator_id: row.creator_id,
        brand_id: row.brand_id,
        theme_id: row.theme_id,
        metric: row.metric,
        value: row.value
      }, { onConflict: 'creator_id,brand_id,theme_id,metric', ignoreDuplicates: false });

    if (error) {
      console.error('Error upserting insight:', error);
      stats.errors++;
    } else {
      stats.created++;
    }
  }

  return stats;
}
