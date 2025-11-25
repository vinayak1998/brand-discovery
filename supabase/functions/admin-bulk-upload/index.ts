import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InsightRow {
  creator_id: number;
  brand_id: number;
  theme_id: string;
  value: number;
}

interface CreatorRow {
  creator_id: number;
  name: string;
  gender?: string;
  brand_sourcing?: boolean;
}

interface BrandRow {
  brand_id: number;
  brand_name: string;
  logo_url?: string;
  website_url?: string;
  sourcing_link?: string;
  display_name?: string;
  creator_commission?: number;
}

const BATCH_SIZE = 1000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { csvType, csvData, syncMode = 'upsert' } = await req.json();

    console.log('Processing bulk upload, type:', csvType, 'syncMode:', syncMode);

    if (!csvType || !csvData) {
      return new Response(
        JSON.stringify({ error: 'csvType and csvData are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let stats = { created: 0, updated: 0, errors: 0, deleted: 0 };

    if (csvType === 'creators') {
      stats = await processCreators(supabase, csvData);
    } else if (csvType === 'brands') {
      stats = await processBrands(supabase, csvData);
    } else if (csvType === 'insights') {
      stats = await processInsights(supabase, csvData, syncMode);
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

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE).map((r) => ({
      creator_id: r.creator_id,
      name: r.name,
      gender: r.gender,
      brand_sourcing: r.brand_sourcing ?? false,
    }));

    const { error } = await supabase
      .from('creators')
      .upsert(batch, { onConflict: 'creator_id', ignoreDuplicates: false });

    if (error) {
      console.error(`Error upserting creators batch (${i}-${i + batch.length - 1}):`, error);
      stats.errors += batch.length;
    } else {
      stats.created += batch.length;
    }
  }

  return stats;
}

async function processBrands(supabase: any, rows: BrandRow[]) {
  const stats = { created: 0, updated: 0, errors: 0 };

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE).map((r) => ({
      brand_id: r.brand_id,
      brand_name: r.brand_name,
      logo_url: r.logo_url,
      website_url: r.website_url,
      sourcing_link: r.sourcing_link,
      display_name: r.display_name,
      creator_commission: r.creator_commission,
    }));

    const { error } = await supabase
      .from('brands')
      .upsert(batch, { onConflict: 'brand_id', ignoreDuplicates: false });

    if (error) {
      console.error(`Error upserting brands batch (${i}-${i + batch.length - 1}):`, error);
      stats.errors += batch.length;
    } else {
      stats.created += batch.length;
    }
  }

  return stats;
}

async function processInsights(supabase: any, rows: InsightRow[], syncMode: string = 'upsert') {
  const stats = { created: 0, updated: 0, errors: 0, deleted: 0 };

  // If full_sync mode, delete old brand associations for each creator+theme combo first
  if (syncMode === 'full_sync') {
    // Extract unique creator_id + theme_id combinations
    const creatorThemePairs = new Map<string, { creator_id: number; theme_id: string }>();
    rows.forEach(row => {
      const key = `${row.creator_id}-${row.theme_id}`;
      creatorThemePairs.set(key, { creator_id: row.creator_id, theme_id: row.theme_id });
    });

    console.log(`Full sync mode: Deleting old insights for ${creatorThemePairs.size} creator+theme combinations`);

    // Delete old insights for each creator+theme combination
    for (const pair of creatorThemePairs.values()) {
      const { error, count } = await supabase
        .from('creator_brand_insights')
        .delete({ count: 'exact' })
        .eq('creator_id', pair.creator_id)
        .eq('theme_id', pair.theme_id);

      if (error) {
        console.error(`Error deleting old insights for creator ${pair.creator_id}, theme ${pair.theme_id}:`, error);
      } else {
        stats.deleted += count || 0;
      }
    }

    console.log(`Deleted ${stats.deleted} old insight(s)`);
  }

  // Insert new insights in batches
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE).map((r) => ({
      creator_id: r.creator_id,
      brand_id: r.brand_id,
      theme_id: r.theme_id,
      value: r.value,
    }));

    const { error } = await supabase
      .from('creator_brand_insights')
      .insert(batch);

    if (error) {
      console.error(`Error inserting insights batch (${i}-${i + batch.length - 1}):`, error);
      stats.errors += batch.length;
    } else {
      stats.created += batch.length;
    }
  }

  return stats;
}
