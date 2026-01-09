import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSavedProducts } from '@/hooks/useSavedProducts';
import { useWishlist } from '@/hooks/useWishlist';
import { useGATracking } from '@/hooks/useGATracking';
import { getTheme } from '@/config/themes';
import { Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ProductDetailDialog } from './ProductDetailDialog';

interface SavedProductsViewProps {
  creatorUuid: string;
  onProductClick?: () => void;
}

interface ProductForDialog {
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
}

const SavedProductsView = ({ creatorUuid, onProductClick }: SavedProductsViewProps) => {
  const { products, loading, error, creatorNumericId, refetch } = useSavedProducts(creatorUuid);
  const { isWishlisted, toggleWishlist } = useWishlist(creatorNumericId);
  const [selectedProduct, setSelectedProduct] = useState<ProductForDialog | null>(null);

  // GA4 tracking
  const {
    trackProductListView,
    trackProductInteraction,
    trackExternalRedirect,
    trackProductDialogView,
    trackLinkCopy,
    trackWishlistAction,
    trackContentIdeaClick,
    trackCheckProductClick,
  } = useGATracking(creatorNumericId);

  // Track saved products list view
  useEffect(() => {
    if (!loading && products.length >= 0) {
      trackProductListView({
        list_context: products.length === 0 ? 'empty_state' : 'product_tab',
        visible_count: products.length,
        total_count: products.length,
        is_empty: products.length === 0,
      });
    }
  }, [loading, products.length, trackProductListView]);

  const handleProductClick = (product: ProductForDialog) => {
    onProductClick?.();
    
    // Track product interaction
    trackProductInteraction({
      product_id: product.id,
      product_name: product.name,
      brand_id: product.brand_id || 0,
      brand_name: product.brand_name || '',
      theme_id: product.theme_id,
      match_score: product.sim_score || 0,
      price: product.price || undefined,
      source_tab: 'product_discovery', // Using existing type
      short_code: product.short_code || '',
      scroll_depth_at_click: 0,
    });
    
    setSelectedProduct(product);
  };

  const handleExternalRedirect = (product: ProductForDialog) => {
    if (product.short_code && creatorNumericId) {
      const wishlinkUrl = `https://www.wishlink.com/share/${product.short_code}?source=saved_products&creator=${creatorNumericId}`;
      
      trackExternalRedirect({
        destination: 'wishlink_product',
        url: wishlinkUrl,
        product_id: product.id,
        brand_id: product.brand_id || undefined,
        brand_name: product.brand_name,
        short_code: product.short_code,
      });
      
      window.open(wishlinkUrl, '_blank');
    }
  };

  const handleToggleWishlist = async (productId: number) => {
    await toggleWishlist(productId);
    // Refetch to update the list after removing an item
    refetch();
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 md:gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="p-3 sm:p-4">
            <Skeleton className="w-full aspect-square mb-3 sm:mb-4 rounded" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-9 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground">{error}</p>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="flex justify-center mb-4">
          <Heart className="w-16 h-16 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Saved Products Yet</h2>
        <p className="text-muted-foreground">
          Products you save will appear here. Tap on any product and click "Save for Later" to add it to your collection.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm text-center">
        {products.length} saved {products.length === 1 ? 'product' : 'products'}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 md:gap-6">
        {products.map((product) => {
          const theme = product.theme_id ? getTheme(product.theme_id) : null;
          const matchScore = Math.round(product.sim_score * 100);
          const showMatchScore = matchScore > 60;

          return (
            <Card
              key={product.id}
              className="overflow-hidden cursor-pointer group transition-all duration-200 hover:shadow-lg border active:scale-[0.98]"
              onClick={() => handleProductClick(product)}
            >
              <div className="relative">
                {/* Product Image */}
                <div className="relative aspect-square bg-muted overflow-hidden">
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
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No image
                    </div>
                  )}

                  {/* Brand Logo - Top Left */}
                  {product.brand_logo && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div 
                            className="absolute top-2 left-2 w-8 h-8 rounded bg-background/90 backdrop-blur-sm overflow-hidden shadow-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <img
                              src={product.brand_logo}
                              alt={product.brand_name || 'Brand'}
                              className="w-full h-full object-contain p-0.5"
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{product.brand_name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {/* Theme Badge - Bottom Right of Image */}
                  {theme && (
                    <Badge 
                      variant="secondary" 
                      className="absolute bottom-2 right-2 text-xs bg-background/80 backdrop-blur-sm"
                    >
                      {theme.id === 'top_trending' ? 'Trending' : 
                       theme.id === 'best_reach' ? 'High Reach' : 
                       theme.id === 'fastest_selling' ? 'Fast Selling' : 
                       theme.title}
                    </Badge>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-2 sm:p-3">
                  <h3 className="text-xs sm:text-sm font-medium line-clamp-2 mb-1 sm:mb-2">
                    {product.name}
                  </h3>

                  <div className="flex items-center justify-between">
                    {product.price && (
                      <span className="text-sm font-semibold">₹{product.price.toLocaleString()}</span>
                    )}
                    
                    {showMatchScore && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        {matchScore}% Match
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Product Detail Dialog */}
      <ProductDetailDialog
        product={selectedProduct}
        open={!!selectedProduct}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
        isWishlisted={selectedProduct ? isWishlisted(selectedProduct.id) : false}
        onToggleWishlist={() => {
          if (selectedProduct) {
            handleToggleWishlist(selectedProduct.id);
          }
        }}
        onExternalRedirect={() => {
          if (selectedProduct) {
            handleExternalRedirect(selectedProduct);
          }
        }}
        creatorId={creatorNumericId}
        onDialogOpen={() => {
          if (selectedProduct) {
            trackProductDialogView({
              product_id: selectedProduct.id,
              product_name: selectedProduct.name,
              brand_id: selectedProduct.brand_id || undefined,
              brand_name: selectedProduct.brand_name,
              source_tab: 'saved_products',
              page: '/insights/saved',
              screen: 'saved_products',
            });
          }
        }}
        onLinkCopy={() => {
          if (selectedProduct) {
            trackLinkCopy({
              product_id: selectedProduct.id,
              product_name: selectedProduct.name,
              brand_name: selectedProduct.brand_name,
              source_tab: 'saved_products',
              page: '/insights/saved',
              screen: 'saved_products',
            });
          }
        }}
        onWishlistAction={(action) => {
          if (selectedProduct) {
            trackWishlistAction({
              action: action === 'add' ? 'wishlist_add' : 'wishlist_remove',
              product_id: selectedProduct.id,
              product_name: selectedProduct.name,
              brand_name: selectedProduct.brand_name,
              source_tab: 'saved_products',
              page: '/insights/saved',
              screen: 'saved_products',
            });
          }
        }}
        onContentIdeaClick={(url, position) => {
          if (selectedProduct) {
            trackContentIdeaClick({
              product_id: selectedProduct.id,
              product_name: selectedProduct.name,
              reel_url: url,
              reel_position: position,
              page: '/insights/saved',
              screen: 'saved_products',
            });
          }
        }}
        onCheckProductClick={() => {
          if (selectedProduct) {
            trackCheckProductClick({
              product_id: selectedProduct.id,
              product_name: selectedProduct.name,
              brand_name: selectedProduct.brand_name,
              source_tab: 'saved_products',
              page: '/insights/saved',
              screen: 'saved_products',
            });
          }
        }}
      />
    </div>
  );
};

export default SavedProductsView;
