import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SavedProduct {
  id: number;
  product_id: number | null;
  name: string;
  sim_score: number;
  thumbnail_url: string | null;
  price: number | null;
  short_code: string | null;
  purchase_url: string | null;
  brand_id: number | null;
  brand_name?: string;
  brand_logo?: string;
  theme_id?: string;
  cat?: string | null;
  sscat?: string | null;
  top_3_posts_by_views?: unknown;
}

interface UseSavedProductsReturn {
  products: SavedProduct[];
  loading: boolean;
  error: string | null;
  creatorNumericId: number | null;
  refetch: () => void;
}

export const useSavedProducts = (creatorUuid: string): UseSavedProductsReturn => {
  const [products, setProducts] = useState<SavedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatorNumericId, setCreatorNumericId] = useState<number | null>(null);

  const fetchSavedProducts = async () => {
    if (!creatorUuid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get creator's numeric ID
      const { data: creatorData, error: creatorError } = await supabase
        .from('creators')
        .select('creator_id')
        .eq('uuid', creatorUuid)
        .maybeSingle();

      if (creatorError) throw creatorError;
      if (!creatorData) {
        setLoading(false);
        return;
      }

      const creatorId = creatorData.creator_id;
      setCreatorNumericId(creatorId);

      // Get wishlisted product IDs
      const { data: wishlistData, error: wishlistError } = await supabase
        .from('creator_wishlisted_products')
        .select('product_id')
        .eq('creator_id', creatorId);

      if (wishlistError) throw wishlistError;
      if (!wishlistData || wishlistData.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const productIds = wishlistData.map(w => w.product_id);

      // Fetch full product details
      const { data: productsData, error: productsError } = await supabase
        .from('creator_x_product_recommendations')
        .select('*')
        .eq('creator_id', creatorId)
        .in('id', productIds);

      if (productsError) throw productsError;

      // Get brand info and theme mappings
      const brandIds = [...new Set(productsData?.map(p => p.brand_id).filter(Boolean))] as number[];
      
      let brandsMap: Record<number, { name: string; logo: string }> = {};
      if (brandIds.length > 0) {
        const { data: brandsData } = await supabase
          .from('brands')
          .select('brand_id, brand_name, logo_url')
          .in('brand_id', brandIds);
        
        brandsData?.forEach(b => {
          brandsMap[b.brand_id] = { name: b.brand_name, logo: b.logo_url || '' };
        });
      }

      // Get theme mappings for brands
      const { data: insightsData } = await supabase
        .from('creator_brand_insights')
        .select('brand_id, theme_id')
        .eq('creator_id', creatorId)
        .in('brand_id', brandIds);

      const brandThemeMap: Record<number, string> = {};
      const themePriority = ['top_trending', 'best_reach', 'fastest_selling'];
      
      insightsData?.forEach(insight => {
        const existingTheme = brandThemeMap[insight.brand_id];
        if (!existingTheme || themePriority.indexOf(insight.theme_id) < themePriority.indexOf(existingTheme)) {
          brandThemeMap[insight.brand_id] = insight.theme_id;
        }
      });

      // Map products with brand info
      const enrichedProducts: SavedProduct[] = (productsData || []).map(p => ({
        id: p.id,
        product_id: p.product_id,
        name: p.name,
        sim_score: p.sim_score,
        thumbnail_url: p.thumbnail_url,
        price: p.price,
        short_code: p.short_code,
        purchase_url: p.purchase_url,
        brand_id: p.brand_id,
        brand_name: p.brand_id ? brandsMap[p.brand_id]?.name : undefined,
        brand_logo: p.brand_id ? brandsMap[p.brand_id]?.logo : undefined,
        theme_id: p.brand_id ? brandThemeMap[p.brand_id] : undefined,
        cat: p.cat,
        sscat: p.sscat,
        top_3_posts_by_views: p.top_3_posts_by_views,
      }));

      setProducts(enrichedProducts);
    } catch (err) {
      console.error('Error fetching saved products:', err);
      setError('Failed to load saved products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedProducts();
  }, [creatorUuid]);

  return {
    products,
    loading,
    error,
    creatorNumericId,
    refetch: fetchSavedProducts,
  };
};
