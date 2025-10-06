import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REDASH_API_URL = "https://redash.wishlink.one/api/queries/16254/results.csv?api_key=u9Re3MJHC4q7S4RNUtQyO2uXT6FRbN9wMIsFPphM";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting Redash brands sync...');

    // Fetch CSV from Redash
    const response = await fetch(REDASH_API_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch from Redash: ${response.statusText}`);
    }

    const csvText = await response.text();
    console.log('Fetched CSV data');

    // Parse CSV (skip header row)
    const lines = csvText.trim().split('\n');
    const brands = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple CSV parsing - handle quoted fields
      const fields = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
      const cleanFields = fields.map(f => f.replace(/^"|"$/g, '').trim());

      if (cleanFields.length >= 1) {
        brands.push({
          brand_name: cleanFields[0],
          logo_url: cleanFields[1] || null,
          website_url: cleanFields[2] || null,
        });
      }
    }

    console.log(`Parsed ${brands.length} brands`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Upsert brands
    const { data, error } = await supabase
      .from('brands')
      .upsert(brands, {
        onConflict: 'brand_name',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error('Error upserting brands:', error);
      throw error;
    }

    console.log('Successfully synced brands');

    return new Response(
      JSON.stringify({ 
        success: true, 
        synced: brands.length,
        message: 'Brands synced successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-redash-brands:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
