import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 14 Content Themes based on actual cat/sscat data
const CONTENT_THEMES = {
  festive_ethnic: {
    id: "festive_ethnic",
    label: "Festive & Ethnic",
    icon: "✨",
  },
  party_glam: {
    id: "party_glam",
    label: "Party & Glam",
    icon: "🎉",
  },
  workwear: {
    id: "workwear",
    label: "Office Ready",
    icon: "💼",
  },
  casual_everyday: {
    id: "casual_everyday",
    label: "Everyday Basics",
    icon: "👕",
  },
  loungewear: {
    id: "loungewear",
    label: "Cozy Lounge",
    icon: "🛋️",
  },
  summer_vibes: {
    id: "summer_vibes",
    label: "Summer Vibes",
    icon: "☀️",
  },
  winter_layers: {
    id: "winter_layers",
    label: "Winter Layers",
    icon: "❄️",
  },
  makeup_beauty: {
    id: "makeup_beauty",
    label: "Makeup Looks",
    icon: "💄",
  },
  skincare_routine: {
    id: "skincare_routine",
    label: "Skincare & Bath",
    icon: "🧴",
  },
  haircare: {
    id: "haircare",
    label: "Hair Goals",
    icon: "💇",
  },
  accessory_haul: {
    id: "accessory_haul",
    label: "Accessory Haul",
    icon: "👜",
  },
  shoe_closet: {
    id: "shoe_closet",
    label: "Shoe Closet",
    icon: "👠",
  },
  home_living: {
    id: "home_living",
    label: "Home & Living",
    icon: "🏠",
  },
  fragrance: {
    id: "fragrance",
    label: "Fragrance Finds",
    icon: "🌸",
  },
};

// Direct sscat to theme mappings (Tier 1 - highest priority)
const SSCAT_DIRECT_MAPPINGS: Record<string, string[]> = {
  // Personal Care - Direct mappings
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
  
  // Apparel - Direct mappings
  "Loungewear and Nightwear": ["loungewear"],
  "Saree": ["festive_ethnic", "party_glam"],
  "Innerwear": ["casual_everyday"],
  
  // Accessories - Direct mappings
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
  
  // Footwear - Direct mappings
  "Shoes": ["shoe_closet"],
  "Sandal": ["shoe_closet", "summer_vibes"],
  "Flip Flops": ["shoe_closet", "summer_vibes"],
  
  // Home - Direct mappings
  "Home Decor": ["home_living"],
  "Kitchen and Dining": ["home_living"],
  "Home Organisers": ["home_living"],
  "Furniture": ["home_living"],
  "Bedding": ["home_living", "loungewear"],
  "Home Furnishing": ["home_living"],
  "Bath": ["home_living"],
  "Kitchen Linen": ["home_living"],
  "Floor Covering": ["home_living"],
  "Fragrance": ["home_living", "fragrance"],
  
  // Others
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

// Fallback mappings by category (Tier 3 - guaranteed coverage)
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
function mapProductToThemes(
  name: string,
  cat: string | null,
  sscat: string | null
): string[] {
  const themes = new Set<string>();
  
  // Tier 1: Direct sscat mapping
  if (sscat && SSCAT_DIRECT_MAPPINGS[sscat]) {
    SSCAT_DIRECT_MAPPINGS[sscat].forEach(t => themes.add(t));
  }
  
  // Tier 2: Keyword matching (for ambiguous sscats like Topwear, Bottomwear, Dress, Apparel Set)
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
  
  // Tier 3: Sscat-specific fallback for ambiguous apparel
  if (themes.size === 0 && sscat && SSCAT_FALLBACKS[sscat]) {
    SSCAT_FALLBACKS[sscat].forEach(t => themes.add(t));
  }
  
  // Tier 4: Category fallback (guaranteed coverage)
  if (themes.size === 0 && cat && CATEGORY_FALLBACKS[cat]) {
    CATEGORY_FALLBACKS[cat].forEach(t => themes.add(t));
  }
  
  // Final fallback: casual_everyday
  if (themes.size === 0) {
    themes.add("casual_everyday");
  }
  
  return Array.from(themes);
}

interface MappingRequest {
  mode: "unmapped_only" | "remap_all";
  useAI?: boolean;
  batchSize?: number;
}

interface MappingProgress {
  status: "idle" | "running" | "completed" | "error";
  phase: "deterministic" | "ai" | "none";
  totalProducts: number;
  mappedProducts: number;
  currentBatch: number;
  totalBatches: number;
  message: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const { mode = "unmapped_only", useAI = false, batchSize = 1000 }: MappingRequest = await req.json();

    console.log(`Starting theme mapping - Mode: ${mode}, Use AI: ${useAI}, Batch Size: ${batchSize}`);

    // Get total product count
    let countQuery = supabase
      .from("creator_x_product_recommendations")
      .select("*", { count: "exact", head: true });

    if (mode === "unmapped_only") {
      countQuery = countQuery.is("content_themes", null);
    }

    const { count: totalProducts, error: countError } = await countQuery;

    if (countError) {
      console.error("Count error:", countError);
      throw new Error(`Failed to count products: ${countError.message}`);
    }

    console.log(`Total products to process: ${totalProducts}`);

    if (!totalProducts || totalProducts === 0) {
      return new Response(
        JSON.stringify({
          status: "completed",
          phase: "none",
          totalProducts: 0,
          mappedProducts: 0,
          message: "No products to map",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const totalBatches = Math.ceil(totalProducts / batchSize);
    let mappedCount = 0;

    // Process in batches
    for (let batch = 0; batch < totalBatches; batch++) {
      console.log(`Processing batch ${batch + 1} of ${totalBatches}`);

      // Fetch batch of products
      let query = supabase
        .from("creator_x_product_recommendations")
        .select("id, name, cat, sscat")
        .range(batch * batchSize, (batch + 1) * batchSize - 1);

      if (mode === "unmapped_only") {
        query = query.is("content_themes", null);
      }

      const { data: products, error: fetchError } = await query;

      if (fetchError) {
        console.error(`Batch ${batch + 1} fetch error:`, fetchError);
        throw new Error(`Failed to fetch products: ${fetchError.message}`);
      }

      if (!products || products.length === 0) {
        console.log(`Batch ${batch + 1}: No products found, skipping`);
        continue;
      }

      // Map themes for each product
      const updates = products.map((product) => ({
        id: product.id,
        content_themes: mapProductToThemes(
          product.name || "",
          product.cat,
          product.sscat
        ),
      }));

      // Batch update using upsert
      // Process in smaller chunks for upsert (500 at a time)
      const upsertChunkSize = 500;
      for (let i = 0; i < updates.length; i += upsertChunkSize) {
        const chunk = updates.slice(i, i + upsertChunkSize);
        
        // Update each product individually (safer for large batches)
        for (const update of chunk) {
          const { error: updateError } = await supabase
            .from("creator_x_product_recommendations")
            .update({ content_themes: update.content_themes })
            .eq("id", update.id);

          if (updateError) {
            console.error(`Update error for product ${update.id}:`, updateError);
          }
        }
        
        mappedCount += chunk.length;
        console.log(`Mapped ${mappedCount} products so far...`);
      }

      // Small delay between batches to avoid overwhelming the database
      if (batch < totalBatches - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log(`Completed! Mapped ${mappedCount} products`);

    return new Response(
      JSON.stringify({
        status: "completed",
        phase: "deterministic",
        totalProducts,
        mappedProducts: mappedCount,
        message: `Successfully mapped ${mappedCount} products to themes`,
      } as MappingProgress),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Theme mapping error:", error);
    return new Response(
      JSON.stringify({
        status: "error",
        phase: "none",
        totalProducts: 0,
        mappedProducts: 0,
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
