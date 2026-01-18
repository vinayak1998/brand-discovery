import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGATracking } from './useGATracking';
import { useCreatorData } from './useCreatorData';

export type SortOption = 'default' | 'match' | 'reach-high' | 'sales-high' | 'link-shares' | 'price-low' | 'price-high';

// Shuffle products within 5% match score buckets (only for default sorting)
const shuffleWithinBuckets = (products: ProductWithBrand[]): ProductWithBrand[] => {
  if (products.length === 0) return products;
  
  // Group by 5% buckets (sim_score is 0-1, so bucket = floor(score * 20))
  const buckets: Map<number, ProductWithBrand[]> = new Map();
  
  products.forEach(product => {
    const bucketKey = Math.floor(product.sim_score * 20);
    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, []);
    }
    buckets.get(bucketKey)!.push(product);
  });
  
  // Fisher-Yates shuffle
  const shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
  
  // Sort bucket keys descending (highest scores first) and flatten
  const sortedBucketKeys = [...buckets.keys()].sort((a, b) => b - a);
  const shuffledProducts: ProductWithBrand[] = [];
  
  sortedBucketKeys.forEach(bucketKey => {
    shuffledProducts.push(...shuffleArray(buckets.get(bucketKey)!));
  });
  
  return shuffledProducts;
};

export interface FilterOptions {
  selectedSubcategories: Set<string>;
  selectedBrands: Set<string>;
  selectedPriceRanges: Set<string>;
  selectedTheme: string | null;
  sortBy: SortOption;
}

export interface PriceRange {
  key: string;
  label: string;
  min: number;
  max: number | null;
}

export const PRICE_RANGES: PriceRange[] = [
  { key: '0-500', label: '₹0 - ₹500', min: 0, max: 500 },
  { key: '500-1000', label: '₹500 - ₹1,000', min: 500, max: 1000 },
  { key: '1000-1500', label: '₹1,000 - ₹1,500', min: 1000, max: 1500 },
  { key: '1500-2000', label: '₹1,500 - ₹2,000', min: 1500, max: 2000 },
  { key: '2000+', label: '₹2,000+', min: 2000, max: null },
];

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
  content_themes: string[] | null;
  median_reach: number | null;
  median_sales: number | null;
  count_90_days: number | null;
  top_3_posts_by_views?: unknown;
}

export const useAllProducts = (
  creatorUuid: string | null, 
  shouldLoad: boolean = true,
  filterOptions: FilterOptions = {
    selectedSubcategories: new Set(),
    selectedBrands: new Set(),
    selectedPriceRanges: new Set(),
    selectedTheme: null,
    sortBy: 'default'
  }
) => {
  const [products, setProducts] = useState<ProductWithBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const { trackError } = useGATracking();
  
  const PAGE_SIZE = 50;
  
  // Use shared creator data hook
  const { creatorData, loading: creatorLoading } = useCreatorData(creatorUuid);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(0);
    setProducts([]);
    setHasMore(true);
    setTotalCount(0);
  }, [
    Array.from(filterOptions.selectedSubcategories).join(','),
    Array.from(filterOptions.selectedBrands).join(','),
    Array.from(filterOptions.selectedPriceRanges).join(','),
    filterOptions.selectedTheme,
    filterOptions.sortBy
  ]);

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
        if (page === 0) {
          setLoading(true);
        }

        // Build query with filters
        let productsQuery = supabase
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
            content_themes,
            median_reach,
            median_sales,
            count_90_days,
            top_3_posts_by_views
          `)
          .eq('creator_id', creatorData.creator_id);

        // Apply category filter
        if (filterOptions.selectedSubcategories.size > 0) {
          productsQuery = productsQuery.in('sscat', Array.from(filterOptions.selectedSubcategories));
        }

        // Apply brand filter - need to map brand names to IDs
        if (filterOptions.selectedBrands.size > 0) {
          const { data: brandData } = await supabase
            .from('brands')
            .select('brand_id')
            .in('brand_name', Array.from(filterOptions.selectedBrands));
          
          const brandIds = brandData?.map(b => b.brand_id) || [];
          if (brandIds.length > 0) {
            productsQuery = productsQuery.in('brand_id', brandIds);
          }
        }

        // Apply price range filter
        if (filterOptions.selectedPriceRanges.size > 0) {
          const priceConditions = Array.from(filterOptions.selectedPriceRanges).map(rangeKey => {
            const range = PRICE_RANGES.find(r => r.key === rangeKey);
            if (!range) return null;
            if (range.max === null) {
              return `price.gte.${range.min}`;
            }
            return `and(price.gte.${range.min},price.lt.${range.max})`;
          }).filter(Boolean);
          
          if (priceConditions.length > 0) {
            productsQuery = productsQuery.or(priceConditions.join(','));
          }
        }

        // Apply theme filter (uses array contains)
        if (filterOptions.selectedTheme) {
          productsQuery = productsQuery.contains('content_themes', [filterOptions.selectedTheme]);
        }

        // Apply sorting
        switch (filterOptions.sortBy) {
          case 'default':
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

        // Apply pagination
        productsQuery = productsQuery.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        
        const productsPromise = productsQuery;

        // Fetch total count only on initial load (with same filters)
        const results = page === 0 
          ? await (async () => {
              let countQuery = supabase
                .from('creator_x_product_recommendations')
                .select('*', { count: 'exact', head: true })
                .eq('creator_id', creatorData.creator_id);

              if (filterOptions.selectedSubcategories.size > 0) {
                countQuery = countQuery.in('sscat', Array.from(filterOptions.selectedSubcategories));
              }

              if (filterOptions.selectedBrands.size > 0) {
                const { data: brandData } = await supabase
                  .from('brands')
                  .select('brand_id')
                  .in('brand_name', Array.from(filterOptions.selectedBrands));
                
                const brandIds = brandData?.map(b => b.brand_id) || [];
                if (brandIds.length > 0) {
                  countQuery = countQuery.in('brand_id', brandIds);
                }
              }

              // Apply price range filter for count
              if (filterOptions.selectedPriceRanges.size > 0) {
                const priceConditions = Array.from(filterOptions.selectedPriceRanges).map(rangeKey => {
                  const range = PRICE_RANGES.find(r => r.key === rangeKey);
                  if (!range) return null;
                  if (range.max === null) {
                    return `price.gte.${range.min}`;
                  }
                  return `and(price.gte.${range.min},price.lt.${range.max})`;
                }).filter(Boolean);
                
                if (priceConditions.length > 0) {
                  countQuery = countQuery.or(priceConditions.join(','));
                }
              }

              return await Promise.all([productsPromise, countQuery]);
            })()
          : [await productsPromise];
        const { data, error: productsError } = results[0];
        
        // Set total count on initial load
        if (page === 0 && results[1]) {
          const countResult = results[1];
          if (countResult.count !== null) {
            setTotalCount(countResult.count);
          }
        }

        if (productsError) {
          trackError({
            action: 'api_error',
            error_message: 'Failed to fetch products',
            error_context: `Table: creator_x_product_recommendations, Creator ID: ${creatorData.creator_id}, ${productsError.message}`,
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
        let productsWithBrandInfo: ProductWithBrand[] = data.map(product => ({
          ...product,
          brand_name: product.brand_id ? (brandNameMap.get(product.brand_id) || 'Unknown') : 'Unknown',
          logo_url: product.brand_id ? (brandLogoMap.get(product.brand_id) || null) : null,
          theme_id: product.brand_id ? (themeMap.get(product.brand_id) || null) : null,
        }));

        // Randomize within 5% match score buckets for default sorting only
        if (filterOptions.sortBy === 'default') {
          productsWithBrandInfo = shuffleWithinBuckets(productsWithBrandInfo);
        }

        // Check if there are more products to load
        setHasMore(data.length === PAGE_SIZE);
        
        // Append to existing products if loading more, otherwise replace
        setProducts(prev => page === 0 ? productsWithBrandInfo : [...prev, ...productsWithBrandInfo]);
        setLoading(false);
        setLoadingMore(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load products';
        trackError({
          action: 'load_error',
          error_message: errorMessage,
          error_context: `useAllProducts hook, Creator UUID: ${creatorUuid}, Page: ${page}, Filters: ${JSON.stringify({ categories: Array.from(filterOptions.selectedSubcategories), brands: Array.from(filterOptions.selectedBrands), sort: filterOptions.sortBy })}`,
        });
        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchAllProducts();
  }, [creatorUuid, creatorData, creatorLoading, shouldLoad, trackError, page, filterOptions.selectedSubcategories, filterOptions.selectedBrands, filterOptions.selectedPriceRanges, filterOptions.sortBy]);

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
    loadingMore,
    totalCount
  };
};
