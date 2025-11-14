import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGATracking } from './useGATracking';
import { useCreatorData } from './useCreatorData';

export interface ProductWithBrand {
  id: number;
  name: string;
  brand_name: string;
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
  count_90_days: number | null;
}

export const useAllProducts = (creatorUuid: string | null, shouldLoad: boolean = true) => {
  const [products, setProducts] = useState<ProductWithBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const { trackError } = useGATracking();
  
  const PAGE_SIZE = 50;
  
  // Use shared creator data hook
  const { creatorData, loading: creatorLoading } = useCreatorData(creatorUuid);

  useEffect(() => {
    const fetchAllProducts = async () => {
      // Only fetch if shouldLoad is true (for lazy tab loading)
      if (!shouldLoad) {
        setLoading(false);
        return;
      }
      
      // Wait for creator data
      if (creatorLoading || !creatorData) {
        return;
      }

      try {
        setLoading(true);

        // Fetch products for this creator - PARALLELIZED with brand/insight data below
        const productsPromise = supabase
          .from('creator_x_product_recommendations')
          .select(`
            id, 
            name, 
            brand_id,
            thumbnail_url, 
            purchase_url, 
            sim_score, 
            short_code, 
            price,
            cat,
            sscat,
            median_reach,
            median_sales,
            count_90_days
          `)
          .eq('creator_id', creatorData.creator_id)
          .order('sim_score', { ascending: false })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        const { data, error: productsError } = await productsPromise;

        if (productsError) {
          console.error('Error fetching products:', productsError);
          trackError({
            action: 'api_error',
            error_message: 'Failed to fetch products',
            error_context: productsError.message,
          });
          setError('Failed to fetch products');
          setLoading(false);
          return;
        }

        // Batch fetch brand logos and themes to avoid N+1 queries - PARALLELIZE
        const uniqueBrandIds = [...new Set(data.map(p => p.brand_id).filter(Boolean))] as number[];
        
        // Fetch brands and insights in parallel
        const [brandsResult, insightsResult] = await Promise.all([
          supabase
            .from('brands')
            .select('brand_id, logo_url, brand_name, display_name')
            .in('brand_id', uniqueBrandIds),
          supabase
            .from('creator_brand_insights')
            .select('brand_id, theme_id')
            .eq('creator_id', creatorData.creator_id)
            .in('brand_id', uniqueBrandIds)
        ]);
        
        const brandsData = brandsResult.data;
        const insightsData = insightsResult.data;

        // Theme priority: top_trending > best_reach > fastest_selling
        const themePriority: Record<string, number> = {
          'top_trending': 1,
          'best_reach': 2,
          'fastest_selling': 3,
        };

        // Create lookup maps for O(1) access
        const brandLogoMap = new Map(brandsData?.map(b => [b.brand_id, b.logo_url]) || []);
        const brandNameMap = new Map(brandsData?.map(b => [b.brand_id, b.display_name || b.brand_name]) || []);
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
          brand_name: product.brand_id ? (brandNameMap.get(product.brand_id) || 'Unknown') : 'Unknown',
          logo_url: product.brand_id ? (brandLogoMap.get(product.brand_id) || null) : null,
          theme_id: product.brand_id ? (themeMap.get(product.brand_id) || null) : null,
        }));

        // Check if there are more products to load
        setHasMore(data.length === PAGE_SIZE);
        
        // Append to existing products if loading more, otherwise replace
        setProducts(prev => page === 0 ? productsWithBrandInfo : [...prev, ...productsWithBrandInfo]);
        setLoading(false);
        setLoadingMore(false);
      } catch (err) {
        console.error('Error in useAllProducts:', err);
        trackError({
          action: 'load_error',
          error_message: err instanceof Error ? err.message : 'An unexpected error occurred',
          error_context: 'useAllProducts hook',
        });
        setError('An unexpected error occurred');
        setLoading(false);
      }
    };

    fetchAllProducts();
  }, [creatorUuid, creatorData, creatorLoading, shouldLoad, trackError, page]);

  const loadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      setPage(prev => prev + 1);
    }
  };

  return { 
    products, 
    loading: loading || creatorLoading, 
    error, 
    creatorNumericId: creatorData?.creator_id || null,
    loadMore,
    hasMore,
    loadingMore
  };
};
