import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGATracking } from './useGATracking';

export type SortOption = 'match' | 'reach-high' | 'sales-high' | 'link-shares' | 'price-low' | 'price-high';

interface Product {
  id: number;
  name: string;
  brand: string;
  thumbnail_url: string | null;
  purchase_url: string | null;
  sim_score: number;
  short_code: string | null;
  price: number | null;
  top_3_posts_by_views: string[] | null;
}

interface BrandData {
  brand_id: number;
  brand_name: string;
  display_name: string | null;
  sourcing_link: string | null;
  creator_commission: number | null;
}

interface CreatorData {
  creator_id: number;
  name: string;
  brand_sourcing: boolean;
}

export const useBrandProducts = (
  creatorUuid: string | null, 
  brandName: string | null, 
  isReady: boolean,
  sortBy: SortOption = 'match'
) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [brandData, setBrandData] = useState<BrandData | null>(null);
  const [creatorData, setCreatorData] = useState<CreatorData | null>(null);
  const { trackError } = useGATracking();

  const PAGE_SIZE = 50;

  // Reset pagination when sort changes
  useEffect(() => {
    setPage(0);
    setProducts([]);
    setHasMore(true);
  }, [sortBy]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!isReady || !creatorUuid || !brandName) {
        if (isReady && (!creatorUuid || !brandName)) {
          setError('Missing creator ID or brand name');
          setLoading(false);
        }
        return;
      }

      try {
        if (page === 0) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        // On initial load, fetch creator and brand data first
        if (page === 0) {
          const { data: fetchedCreatorData, error: creatorError } = await supabase
            .from('creators')
            .select('creator_id, name, brand_sourcing')
            .eq('uuid', creatorUuid)
            .single();

          if (creatorError) throw creatorError;
          if (!fetchedCreatorData) throw new Error('Creator not found');

          setCreatorData(fetchedCreatorData);

          const { data: fetchedBrandData, error: brandError } = await supabase
            .from('brands')
            .select('sourcing_link, brand_id, brand_name, display_name, creator_commission')
            .eq('brand_name', brandName)
            .maybeSingle();

          if (!fetchedBrandData) {
            throw new Error('Brand not found');
          }

          setBrandData(fetchedBrandData);

          // Build query with sorting
          let productsQuery = supabase
            .from('creator_x_product_recommendations')
            .select('id, name, brand, thumbnail_url, purchase_url, sim_score, short_code, price, median_reach, median_sales, count_90_days, top_3_posts_by_views')
            .eq('creator_id', fetchedCreatorData.creator_id)
            .eq('brand_id', fetchedBrandData.brand_id);

          // Apply sorting
          switch (sortBy) {
            case 'match':
              productsQuery = productsQuery.order('sim_score', { ascending: false });
              break;
            case 'reach-high':
              productsQuery = productsQuery.order('median_reach', { ascending: false, nullsFirst: false });
              break;
            case 'sales-high':
              productsQuery = productsQuery.order('median_sales', { ascending: false, nullsFirst: false });
              break;
            case 'link-shares':
              productsQuery = productsQuery.order('count_90_days', { ascending: false });
              break;
            case 'price-low':
              productsQuery = productsQuery.order('price', { ascending: true, nullsFirst: false });
              break;
            case 'price-high':
              productsQuery = productsQuery.order('price', { ascending: false, nullsFirst: false });
              break;
          }

          productsQuery = productsQuery.range(0, PAGE_SIZE - 1);
          const productsPromise = productsQuery;

          const countPromise = supabase
            .from('creator_x_product_recommendations')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', fetchedCreatorData.creator_id)
            .eq('brand_id', fetchedBrandData.brand_id);

          const [productsResult, countResult] = await Promise.all([productsPromise, countPromise]);

          const { data, error: productsError } = productsResult;

          if (productsError) {
            trackError({
              action: 'api_error',
              error_message: 'Failed to fetch brand products',
              error_context: `Table: creator_x_product_recommendations, Brand: ${brandName}, Creator ID: ${fetchedCreatorData.creator_id}, ${productsError.message}`,
            });
            throw productsError;
          }

          if (countResult.count !== null) {
            setTotalCount(countResult.count);
          }

          setProducts((data || []).map(p => ({
            ...p,
            top_3_posts_by_views: (() => {
              const reels = p.top_3_posts_by_views;
              if (!reels) return null;
              
              if (typeof reels === 'string') {
                try {
                  const parsed = JSON.parse(reels);
                  return Array.isArray(parsed) ? parsed : null;
                } catch {
                  return null;
                }
              }
              
              if (Array.isArray(reels)) {
                return reels;
              }
              
              return null;
            })(),
          })));
          setHasMore((data || []).length === PAGE_SIZE);
        } else {
          // Load more products for existing creator/brand with same sorting
          let moreQuery = supabase
            .from('creator_x_product_recommendations')
            .select('id, name, brand, thumbnail_url, purchase_url, sim_score, short_code, price, median_reach, median_sales, count_90_days, top_3_posts_by_views')
            .eq('creator_id', creatorData.creator_id)
            .eq('brand_id', brandData.brand_id);

          // Apply same sorting
          switch (sortBy) {
            case 'match':
              moreQuery = moreQuery.order('sim_score', { ascending: false });
              break;
            case 'reach-high':
              moreQuery = moreQuery.order('median_reach', { ascending: false, nullsFirst: false });
              break;
            case 'sales-high':
              moreQuery = moreQuery.order('median_sales', { ascending: false, nullsFirst: false });
              break;
            case 'link-shares':
              moreQuery = moreQuery.order('count_90_days', { ascending: false });
              break;
            case 'price-low':
              moreQuery = moreQuery.order('price', { ascending: true, nullsFirst: false });
              break;
            case 'price-high':
              moreQuery = moreQuery.order('price', { ascending: false, nullsFirst: false });
              break;
          }

          moreQuery = moreQuery.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
          const { data, error: productsError } = await moreQuery;

          if (productsError) {
            trackError({
              action: 'api_error',
              error_message: 'Failed to fetch more brand products',
              error_context: `Pagination - Page: ${page}, Brand: ${brandName}, Creator UUID: ${creatorUuid}, ${productsError.message}`,
            });
            throw productsError;
          }

          setProducts(prev => [...prev, ...(data || []).map(p => ({
            ...p,
            top_3_posts_by_views: (() => {
              const reels = p.top_3_posts_by_views;
              if (!reels) return null;
              
              if (typeof reels === 'string') {
                try {
                  const parsed = JSON.parse(reels);
                  return Array.isArray(parsed) ? parsed : null;
                } catch {
                  return null;
                }
              }
              
              if (Array.isArray(reels)) {
                return reels;
              }
              
              return null;
            })(),
          }))]);
          setHasMore((data || []).length === PAGE_SIZE);
        }

        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        trackError({
          action: 'load_error',
          error_message: errorMessage,
          error_context: `useBrandProducts hook, Brand: ${brandName}, Creator UUID: ${creatorUuid}, Page: ${page}`,
        });
        setError(errorMessage);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

    fetchProducts();
  }, [creatorUuid, brandName, page, isReady, trackError]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  }, [loadingMore, hasMore, loading]);

  return {
    products,
    loading,
    error,
    loadMore,
    hasMore,
    loadingMore,
    totalCount,
    brandData,
    creatorData,
  };
};
