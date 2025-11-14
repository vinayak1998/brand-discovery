import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAllProducts } from '@/hooks/useAllProducts';
import { useGATracking } from '@/hooks/useGATracking';
import { useScrollTracking } from '@/hooks/useScrollTracking';
import { getTheme } from '@/config/themes';
import { Filter, X, ArrowUpDown } from 'lucide-react';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { CategoryFilterItem } from './CategoryFilterItem';

interface AllProductsViewProps {
  creatorUuid: string;
  shouldLoad?: boolean;
}

type SortOption = 'match' | 'reach-high' | 'sales-high' | 'link-shares' | 'price-low' | 'price-high';

const AllProductsView = ({ creatorUuid, shouldLoad = true }: AllProductsViewProps) => {
  const { products, loading, error, creatorNumericId, loadMore, hasMore, loadingMore, totalCount } = useAllProducts(creatorUuid, shouldLoad);
  const [selectedSubcategories, setSelectedSubcategories] = useState<Set<string>>(new Set());
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('match');
  const observerTarget = useRef<HTMLDivElement>(null);

  // GA4 tracking
  const {
    trackProductListView,
    trackFilterSortAction,
    trackProductInteraction,
    trackExternalRedirect,
  } = useGATracking(creatorNumericId);
  
  const { currentDepth } = useScrollTracking();

  // Infinite scroll observer
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target.isIntersecting && hasMore && !loadingMore) {
      loadMore();
    }
  }, [hasMore, loadingMore, loadMore]);

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const option = {
      root: null,
      rootMargin: '400px', // Start loading 400px before the bottom
      threshold: 0,
    };

    const observer = new IntersectionObserver(handleObserver, option);
    observer.observe(element);

    return () => observer.disconnect();
  }, [handleObserver]);

  // Build hierarchical category structure and category-to-subcategories mapping
  // Only show filters if ALL products have cat AND sscat
  const { categoryHierarchy, categoryToSubcategories, showFilters } = useMemo(() => {
    // Check if all products have both cat and sscat
    const allHaveCategoryAndSubcategory = products.every(
      product => product.cat && product.sscat
    );
    
    if (!allHaveCategoryAndSubcategory) {
      return { 
        categoryHierarchy: new Map<string, string[]>(), 
        categoryToSubcategories: new Map<string, string[]>(),
        showFilters: false 
      };
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
    const catToSubcats = new Map<string, string[]>();
    
    Array.from(hierarchy.keys()).sort().forEach(cat => {
      const subcats = Array.from(hierarchy.get(cat)!).sort();
      sortedHierarchy.set(cat, subcats);
      catToSubcats.set(cat, subcats);
    });
    
    return {
      categoryHierarchy: sortedHierarchy,
      categoryToSubcategories: catToSubcats,
      showFilters: true,
    };
  }, [products]);

  // Get unique brands sorted alphabetically
  const brandList = useMemo(() => {
    const brands = new Set<string>();
    products.forEach(product => {
      if (product.brand_name) {
        brands.add(product.brand_name);
      }
    });
    return Array.from(brands).sort();
  }, [products]);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    // First, filter
    let result = products.filter(product => {
      const matchesCategory = selectedSubcategories.size === 0 || 
                             (product.sscat && selectedSubcategories.has(product.sscat));
      const matchesBrand = selectedBrands.size === 0 || 
                          (product.brand_name && selectedBrands.has(product.brand_name));
      return matchesCategory && matchesBrand;
    });
    
    // Then, sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'match':
          return (b.sim_score || 0) - (a.sim_score || 0);
        
        case 'reach-high':
          return (b.median_reach || 0) - (a.median_reach || 0);
        
        case 'sales-high':
          return (b.median_sales || 0) - (a.median_sales || 0);
        
        case 'link-shares':
          return (b.count_90_days || 0) - (a.count_90_days || 0);
        
        case 'price-low':
          if (!a.price) return 1;
          if (!b.price) return -1;
          return a.price - b.price;
        
        case 'price-high':
          if (!a.price) return 1;
          if (!b.price) return -1;
          return b.price - a.price;
        
        default:
          return 0;
      }
    });
    
    return result;
  }, [products, selectedSubcategories, selectedBrands, sortBy]);

  const hasActiveFilters = selectedSubcategories.size > 0 || selectedBrands.size > 0;

  const clearFilters = () => {
    setSelectedSubcategories(new Set());
    setSelectedBrands(new Set());
    // Track filter clear
    trackFilterSortAction({
      action: 'filter_clear',
    });
  };

  // Handle category click - toggle all subcategories
  const handleCategoryClick = (category: string) => {
    const subcats = categoryToSubcategories.get(category) || [];
    const allSelected = subcats.every(sc => selectedSubcategories.has(sc));
    
    const newSelection = new Set(selectedSubcategories);
    
    if (allSelected) {
      // Deselect all subcategories of this category
      subcats.forEach(sc => newSelection.delete(sc));
    } else {
      // Select all subcategories of this category
      subcats.forEach(sc => newSelection.add(sc));
    }
    
    setSelectedSubcategories(newSelection);
    
    // Track filter application
    trackFilterSortAction({
      action: 'filter_apply',
      filter_type: 'category',
      filter_count: newSelection.size + selectedBrands.size,
      selected_categories: Array.from(newSelection),
      selected_brands: Array.from(selectedBrands),
    });
  };

  // Handle subcategory click - toggle individual subcategory
  const handleSubcategoryClick = (subcategory: string) => {
    const newSelection = new Set(selectedSubcategories);
    
    if (newSelection.has(subcategory)) {
      newSelection.delete(subcategory);
    } else {
      newSelection.add(subcategory);
    }
    
    setSelectedSubcategories(newSelection);
    
    // Track filter application
    trackFilterSortAction({
      action: 'filter_apply',
      filter_type: 'category',
      filter_count: newSelection.size + selectedBrands.size,
      selected_categories: Array.from(newSelection),
      selected_brands: Array.from(selectedBrands),
    });
  };

  // Handle brand click - toggle brand selection
  const handleBrandClick = (brand: string) => {
    const newSelection = new Set(selectedBrands);
    if (newSelection.has(brand)) {
      newSelection.delete(brand);
    } else {
      newSelection.add(brand);
    }
    setSelectedBrands(newSelection);
    
    // Track filter application
    trackFilterSortAction({
      action: 'filter_apply',
      filter_type: 'brand',
      filter_count: selectedSubcategories.size + newSelection.size,
      selected_categories: Array.from(selectedSubcategories),
      selected_brands: Array.from(newSelection),
    });
  };

  // Get active filter chips with smart grouping
  const getActiveFilterChips = () => {
    const chips: { label: string; subcategories: string[] }[] = [];
    
    categoryHierarchy.forEach((subcats, category) => {
      const selectedInCategory = subcats.filter(sc => selectedSubcategories.has(sc));
      
      if (selectedInCategory.length === 0) return;
      
      if (selectedInCategory.length === subcats.length) {
        // All subcategories selected - show just category name
        chips.push({
          label: category,
          subcategories: selectedInCategory
        });
      } else {
        // Partial selection - show individual subcategories
        selectedInCategory.forEach(sc => {
          chips.push({
            label: `${category} → ${sc}`,
            subcategories: [sc]
          });
        });
      }
    });
    
    return chips;
  };

  // Track product list view when data loads
  useEffect(() => {
    if (!loading && products.length >= 0) {
      const listContext = hasActiveFilters 
        ? 'filtered' 
        : products.length === 0 
          ? 'empty_state' 
          : 'product_tab';
      
      trackProductListView({
        list_context: listContext,
        visible_count: filteredAndSortedProducts.length,
        total_count: products.length,
        is_empty: filteredAndSortedProducts.length === 0,
        filter_count: selectedSubcategories.size + selectedBrands.size,
      });
    }
  }, [loading, products.length, filteredAndSortedProducts.length, hasActiveFilters, selectedSubcategories.size, selectedBrands.size, trackProductListView]);

  if (loading && products.length === 0) {
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
        <div className="space-y-4">
          {/* Row 1: Filter and Sort Controls - Connected with divider */}
          <div className="flex items-center border rounded-lg overflow-hidden bg-background shadow-sm">
            {/* Filters Section */}
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex-1 gap-2 rounded-none border-0 h-11 justify-start px-4"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                      {selectedSubcategories.size + selectedBrands.size}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 max-h-[500px] overflow-y-auto" align="start">
                <div className="space-y-4">
                  {/* Brand Filter Section */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Filter by Brand</label>
                    <div className="space-y-1 max-h-[150px] overflow-y-auto">
                      {brandList.map(brand => (
                        <Button
                          key={brand}
                          variant={selectedBrands.has(brand) ? "secondary" : "ghost"}
                          size="sm"
                          className="w-full justify-start text-xs"
                          onClick={() => handleBrandClick(brand)}
                        >
                          {brand}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Separator */}
                  <div className="border-t" />
                  
                  {/* Category Filter Section */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Filter by Category</label>
                    {Array.from(categoryHierarchy.keys()).map(category => (
                      <CategoryFilterItem
                        key={category}
                        category={category}
                        subcategories={categoryHierarchy.get(category) || []}
                        selectedSubcategories={selectedSubcategories}
                        onCategoryClick={handleCategoryClick}
                        onSubcategoryClick={handleSubcategoryClick}
                      />
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Vertical Divider */}
            <div className="w-px h-8 bg-border" />

            {/* Sort Section */}
            <Select value={sortBy} onValueChange={(value) => {
              const newSortBy = value as SortOption;
              setSortBy(newSortBy);
              // Track sort change
              trackFilterSortAction({
                action: 'sort_change',
                sort_by: newSortBy,
                filter_count: selectedSubcategories.size + selectedBrands.size,
              });
            }}>
              <SelectTrigger className="flex-1 border-0 rounded-none h-11 gap-2">
                <ArrowUpDown className="h-4 w-4" />
                <span className="text-sm">Sort</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="match">Best Match</SelectItem>
                <SelectItem value="reach-high">Highest Reach</SelectItem>
                <SelectItem value="sales-high">Highest Sales</SelectItem>
                <SelectItem value="link-shares">Link Shares</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Active Filters Display - Wraps both horizontally and vertically */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap px-1">
          {/* Brand Filter Chips */}
          {Array.from(selectedBrands).map(brand => (
            <Badge 
              key={`brand-${brand}`}
              variant="secondary" 
              className="gap-1.5 pr-1 pl-2.5 py-1"
            >
              <span className="text-xs">Brand: {brand}</span>
              <button
                onClick={() => {
                  const newSelection = new Set(selectedBrands);
                  newSelection.delete(brand);
                  setSelectedBrands(newSelection);
                }}
                className="hover:bg-secondary-foreground/20 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          
          {/* Category Filter Chips */}
          {getActiveFilterChips().map((chip, idx) => (
            <Badge 
              key={idx}
              variant="secondary" 
              className="gap-1.5 pr-1 pl-2.5 py-1"
            >
              <span className="text-xs">{chip.label}</span>
              <button
                onClick={() => {
                  const newSelection = new Set(selectedSubcategories);
                  chip.subcategories.forEach(sc => newSelection.delete(sc));
                  setSelectedSubcategories(newSelection);
                }}
                className="hover:bg-secondary-foreground/20 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          
          {/* Clear All as plain text - flows with chips */}
          <span 
            onClick={clearFilters}
            className="text-xs underline cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
          >
            clear all
          </span>
        </div>
      )}

      {/* Product Count - Right above product grid */}
      {showFilters && (
        <div className="px-1">
          <span className="text-sm text-muted-foreground">
            {hasActiveFilters 
              ? `${filteredAndSortedProducts.length} of ${totalCount} products`
              : `${totalCount} ${totalCount === 1 ? 'product' : 'products'}`
            }
          </span>
        </div>
      )}

      {/* Products Grid */}
      {filteredAndSortedProducts.length === 0 ? (
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
      {filteredAndSortedProducts.map((product) => {
        const theme = product.theme_id ? getTheme(product.theme_id) : null;
        
        return (
          <Card 
            key={product.id} 
            className="p-2 sm:p-3 flex flex-col hover:shadow-lg transition-shadow cursor-pointer active:scale-[0.98]"
            onClick={() => {
              if (product.short_code) {
                const url = `https://www.wishlink.com/share/${product.short_code}?source=product_discovery&creator=${creatorNumericId}`;
                
                // Track product interaction
                trackProductInteraction({
                  product_id: product.id,
                  product_name: product.name,
                  brand_id: product.brand_id || 0,
                  brand_name: product.brand_name || '',
                  theme_id: product.theme_id,
                  match_score: product.sim_score || 0,
                  price: product.price || undefined,
                  source_tab: 'product_discovery',
                  short_code: product.short_code,
                  scroll_depth_at_click: currentDepth,
                });
                
                // Track external redirect
                trackExternalRedirect({
                  destination: 'wishlink_product',
                  url,
                  product_id: product.id,
                  brand_id: product.brand_id || undefined,
                  brand_name: product.brand_name || undefined,
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
              
              {/* Brand Logo Badge with Tooltip - Top Left - Square */}
              {product.logo_url && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className="absolute top-2 left-2 w-8 h-8 rounded bg-background shadow-md overflow-hidden border z-10 cursor-help"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <img
                          src={product.logo_url}
                          alt={product.brand_name}
                          className="w-full h-full object-contain p-0.5"
                          loading="lazy"
                          width="32"
                          height="32"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{product.brand_name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Theme Badge - Overlaid on Bottom Right */}
              {theme && (
                <div className="absolute bottom-2 right-2 z-20">
                  <Badge 
                    variant="secondary" 
                    className="text-[10px] sm:text-xs px-2 py-0.5 bg-background/90 backdrop-blur-sm shadow-lg border"
                    style={{ borderColor: `${theme.color}40`, color: theme.color }}
                  >
                    {theme.id === 'top_trending' ? 'Trending' : 
                     theme.id === 'best_reach' ? 'High Reach' : 
                     theme.id === 'fastest_selling' ? 'Fast Selling' : 
                     theme.title.replace(' Brands', '').replace(' Products', '')}
                  </Badge>
                </div>
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
        );
      })}
    </div>
      )}

      {/* Loading More Indicator - Fixed height to prevent layout shift */}
      <div className="min-h-[80px] flex items-center justify-center">
        {loadingMore && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <p className="text-sm">Loading more...</p>
          </div>
        )}
      </div>

      {/* Infinite Scroll Observer Target - invisible trigger */}
      <div ref={observerTarget} className="h-px" />
    </div>
  );
};

export default AllProductsView;
