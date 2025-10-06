import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Prefer secret; fallback to provided URL for now
const FALLBACK_URL =
  "https://redash.wishlink.one/api/queries/16254/results.csv?api_key=u9Re3MJHC4q7S4RNUtQyO2uXT6FRbN9wMIsFPphM";
const REDASH_URL = Deno.env.get("REDASH_BRANDS_URL") || FALLBACK_URL;

function parseCsv(text: string) {
  const rows: { brand_name: string; logo_url: string | null; website_url: string | null }[] = [];
  const lines = text.trim().split(/\r?\n/);
  if (lines.length <= 1) return rows;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const fields = line.match(/("[^"]*"|[^,]+)(?=\s*,|\s*$)/g) || [];
    const clean = fields.map((f) => f.replace(/^"|"$/g, "").trim());
    rows.push({
      brand_name: clean[0] ?? "",
      logo_url: clean[1] ? clean[1] : null,
      website_url: clean[2] ? clean[2] : null,
    });
  }
  return rows.filter((r) => r.brand_name);
}

async function fetchRedashBrands(): Promise<
  { brand_name: string; logo_url: string | null; website_url: string | null }[]
> {
  // 1) Try direct CSV URL first (works on some Redash versions)
  try {
    const res = await fetch(REDASH_URL, { method: "GET" });
    if (res.ok) {
      const ctype = res.headers.get("content-type") || "";
      const text = await res.text();
      if (ctype.includes("text/csv") || text.includes(",")) {
        console.log("Fetched CSV directly from provided URL");
        return parseCsv(text);
      }
    } else {
      console.warn("Direct CSV fetch not OK:", res.status, res.statusText);
    }
  } catch (e) {
    console.warn("Direct CSV fetch failed, will try JSON flow:", e);
  }

  // 2) Robust JSON flow using /queries/<id>/results -> /jobs -> /query_results/<id>.json
  const url = new URL(REDASH_URL);
  const origin = `${url.protocol}//${url.host}`;
  const idMatch = url.pathname.match(/\/queries\/(\d+)\//);
  const apiKeyMatch = url.search.match(/(?:\?|&)api_key=([^&]+)/);

  if (!idMatch || !apiKeyMatch) {
    throw new Error("Could not parse query id or api_key from REDASH_URL");
  }

  const queryId = idMatch[1];
  const apiKey = apiKeyMatch[1];

  // Kick off/return cached result
  const startRes = await fetch(
    `${origin}/api/queries/${queryId}/results?api_key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ max_age: 0 }),
    }
  );

  if (!startRes.ok) {
    const text = await startRes.text();
    throw new Error(`Redash POST results failed: ${startRes.status} ${text}`);
  }

  const startJson = await startRes.json();
  if (startJson.job) {
    // Poll job until success
    const jobId = startJson.job.id;
    const maxMs = 60_000; // 60s
    const interval = 2_000; // 2s
    let waited = 0;

    while (waited <= maxMs) {
      const jobRes = await fetch(`${origin}/api/jobs/${jobId}?api_key=${apiKey}`);
      if (!jobRes.ok) throw new Error(`Polling job failed: ${jobRes.statusText}`);
      const job = await jobRes.json();
      if (job.status === 3 && job.query_result_id) {
        // Success
        const qrRes = await fetch(
          `${origin}/api/query_results/${job.query_result_id}.json?api_key=${apiKey}`
        );
        if (!qrRes.ok) throw new Error(`Fetch query_result failed: ${qrRes.statusText}`);
        const qrJson = await qrRes.json();
        const rows = (qrJson?.query_result?.data?.rows || []) as any[];
        return rows.map((r) => ({
          brand_name: String(r.brand_name ?? ""),
          logo_url: r.logo_url ? String(r.logo_url) : null,
          website_url: r.website_url ? String(r.website_url) : null,
        })).filter((r) => r.brand_name);
      }
      if (job.status === 4 || job.status === 5) {
        throw new Error(`Redash job failed with status ${job.status}`);
      }
      await new Promise((r) => setTimeout(r, interval));
      waited += interval;
    }
    throw new Error("Redash job polling timed out");
  }

  // Some Redash return query_result directly
  const rows = (startJson?.query_result?.data?.rows || []) as any[];
  if (!rows.length) throw new Error("No rows returned from Redash");
  return rows
    .map((r) => ({
      brand_name: String(r.brand_name ?? ""),
      logo_url: r.logo_url ? String(r.logo_url) : null,
      website_url: r.website_url ? String(r.website_url) : null,
    }))
    .filter((r) => r.brand_name);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting Redash brands sync...");

    const brands = await fetchRedashBrands();
    console.log(`Parsed ${brands.length} brands from Redash`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from("brands")
      .upsert(brands, { onConflict: "brand_name", ignoreDuplicates: false });

    if (error) {
      console.error("Error upserting brands:", error);
      throw error;
    }

    console.log("Successfully synced brands");
    return new Response(
      JSON.stringify({ success: true, synced: brands.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in sync-redash-brands:", error);
    return new Response(
      JSON.stringify({ error: String(error?.message || error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
