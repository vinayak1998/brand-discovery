import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGATracking } from './useGATracking';

interface Product {
  id: number;
  name: string;
  brand: string;
  thumbnail_url: string | null;
  purchase_url: string | null;
  sim_score: number;
  short_code: string | null;
  price: number | null;
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

export const useBrandProducts = (creatorUuid: string | null, brandName: string | null, isReady: boolean) => {
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

          // Fetch total count and first page of products in parallel
          const productsPromise = supabase
            .from('creator_x_product_recommendations')
            .select('id, name, brand, thumbnail_url, purchase_url, sim_score, short_code, price')
            .eq('creator_id', fetchedCreatorData.creator_id)
            .eq('brand_id', fetchedBrandData.brand_id)
            .order('sim_score', { ascending: false })
            .range(0, PAGE_SIZE - 1);

          const countPromise = supabase
            .from('creator_x_product_recommendations')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', fetchedCreatorData.creator_id)
            .eq('brand_id', fetchedBrandData.brand_id);

          const [productsResult, countResult] = await Promise.all([productsPromise, countPromise]);

          const { data, error: productsError } = productsResult;

          if (productsError) {
            console.error('Error fetching products:', productsError);
            trackError({
              action: 'api_error',
              error_message: productsError.message,
              error_context: 'brand_products_fetch_failed'
            });
            throw productsError;
          }

          if (countResult.count !== null) {
            setTotalCount(countResult.count);
          }

          setProducts(data || []);
          setHasMore((data || []).length === PAGE_SIZE);
        } else {
          // Pagination - only fetch more products
          if (!creatorData || !brandData) return;

          const { data, error: productsError } = await supabase
            .from('creator_x_product_recommendations')
            .select('id, name, brand, thumbnail_url, purchase_url, sim_score, short_code, price')
            .eq('creator_id', creatorData.creator_id)
            .eq('brand_id', brandData.brand_id)
            .order('sim_score', { ascending: false })
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

          if (productsError) {
            console.error('Error fetching more products:', productsError);
            trackError({
              action: 'api_error',
              error_message: productsError.message,
              error_context: 'brand_products_pagination_failed'
            });
            throw productsError;
          }

          setProducts(prev => [...prev, ...(data || [])]);
          setHasMore((data || []).length === PAGE_SIZE);
        }

        setError(null);
      } catch (err) {
        console.error('Error in useBrandProducts:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        trackError({
          action: 'load_error',
          error_message: err instanceof Error ? err.message : 'Unknown error',
          error_context: 'brand_products_error'
        });
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
