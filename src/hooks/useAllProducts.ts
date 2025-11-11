import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProductWithBrand {
  id: number;
  name: string;
  brand: string;
  brand_id: number | null;
  thumbnail_url: string | null;
  purchase_url: string | null;
  sim_score: number;
  short_code: string | null;
  price: number | null;
  cat: string | null;
  sscat: string | null;
  logo_url: string | null;
  theme_id: string | null;
  median_reach: number | null;
  median_sales: number | null;
}

export const useAllProducts = (creatorUuid: string | null) => {
  const [products, setProducts] = useState<ProductWithBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatorNumericId, setCreatorNumericId] = useState<number | null>(null);

  useEffect(() => {
    const fetchAllProducts = async () => {
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
          .single();

        if (creatorError) throw creatorError;
        if (!creatorData) throw new Error('Creator not found');
        
        setCreatorNumericId(creatorData.creator_id);

        // Fetch all products for this creator with brand info and theme
        const { data, error: productsError } = await supabase
          .from('creator_x_product_recommendations')
          .select(`
            id, 
            name, 
            brand, 
            brand_id,
            thumbnail_url, 
            purchase_url, 
            sim_score, 
            short_code, 
            price,
            cat,
            sscat,
            median_reach,
            median_sales
          `)
          .eq('creator_id', creatorData.creator_id)
          .order('sim_score', { ascending: false });

        if (productsError) throw productsError;

        // Batch fetch brand logos and themes to avoid N+1 queries
        const uniqueBrandIds = [...new Set(data.map(p => p.brand_id).filter(Boolean))] as number[];
        
        // Fetch all brand logos in one query
        const { data: brandsData } = await supabase
          .from('brands')
          .select('brand_id, logo_url')
          .in('brand_id', uniqueBrandIds);

        // Fetch all themes in one query
        const { data: insightsData } = await supabase
          .from('creator_brand_insights')
          .select('brand_id, theme_id')
          .eq('creator_id', creatorData.creator_id)
          .in('brand_id', uniqueBrandIds);

        // Theme priority: top_trending > best_reach > fastest_selling
        const themePriority: Record<string, number> = {
          'top_trending': 1,
          'best_reach': 2,
          'fastest_selling': 3,
        };

        // Create lookup maps for O(1) access
        const brandLogoMap = new Map(brandsData?.map(b => [b.brand_id, b.logo_url]) || []);
        const themeMap = new Map<number, string>();
        
        // Apply priority logic when multiple themes exist for a brand
        insightsData?.forEach(insight => {
          const currentTheme = themeMap.get(insight.brand_id);
          const currentPriority = currentTheme ? (themePriority[currentTheme] || 999) : 999;
          const newPriority = themePriority[insight.theme_id] || 999;
          
          // Only update if new theme has higher priority (lower number)
          if (newPriority < currentPriority) {
            themeMap.set(insight.brand_id, insight.theme_id);
          }
        });

        // Map data back to products
        const productsWithBrandInfo = data.map(product => ({
          ...product,
          logo_url: product.brand_id ? (brandLogoMap.get(product.brand_id) || null) : null,
          theme_id: product.brand_id ? (themeMap.get(product.brand_id) || null) : null,
        }));

        setProducts(productsWithBrandInfo);
      } catch (err) {
        console.error('Error fetching all products:', err);
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchAllProducts();
  }, [creatorUuid]);

  return { products, loading, error, creatorNumericId };
};
