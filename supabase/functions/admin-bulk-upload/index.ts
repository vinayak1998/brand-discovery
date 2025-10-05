import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InsightRow {
  creator_id: string;
  theme_id: string;
  brand_name: string;
  logo_url: string;
  metric: string;
  value: number;
}

interface LogoRow {
  brand_name: string;
  logo_url: string;
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

    if (csvType === 'insights') {
      stats = await processInsights(supabase, csvData);
    } else if (csvType === 'logos') {
      stats = await processLogos(supabase, csvData);
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid csvType. Must be "insights" or "logos"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Bulk upload complete:', stats);

    return new Response(
      JSON.stringify({ success: true, stats }),
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

async function processInsights(supabase: any, rows: InsightRow[]) {
  const stats = { created: 0, updated: 0, errors: 0 };
  const creatorIds = new Set<string>();
  const brandNames = new Set<string>();

  // Collect unique creator IDs and brand names
  rows.forEach(row => {
    creatorIds.add(row.creator_id);
    brandNames.add(row.brand_name);
  });

  // Upsert creators
  const creatorsToInsert = Array.from(creatorIds).map(id => ({ id }));
  const { error: creatorError } = await supabase
    .from('creators')
    .upsert(creatorsToInsert, { onConflict: 'id' });

  if (creatorError) {
    console.error('Error upserting creators:', creatorError);
    stats.errors += creatorIds.size;
  }

  // Upsert brands with logo URLs
  const brandsToInsert = Array.from(new Set(rows.map(r => r.brand_name))).map(brand_name => {
    const row = rows.find(r => r.brand_name === brand_name);
    return {
      brand_name,
      logo_url: row?.logo_url
    };
  });
  
  const { error: brandError } = await supabase
    .from('brands')
    .upsert(brandsToInsert, { onConflict: 'brand_name' });

  if (brandError) {
    console.error('Error upserting brands:', brandError);
    stats.errors += brandNames.size;
  }

  // Fetch brand IDs for mapping
  const { data: brands } = await supabase
    .from('brands')
    .select('id, brand_name')
    .in('brand_name', Array.from(brandNames));

  const brandMap = new Map(brands?.map(b => [b.brand_name, b.id]) || []);

  // Process insights with theme metadata
  for (const row of rows) {
    const brandId = brandMap.get(row.brand_name);
    
    if (!brandId) {
      console.error('Brand not found for:', row.brand_name);
      stats.errors++;
      continue;
    }

    const { error } = await supabase
      .from('creator_brand_insights')
      .upsert({
        creator_id: row.creator_id,
        brand_id: brandId,
        theme_id: row.theme_id,
        metric: row.metric,
        value: row.value
      }, { onConflict: 'creator_id,brand_id,theme_id,metric' });

    if (error) {
      console.error('Error upserting insight:', error);
      stats.errors++;
    } else {
      stats.created++;
    }
  }

  return stats;
}

async function processLogos(supabase: any, rows: LogoRow[]) {
  const stats = { created: 0, updated: 0, errors: 0 };

  for (const row of rows) {
    const { error } = await supabase
      .from('brands')
      .upsert({
        brand_name: row.brand_name,
        logo_url: row.logo_url
      }, { onConflict: 'brand_name' });

    if (error) {
      console.error('Error upserting brand logo:', error);
      stats.errors++;
    } else {
      stats.created++;
    }
  }

  return stats;
}
