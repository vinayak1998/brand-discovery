import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAllProducts } from '@/hooks/useAllProducts';
import { getTheme } from '@/config/themes';
import { Filter, X, ChevronRight } from 'lucide-react';
import { useState, useMemo } from 'react';

interface AllProductsViewProps {
  creatorUuid: string;
}

const AllProductsView = ({ creatorUuid }: AllProductsViewProps) => {
  const { products, loading, error, creatorNumericId } = useAllProducts(creatorUuid);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  // Build hierarchical category structure
  // Only show filters if ALL products have cat AND sscat
  const { categoryHierarchy, showFilters } = useMemo(() => {
    // Check if all products have both cat and sscat
    const allHaveCategoryAndSubcategory = products.every(
      product => product.cat && product.sscat
    );
    
    if (!allHaveCategoryAndSubcategory) {
      return { categoryHierarchy: new Map<string, string[]>(), showFilters: false };
    }
    
    const hierarchy = new Map<string, Set<string>>();
    
    products.forEach(product => {
      if (product.cat && product.sscat) {
        if (!hierarchy.has(product.cat)) {
          hierarchy.set(product.cat, new Set());
        }
        hierarchy.get(product.cat)!.add(product.sscat);
      }
    });
    
    // Convert to sorted arrays
    const sortedHierarchy = new Map<string, string[]>();
    Array.from(hierarchy.keys()).sort().forEach(cat => {
      sortedHierarchy.set(cat, Array.from(hierarchy.get(cat)!).sort());
    });
    
    return {
      categoryHierarchy: sortedHierarchy,
      showFilters: true,
    };
  }, [products]);

  // Filter products based on selections
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (selectedCategory && product.cat !== selectedCategory) return false;
      if (selectedSubcategory && product.sscat !== selectedSubcategory) return false;
      return true;
    });
  }, [products, selectedCategory, selectedSubcategory]);

  const hasActiveFilters = selectedCategory || selectedSubcategory;

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
  };

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
    <div className="space-y-4">
      {/* Filter Bar - Only show if all products have cat and sscat */}
      {showFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                    {(selectedCategory ? 1 : 0) + (selectedSubcategory ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 max-h-[500px] overflow-y-auto" align="start">
              <div className="space-y-2">
                <label className="text-sm font-medium mb-2 block">Filter by Category</label>
                {Array.from(categoryHierarchy.keys()).map(category => {
                  const subcategories = categoryHierarchy.get(category) || [];
                  const [isOpen, setIsOpen] = useState(false);
                  
                  return (
                    <Collapsible key={category} open={isOpen} onOpenChange={setIsOpen}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-6 h-6 p-0"
                            >
                              <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                            </Button>
                          </CollapsibleTrigger>
                          <Button
                            variant={selectedCategory === category && !selectedSubcategory ? "secondary" : "ghost"}
                            size="sm"
                            className="flex-1 justify-start text-left"
                            onClick={() => {
                              if (selectedCategory === category && !selectedSubcategory) {
                                setSelectedCategory(null);
                              } else {
                                setSelectedCategory(category);
                                setSelectedSubcategory(null);
                              }
                            }}
                          >
                            {category}
                          </Button>
                        </div>
                        
                        <CollapsibleContent className="ml-6 space-y-1">
                          {subcategories.map(subcategory => (
                            <Button
                              key={subcategory}
                              variant={selectedSubcategory === subcategory ? "secondary" : "ghost"}
                              size="sm"
                              className="w-full justify-start text-left text-xs"
                              onClick={() => {
                                setSelectedCategory(category);
                                setSelectedSubcategory(selectedSubcategory === subcategory ? null : subcategory);
                              }}
                            >
                              {subcategory}
                            </Button>
                          ))}
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
              <X className="h-4 w-4" />
              Clear filters
            </Button>
          )}

          <span className="text-sm text-muted-foreground ml-auto">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
          </span>
        </div>
      )}

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold mb-2">No Products Match Filters</h2>
          <p className="text-muted-foreground mb-4">
            Try adjusting your filter selections.
          </p>
          <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 md:gap-6">
      {filteredProducts.map((product) => {
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
              
              {/* Brand Logo Badge - Top Left - Square */}
              {product.logo_url && (
                <div className="absolute top-2 left-2 w-8 h-8 rounded bg-background shadow-md overflow-hidden border z-10">
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

              {/* Theme Badge - Overlaid on Bottom Right */}
              {theme && (
                <div className="absolute bottom-2 right-2 z-20">
                  <Badge 
                    variant="secondary" 
                    className="text-[10px] sm:text-xs px-2 py-0.5 bg-background/90 backdrop-blur-sm shadow-lg border"
                    style={{ borderColor: `${theme.color}40`, color: theme.color }}
                  >
                    {theme.title.replace(' Brands', '').replace(' Products', '')}
                  </Badge>
                </div>
              )}
            </div>

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

            {/* Match Score - Only show if > 60% */}
            {product.sim_score > 0.6 && (
              <p className="text-xs text-muted-foreground">
                Match: {(product.sim_score * 100).toFixed(0)}%
              </p>
            )}
          </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AllProductsView;
