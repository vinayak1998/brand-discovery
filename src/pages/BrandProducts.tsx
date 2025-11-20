import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useCreatorContext } from '@/contexts/CreatorContext';
import { useCreatorData } from '@/hooks/useCreatorData';
import { useGATracking } from '@/hooks/useGATracking';
import { useScrollTracking } from '@/hooks/useScrollTracking';
import { useBrandProducts, type SortOption } from '@/hooks/useBrandProducts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ExternalLink, ArrowUpDown, Play } from 'lucide-react';
import { ReelsDialog } from '@/components/ReelsDialog';

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

const BrandProducts = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { creatorUuid: creatorId, isReady } = useCreatorContext();
  const { creatorData } = useCreatorData(creatorId);
  const brandName = searchParams.get('brand_name');
  const observerTarget = useRef<HTMLDivElement>(null);
  const [sortBy, setSortBy] = useState<SortOption>('match');
  
  // Reels dialog state
  const [selectedProductReels, setSelectedProductReels] = useState<string[] | null>(null);
  const [selectedProductName, setSelectedProductName] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<number>(0);
  const [isReelsDialogOpen, setIsReelsDialogOpen] = useState(false);
  
  const { 
    products, 
    loading, 
    error, 
    loadMore,
    hasMore,
    loadingMore,
    totalCount,
    brandData,
    creatorData: fetchedCreatorData
  } = useBrandProducts(creatorId, brandName, isReady, sortBy);

  // Derive display values from hook data
  const brandSourcingEnabled = fetchedCreatorData?.brand_sourcing ?? false;
  const sourcingLink = brandData?.sourcing_link || null;
  const brandId = brandData?.brand_id || null;
  const displayBrandName = brandData?.display_name || brandData?.brand_name || brandName || '';
  const creatorNumericId = fetchedCreatorData?.creator_id || null;
  const commissionDisplay = (brandData?.creator_commission && brandData.creator_commission > 0)
    ? `${brandData.creator_commission}% commission` 
    : null;

  // GA4 tracking
  const { 
    trackPageView, 
    trackProductListView, 
    trackProductInteraction, 
    trackExternalRedirect,
    trackConversionAction,
    trackBrandInteraction,
    trackCustomEvent,
  } = useGATracking(creatorData?.creator_id);
  
  const { currentDepth } = useScrollTracking();

  // Infinite scroll observer
  useEffect(() => {
    if (!observerTarget.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  // Track page view and product list view when data loads
  useEffect(() => {
    if (!loading && products.length >= 0 && brandId && displayBrandName) {
      // Track page view
      trackPageView({
        page_path: '/brand/products',
        page_title: `${displayBrandName} Products`,
        screen: 'brand_products',
      });

      // Track brand products view
      trackBrandInteraction({
        action: 'brand_products_view',
        brand_id: brandId,
        brand_name: displayBrandName,
        theme_id: '', // Not available on this page
        product_count: totalCount,
      });

      // Track product list view
      trackProductListView({
        list_context: totalCount === 0 ? 'empty_state' : 'brand_page',
        visible_count: products.length,
        total_count: totalCount,
        is_empty: totalCount === 0,
        brand_name: displayBrandName,
      });
    }
  }, [loading, products.length, brandId, displayBrandName, totalCount, trackPageView, trackBrandInteraction, trackProductListView]);

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b mb-6 pb-4">
            <Skeleton className="h-8 w-32 mb-2" />
            <h1 className="text-2xl font-bold mb-2">{brandName}</h1>
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 md:gap-6">
            {[...Array(12)].map((_, i) => (
              <Card key={i} className="p-3 sm:p-4">
                <Skeleton className="w-full aspect-square mb-3 sm:mb-4 rounded" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-9 w-full" />
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-7xl mx-auto px-6 py-8">
          <Card className="p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/insights/brands')}>
              Go Back
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Sticky Back Button & Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b mb-6 pb-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <Button
              variant="ghost"
              onClick={() => navigate('/insights/brands')}
              className="-ml-2"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Insights
            </Button>
            
            {brandSourcingEnabled && sourcingLink && (
              <Button
                onClick={() => {
                  // Track conversion action
                  trackConversionAction({
                    action: 'sourcing_click',
                    brand_id: brandId || undefined,
                    brand_name: displayBrandName,
                  });
                  // Track external redirect
                  trackExternalRedirect({
                    destination: 'brand_sourcing',
                    url: sourcingLink,
                    brand_id: brandId || undefined,
                    brand_name: displayBrandName,
                  });
                  window.open(sourcingLink, '_blank');
                }}
                variant="default"
                size="sm"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Source Products
              </Button>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {displayBrandName || brandName}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {totalCount} {totalCount === 1 ? 'product' : 'products'} curated for you
          </p>
          {commissionDisplay && (
            <p className="text-sm text-muted-foreground">
              {commissionDisplay}
            </p>
          )}
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-xl font-semibold mb-2">No Products Found</h2>
            <p className="text-muted-foreground">
              We couldn't find any product recommendations for this brand yet.
            </p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 md:gap-6">
              {products.map((product) => (
              <Card 
                key={product.id} 
                className="p-2 sm:p-3 flex flex-col hover:shadow-lg transition-shadow cursor-pointer active:scale-[0.98]"
                onClick={() => {
                  if (product.short_code) {
                    const url = `https://www.wishlink.com/share/${product.short_code}?source=brand_discovery&creator=${creatorNumericId}`;
                    
                    // Track product interaction
                    trackProductInteraction({
                      product_id: product.id,
                      product_name: product.name,
                      brand_id: brandId || 0,
                      brand_name: displayBrandName,
                      match_score: product.sim_score,
                      price: product.price || undefined,
                      source_tab: 'brand_discovery',
                      short_code: product.short_code,
                      scroll_depth_at_click: currentDepth,
                    });
                    
                    // Track external redirect
                    trackExternalRedirect({
                      destination: 'wishlink_product',
                      url,
                      product_id: product.id,
                      brand_id: brandId || undefined,
                      brand_name: displayBrandName,
                      short_code: product.short_code,
                    });
                    
                    window.open(url, '_blank');
                  }
                }}
              >
                {/* Product Image */}
                <div className="w-full aspect-square mb-2 sm:mb-3 bg-muted rounded overflow-hidden relative">
                  {product.thumbnail_url ? (
                    <img
                      src={product.thumbnail_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      width="320"
                      height="320"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      No Image
                    </div>
                  )}

                  {/* Play Button Overlay - Center */}
                  {product.top_3_posts_by_views && product.top_3_posts_by_views.length > 0 && (
                    <button
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/70 hover:bg-black/80 transition-all flex items-center justify-center z-20 hover:scale-110"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setSelectedProductReels(product.top_3_posts_by_views);
                        setSelectedProductName(product.name);
                        setSelectedProductId(product.id);
                        setIsReelsDialogOpen(true);
                        trackCustomEvent('reel_view_opened', {
                          product_id: product.id,
                          brand_id: brandId,
                          reel_count: product.top_3_posts_by_views?.length || 0,
                        });
                      }}
                      aria-label="Play reels"
                    >
                      <Play className="w-6 h-6 text-white fill-white" />
                    </button>
                  )}
                </div>

                {/* Product Name */}
                <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-1 line-clamp-2 flex-1">
                  {product.name}
                </h3>

                {/* Price */}
                {product.price && (
                  <p className="text-sm font-bold text-foreground mb-1">
                    ₹{product.price.toLocaleString('en-IN')}
                  </p>
                )}

                {/* Match Score - Only show if > 60% */}
                {product.sim_score > 0.6 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 self-end">
                    {(product.sim_score * 100).toFixed(0)}% Match
                  </Badge>
                )}
              </Card>
            ))}
            </div>

            {/* Loading indicator + observer target */}
            <div className="min-h-[80px] flex items-center justify-center mt-6">
              {loadingMore && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <p className="text-sm">Loading more...</p>
                </div>
              )}
            </div>
            <div ref={observerTarget} className="h-px" />
          </>
        )}
      </main>

      {/* Reels Dialog */}
      <ReelsDialog
        reelUrls={selectedProductReels || []}
        productName={selectedProductName}
        productId={selectedProductId}
        brandId={brandId}
        open={isReelsDialogOpen}
        onOpenChange={setIsReelsDialogOpen}
        creatorId={creatorNumericId}
      />
    </div>
  );
};

export default BrandProducts;
