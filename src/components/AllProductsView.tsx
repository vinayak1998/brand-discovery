import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAllProducts } from '@/hooks/useAllProducts';
import { getTheme } from '@/config/themes';

interface AllProductsViewProps {
  creatorUuid: string;
}

const AllProductsView = ({ creatorUuid }: AllProductsViewProps) => {
  const { products, loading, error, creatorNumericId } = useAllProducts(creatorUuid);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 md:gap-6">
        {[...Array(12)].map((_, i) => (
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
        <div className="text-6xl mb-4">📦</div>
        <h2 className="text-xl font-semibold mb-2">No Products Found</h2>
        <p className="text-muted-foreground">
          We couldn't find any product recommendations yet.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 md:gap-6">
      {products.map((product) => {
        const theme = product.theme_id ? getTheme(product.theme_id) : null;
        
        return (
          <Card 
            key={product.id} 
            className="p-3 sm:p-4 flex flex-col hover:shadow-lg transition-shadow cursor-pointer active:scale-[0.98]"
            onClick={() => {
              if (product.short_code) {
                const url = `https://www.wishlink.com/share/${product.short_code}?source=brand_discovery&creator=${creatorNumericId}`;
                window.open(url, '_blank');
              }
            }}
          >
            {/* Product Image */}
            <div className="w-full aspect-square mb-3 sm:mb-4 bg-muted rounded overflow-hidden relative">
              {product.thumbnail_url ? (
                <img
                  src={product.thumbnail_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const fallback = document.createElement('div');
                      fallback.className = 'w-full h-full flex items-center justify-center text-muted-foreground text-xs';
                      fallback.textContent = 'Image unavailable';
                      parent.appendChild(fallback);
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                  No Image
                </div>
              )}
              
              {/* Brand Logo Badge - Top Left */}
              {product.logo_url && (
                <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-background shadow-md overflow-hidden border">
                  <img
                    src={product.logo_url}
                    alt={product.brand}
                    className="w-full h-full object-contain p-0.5"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Theme Badge */}
            {theme && (
              <Badge 
                variant="secondary" 
                className="mb-2 text-xs w-fit"
                style={{ backgroundColor: `${theme.color}15`, color: theme.color }}
              >
                {theme.title.replace(' Brands', '').replace(' Products', '')}
              </Badge>
            )}

            {/* Product Name */}
            <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-1 sm:mb-2 line-clamp-2 flex-1">
              {product.name}
            </h3>

            {/* Brand Name */}
            <p className="text-xs text-muted-foreground mb-2">
              {product.brand}
            </p>

            {/* Price */}
            {product.price && (
              <p className="text-sm font-bold text-foreground mb-2">
                ₹{product.price.toLocaleString('en-IN')}
              </p>
            )}

            {/* Match Score */}
            <p className="text-xs text-muted-foreground">
              Match: {(product.sim_score * 100).toFixed(0)}%
            </p>
          </Card>
        );
      })}
    </div>
  );
};

export default AllProductsView;
