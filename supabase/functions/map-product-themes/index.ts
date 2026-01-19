import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 14 Content Themes based on actual cat/sscat data
const CONTENT_THEMES = {
  festive_ethnic: { id: "festive_ethnic", label: "Festive & Ethnic", icon: "✨" },
  party_glam: { id: "party_glam", label: "Party & Glam", icon: "🎉" },
  workwear: { id: "workwear", label: "Office Ready", icon: "💼" },
  casual_everyday: { id: "casual_everyday", label: "Everyday Basics", icon: "👕" },
  loungewear: { id: "loungewear", label: "Cozy Lounge", icon: "🛋️" },
  summer_vibes: { id: "summer_vibes", label: "Summer Vibes", icon: "☀️" },
  winter_layers: { id: "winter_layers", label: "Winter Layers", icon: "❄️" },
  makeup_beauty: { id: "makeup_beauty", label: "Makeup Looks", icon: "💄" },
  skincare_routine: { id: "skincare_routine", label: "Skincare & Bath", icon: "🧴" },
  haircare: { id: "haircare", label: "Hair Goals", icon: "💇" },
  accessory_haul: { id: "accessory_haul", label: "Accessory Haul", icon: "👜" },
  shoe_closet: { id: "shoe_closet", label: "Shoe Closet", icon: "👠" },
  home_living: { id: "home_living", label: "Home & Living", icon: "🏠" },
  fragrance: { id: "fragrance", label: "Fragrance Finds", icon: "🌸" },
};

// Direct sscat to theme mappings (Tier 1 - highest priority)
const SSCAT_DIRECT_MAPPINGS: Record<string, string[]> = {
  "Makeup": ["makeup_beauty"],
  "Skin Care": ["skincare_routine"],
  "Bath and Body": ["skincare_routine"],
  "Hair": ["haircare"],
  "Fragrance": ["fragrance"],
  "Beauty Accessories": ["makeup_beauty"],
  "Appliances": ["skincare_routine"],
  "Wellness": ["skincare_routine"],
  "Health And Wellbeing": ["skincare_routine"],
  "Mom and Baby": ["skincare_routine"],
  "Loungewear and Nightwear": ["loungewear"],
  "Saree": ["festive_ethnic", "party_glam"],
  "Innerwear": ["casual_everyday"],
  "Jewellery": ["accessory_haul", "party_glam"],
  "Bags": ["accessory_haul"],
  "Eyewear": ["accessory_haul", "summer_vibes"],
  "Belts": ["accessory_haul"],
  "Scarves": ["accessory_haul", "winter_layers"],
  "Headwear": ["accessory_haul"],
  "Watches": ["accessory_haul"],
  "Socks": ["accessory_haul", "casual_everyday"],
  "Gloves": ["accessory_haul", "winter_layers"],
  "Wallets": ["accessory_haul"],
  "Ties": ["accessory_haul", "workwear"],
  "Baby Utilities": ["accessory_haul"],
  "Accessories": ["accessory_haul"],
  "Shoes": ["shoe_closet"],
  "Sandal": ["shoe_closet", "summer_vibes"],
  "Flip Flops": ["shoe_closet", "summer_vibes"],
  "Home Decor": ["home_living"],
  "Kitchen and Dining": ["home_living"],
  "Home Organisers": ["home_living"],
  "Furniture": ["home_living"],
  "Bedding": ["home_living", "loungewear"],
  "Home Furnishing": ["home_living"],
  "Bath": ["home_living"],
  "Kitchen Linen": ["home_living"],
  "Floor Covering": ["home_living"],
  "Toys and Games": ["home_living"],
  "Pet Accessories": ["home_living"],
  "Sports Nutrition": ["casual_everyday"],
  "Free Gifts": ["casual_everyday"],
};

// Keyword patterns for ambiguous categories (Tier 2)
const KEYWORD_THEMES: Record<string, RegExp[]> = {
  festive_ethnic: [
    /kurta/i, /kurti/i, /anarkali/i, /lehenga/i, /dupatta/i, /embroidered/i,
    /ethnic/i, /silk/i, /chanderi/i, /zari/i, /brocade/i, /bandhani/i,
    /block.?print/i, /phulkari/i, /salwar/i, /palazzo.*kurta/i, /sharara/i,
    /gharara/i, /nehru/i, /sherwani/i, /traditional/i, /festive/i,
  ],
  party_glam: [
    /sequin/i, /glitter/i, /bodycon/i, /off.?shoulder/i, /backless/i,
    /halter/i, /tube/i, /corset/i, /shimmer/i, /metallic/i, /satin/i,
    /velvet/i, /lace/i, /cocktail/i, /evening/i, /gown/i, /party/i,
    /clubwear/i, /glamour/i, /statement/i,
  ],
  workwear: [
    /formal/i, /blazer/i, /shirt/i, /collar/i, /trouser/i, /tailored/i,
    /office/i, /business/i, /professional/i, /button.?up/i, /pencil.?skirt/i,
    /slim.?fit/i, /straight.?fit/i, /corporate/i, /workwear/i,
  ],
  summer_vibes: [
    /cotton/i, /linen/i, /floral/i, /tiered/i, /maxi/i, /sundress/i,
    /sleeveless/i, /tank/i, /cami/i, /shorts/i, /beach/i, /resort/i,
    /tropical/i, /light.?weight/i, /breathable/i, /airy/i,
  ],
  winter_layers: [
    /sweater/i, /cardigan/i, /fleece/i, /jacket/i, /hoodie/i, /thermal/i,
    /knit/i, /wool/i, /coat/i, /puffer/i, /quilted/i, /warm/i,
    /layering/i, /pullover/i, /sweatshirt/i,
  ],
  loungewear: [
    /pyjama/i, /pajama/i, /sleep/i, /lounge/i, /nightwear/i, /comfort/i,
    /relaxed/i, /home.?wear/i, /cozy/i, /soft/i,
  ],
  casual_everyday: [
    /t.?shirt/i, /tee/i, /basic/i, /casual/i, /jeans/i, /denim/i,
    /everyday/i, /daily/i, /simple/i, /regular/i, /classic/i,
  ],
};

// Fallback mappings by category (Tier 3)
const CATEGORY_FALLBACKS: Record<string, string[]> = {
  "Apparel": ["casual_everyday"],
  "Personal Care": ["skincare_routine"],
  "Accessories": ["accessory_haul"],
  "Footwear": ["shoe_closet"],
  "Home": ["home_living"],
  "Sporting Goods": ["casual_everyday"],
  "Toys and Games": ["home_living"],
  "Pet Supplies": ["home_living"],
  "Gourmet": ["home_living"],
  "Free Items": ["casual_everyday"],
};

// Sscat-specific fallbacks for ambiguous apparel
const SSCAT_FALLBACKS: Record<string, string[]> = {
  "Topwear": ["casual_everyday"],
  "Bottomwear": ["casual_everyday"],
  "Dress": ["party_glam", "casual_everyday"],
  "Apparel Set": ["festive_ethnic", "casual_everyday"],
};

// Deterministic theme mapping function
function mapProductToThemes(name: string, cat: string | null, sscat: string | null): string[] {
  const themes = new Set<string>();
  
  // Tier 1: Direct sscat mapping
  if (sscat && SSCAT_DIRECT_MAPPINGS[sscat]) {
    SSCAT_DIRECT_MAPPINGS[sscat].forEach(t => themes.add(t));
  }
  
  // Tier 2: Keyword matching (for ambiguous sscats)
  const ambiguousSscats = ["Topwear", "Bottomwear", "Dress", "Apparel Set"];
  if (sscat && ambiguousSscats.includes(sscat) && name) {
    for (const [themeId, patterns] of Object.entries(KEYWORD_THEMES)) {
      for (const pattern of patterns) {
        if (pattern.test(name)) {
          themes.add(themeId);
          break;
        }
      }
    }
  }
  
  // Tier 3: Sscat-specific fallback
  if (themes.size === 0 && sscat && SSCAT_FALLBACKS[sscat]) {
    SSCAT_FALLBACKS[sscat].forEach(t => themes.add(t));
  }
  
  // Tier 4: Category fallback
  if (themes.size === 0 && cat && CATEGORY_FALLBACKS[cat]) {
    CATEGORY_FALLBACKS[cat].forEach(t => themes.add(t));
  }
  
  // Final fallback
  if (themes.size === 0) {
    themes.add("casual_everyday");
  }
  
  return Array.from(themes);
}

interface MappingProgress {
  status: "idle" | "processing" | "complete" | "error";
  phase: string;
  processedCount: number;
  totalCount: number;
  currentBatch: number;
  totalBatches: number;
  estimatedTimeRemaining?: string;
  error?: string;
  lastProcessedId?: number;
  hasMore?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const mode = body.mode || "unmapped_only";
    const batchSize = body.batch_size || 1000;
    const lastProcessedId = body.last_processed_id || null;

    console.log(`Theme mapping: mode=${mode}, batchSize=${batchSize}, lastId=${lastProcessedId}`);

    // Get total count
    let countQuery = supabase
      .from("creator_x_product_recommendations")
      .select("id", { count: "exact", head: true });

    if (mode === "unmapped_only") {
      countQuery = countQuery.is("content_themes", null);
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      throw new Error(`Count failed: ${countError.message}`);
    }

    if (totalCount === 0) {
      return new Response(
        JSON.stringify({
          status: "complete",
          phase: "No products to map",
          processedCount: 0,
          totalCount: 0,
          currentBatch: 0,
          totalBatches: 0,
          hasMore: false,
        } as MappingProgress),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch batch using cursor-based pagination
    let fetchQuery = supabase
      .from("creator_x_product_recommendations")
      .select("id, name, cat, sscat")
      .order("id", { ascending: true })
      .limit(batchSize);

    if (mode === "unmapped_only") {
      fetchQuery = fetchQuery.is("content_themes", null);
    }

    if (lastProcessedId) {
      fetchQuery = fetchQuery.gt("id", lastProcessedId);
    }

    const { data: products, error: fetchError } = await fetchQuery;

    if (fetchError) {
      throw new Error(`Fetch failed: ${fetchError.message}`);
    }

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({
          status: "complete",
          phase: "All products mapped",
          processedCount: 0,
          totalCount: totalCount || 0,
          currentBatch: 0,
          totalBatches: 0,
          hasMore: false,
        } as MappingProgress),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${products.length} products`);

    // Map products to themes
    const updates = products.map((p) => ({
      id: p.id,
      content_themes: mapProductToThemes(p.name || "", p.cat, p.sscat),
    }));

    // Use bulk update RPC
      const { data: updateCount, error: updateError } = await supabase.rpc(
        "bulk_update_content_themes",
        { updates: updates }
      );

    if (updateError) {
      throw new Error(`Bulk update failed: ${updateError.message}`);
    }

    console.log(`Updated ${updateCount} products`);

    const lastId = products[products.length - 1].id;
    const remainingCount = Math.max(0, (totalCount || 0) - products.length);
    const totalBatches = Math.ceil((totalCount || 0) / batchSize);
    const currentBatch = Math.ceil(((totalCount || 0) - remainingCount) / batchSize);

    const estimatedSeconds = (remainingCount / batchSize) * 2;
    const estimatedTime = estimatedSeconds > 60 
      ? `${Math.ceil(estimatedSeconds / 60)} minutes`
      : `${Math.ceil(estimatedSeconds)} seconds`;

    return new Response(
      JSON.stringify({
        status: remainingCount > 0 ? "processing" : "complete",
        phase: remainingCount > 0 ? `Processed ${products.length} products` : "Complete",
        processedCount: products.length,
        totalCount: totalCount || 0,
        currentBatch,
        totalBatches,
        estimatedTimeRemaining: remainingCount > 0 ? estimatedTime : undefined,
        lastProcessedId: lastId,
        hasMore: remainingCount > 0,
      } as MappingProgress),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Theme mapping error:", error);
    return new Response(
      JSON.stringify({
        status: "error",
        phase: "Error",
        processedCount: 0,
        totalCount: 0,
        currentBatch: 0,
        totalBatches: 0,
        error: error.message,
        hasMore: false,
      } as MappingProgress),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
