import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { ExternalLink, Copy, Bookmark, BookmarkCheck, Check, Sparkles, TrendingUp, ShoppingBag, Zap } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getTheme } from '@/config/themes';
import { cn } from '@/lib/utils';

interface ProductWithBrand {
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
  top_3_posts_by_views?: unknown;
  // New fields for match reasons
  median_reach?: number | null;
  median_sales?: number | null;
  count_90_days?: number | null;
}

interface MatchReason {
  id: string;
  icon: React.ReactNode;
  message: string;
  priority: number;
}

interface ProductDetailDialogProps {
  product: ProductWithBrand | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  creatorId: number | null;
  onExternalRedirect?: () => void;
  // GA tracking callbacks
  onDialogOpen?: () => void;
  onLinkCopy?: () => void;
  onWishlistAction?: (action: 'add' | 'remove') => void;
  onContentIdeaClick?: (url: string, position: number) => void;
  onCheckProductClick?: () => void;
  onMatchReasonView?: (reasons: string[]) => void;
}

// Format large numbers (e.g., 43000 -> "43K")
const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${Math.round(num / 1000)}K`;
  return num.toString();
};

export const ProductDetailDialog = ({
  product,
  open,
  onOpenChange,
  isWishlisted,
  onToggleWishlist,
  creatorId,
  onExternalRedirect,
  onDialogOpen,
  onLinkCopy,
  onWishlistAction,
  onContentIdeaClick,
  onCheckProductClick,
  onMatchReasonView,
}: ProductDetailDialogProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Generate match reasons based on product data
  const matchReasons = useMemo(() => {
    if (!product) return [];
    
    const reasons: MatchReason[] = [];
    
    // Thresholds based on data analysis
    const REACH_THRESHOLD = 43000; // p75
    const SALES_THRESHOLD = 1400; // p90
    const TRENDING_THRESHOLD = 34; // p75
    
    // 1. Strong category fit (sim_score >= 0.75)
    if (product.sim_score >= 0.75) {
      const category = product.cat || 'your content';
      reasons.push({
        id: 'category_fit',
        icon: <Sparkles className="h-3.5 w-3.5 text-primary" />,
        message: `Strong match for ${category}`,
        priority: 1,
      });
    }
    
    // 2. Proven seller (median_sales >= threshold)
    if (product.median_sales && product.median_sales >= SALES_THRESHOLD) {
      reasons.push({
        id: 'proven_seller',
        icon: <ShoppingBag className="h-3.5 w-3.5 text-primary" />,
        message: 'Proven seller (top 10% in sales)',
        priority: 2,
      });
    }
    
    // 3. High reach potential (median_reach >= threshold)
    if (product.median_reach && product.median_reach >= REACH_THRESHOLD) {
      reasons.push({
        id: 'high_reach',
        icon: <TrendingUp className="h-3.5 w-3.5 text-primary" />,
        message: `High reach potential (${formatNumber(product.median_reach)} avg views)`,
        priority: 3,
      });
    }
    
    // 4. Trending among creators (count_90_days >= threshold)
    if (product.count_90_days && product.count_90_days >= TRENDING_THRESHOLD) {
      reasons.push({
        id: 'trending',
        icon: <Zap className="h-3.5 w-3.5 text-primary" />,
        message: `Trending - shared by ${product.count_90_days}+ creators`,
        priority: 4,
      });
    }
    
    // Sort by priority and return max 3
    return reasons.sort((a, b) => a.priority - b.priority).slice(0, 3);
  }, [product]);

  // Track dialog open and match reasons
  useEffect(() => {
    if (open && product) {
      onDialogOpen?.();
      
      // Track match reasons if any exist
      if (matchReasons.length > 0) {
        onMatchReasonView?.(matchReasons.map(r => r.id));
      }
    }
  }, [open, product, onDialogOpen, matchReasons, onMatchReasonView]);

  // Parse reel URLs from top_3_posts_by_views - must be before early return
  const reelUrls = useMemo(() => {
    if (!product?.top_3_posts_by_views) return [];
    try {
      const data = typeof product.top_3_posts_by_views === 'string' 
        ? JSON.parse(product.top_3_posts_by_views) 
        : product.top_3_posts_by_views;
      if (Array.isArray(data)) {
        return data.filter((url): url is string => typeof url === 'string' && url.length > 0);
      }
      return [];
    } catch {
      return [];
    }
  }, [product?.top_3_posts_by_views]);

  // Build media items array for carousel (product image first, then content videos)
  const mediaItems = useMemo(() => {
    const items: Array<{ type: 'image' | 'video' | 'youtube'; url: string }> = [];
    
    // First item is always the product thumbnail
    if (product?.thumbnail_url) {
      items.push({ type: 'image', url: product.thumbnail_url });
    }
    
    // Add content videos
    reelUrls.forEach(url => {
      if (url.includes('youtube.com/embed')) {
        items.push({ type: 'youtube', url });
      } else if (url.endsWith('.mp4') || url.includes('.mp4') || url.includes('gumlet.io') || url.includes('gcp-cdn')) {
        items.push({ type: 'video', url });
      }
    });
    
    return items;
  }, [product?.thumbnail_url, reelUrls]);

  // Track carousel slide changes
  useEffect(() => {
    if (!carouselApi) return;
    
    const onSelect = () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };
    
    carouselApi.on("select", onSelect);
    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);

  // Reset carousel to first slide when dialog opens
  useEffect(() => {
    if (open && carouselApi) {
      carouselApi.scrollTo(0);
      setCurrentSlide(0);
    }
  }, [open, carouselApi]);

  if (!product) return null;

  const matchScore = Math.round(product.sim_score * 100);
  const showMatchScore = matchScore > 60;
  const themeConfig = product.theme_id ? getTheme(product.theme_id) : null;

  const handleCheckProduct = () => {
    if (!product.short_code) {
      toast({
        title: "Link not available",
        description: "This product doesn't have a shareable link yet.",
        variant: "destructive",
      });
      return;
    }

    // Track CTA click first
    onCheckProductClick?.();

    const redirectUrl = `https://www.wishlink.com/share/${product.short_code}?source=product_discovery&creator=${creatorId}`;
    
    if (onExternalRedirect) {
      onExternalRedirect();
    }
    
    window.open(redirectUrl, '_blank');
    onOpenChange(false);
  };

  const handleCopyLink = async () => {
    if (!product.purchase_url) {
      toast({
        title: "Link not available",
        description: "This product doesn't have a purchase link.",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(product.purchase_url);
      setCopied(true);
      onLinkCopy?.();
      toast({
        title: "Link copied!",
        description: "Product link has been copied to clipboard.",
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveForLater = () => {
    onWishlistAction?.(isWishlisted ? 'remove' : 'add');
    onToggleWishlist();
    toast({
      title: isWishlisted ? "Removed from saved" : "Saved for later",
      description: isWishlisted 
        ? "Product removed from your saved items." 
        : "Product saved! You can find it in your saved items.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[288px] p-0">
        {/* Product Media Carousel */}
        <div className="relative w-full aspect-[4/5] bg-muted">
          {mediaItems.length > 0 ? (
            <Carousel 
              className="w-full h-full" 
              opts={{ loop: false }}
              setApi={setCarouselApi}
            >
              <CarouselContent className="h-full -ml-0">
                {mediaItems.map((item, index) => (
                  <CarouselItem key={index} className="pl-0 h-full">
                    {item.type === 'image' && (
                      <img
                        src={item.url}
                        alt={index === 0 ? product.name : `Content ${index}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}
                    {item.type === 'video' && (
                      <video
                        src={item.url}
                        controls
                        playsInline
                        className="w-full h-full object-contain bg-black"
                        preload="metadata"
                      />
                    )}
                    {item.type === 'youtube' && (
                      <iframe
                        src={item.url}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    )}
                  </CarouselItem>
                ))}
              </CarouselContent>
              
              {/* Dot indicators */}
              {mediaItems.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {mediaItems.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => carouselApi?.scrollTo(i)}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full transition-all",
                        currentSlide === i 
                          ? "bg-white w-3" 
                          : "bg-white/50 hover:bg-white/70"
                      )}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
              )}
              
              {/* Swipe hint on first slide when content available */}
              {mediaItems.length > 1 && currentSlide === 0 && (
                <div className="absolute bottom-10 right-3 z-10 flex items-center gap-1 text-[10px] text-white/80 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                  Swipe for content →
                </div>
              )}
            </Carousel>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
          
          {/* Brand overlay - bottom left (only show on first slide or if no carousel) */}
          {product.brand_name && (mediaItems.length <= 1 || currentSlide === 0) && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-md px-2 py-1 z-20">
              <Avatar className="h-4 w-4 rounded-sm">
                <AvatarImage src={product.brand_logo} alt={product.brand_name} />
                <AvatarFallback className="text-[9px] rounded-sm">
                  {product.brand_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-white font-medium">{product.brand_name}</span>
            </div>
          )}
          
          {/* Theme badge overlay - hidden when on content slides */}
          {themeConfig && (mediaItems.length <= 1 || currentSlide === 0) && (
            <Badge 
              className="absolute bottom-2 right-2 text-[10px] px-1.5 py-0.5 z-20"
              style={{ 
                backgroundColor: `${themeConfig.color}20`,
                color: themeConfig.color,
                borderColor: `${themeConfig.color}40`,
              }}
            >
              {themeConfig.id === 'top_trending' ? 'Trending' : 
               themeConfig.id === 'best_reach' ? 'High Reach' : 
               themeConfig.id === 'fastest_selling' ? 'Fast Selling' : 
               themeConfig.title}
            </Badge>
          )}
        </div>

        {/* Product Details */}
        <div className="px-3 py-2.5 space-y-2.5">
          {/* Product Title - Left aligned */}
          <DialogHeader className="p-0 space-y-0">
            <DialogTitle className="text-lg font-semibold leading-snug line-clamp-2 text-left">
              {product.name}
            </DialogTitle>
          </DialogHeader>

          {/* Price and Match Score Row */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">
              {product.price != null ? `₹${product.price.toLocaleString('en-IN')}` : 'Price N/A'}
            </span>
            {showMatchScore && (
              <Badge 
                variant="secondary" 
                className="bg-green-500/10 text-green-600 border-green-500/20 text-xs"
              >
                {matchScore}% Match
              </Badge>
            )}
          </div>

          {/* Match Reasons Section */}
          {matchReasons.length > 0 && (
            <div className="bg-primary/5 rounded-lg p-2.5 space-y-1.5">
              <h4 className="text-[11px] font-medium flex items-center gap-1 text-muted-foreground">
                💡 Why this matches your audience
              </h4>
              <div className="space-y-1">
                {matchReasons.map((reason) => (
                  <div key={reason.id} className="flex items-center gap-2 text-xs text-foreground">
                    <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                    <span>{reason.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="space-y-1.5">
            {/* Primary CTA - Check Product */}
            <Button 
              onClick={handleCheckProduct}
              size="sm"
              className="w-full gap-1.5"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Check Product
            </Button>

            {/* Secondary CTAs Row */}
            <div className="grid grid-cols-2 gap-1.5">
              <Button
                onClick={handleCopyLink}
                variant="outline"
                size="sm"
                className="gap-1"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>

              <Button
                onClick={handleSaveForLater}
                variant={isWishlisted ? "secondary" : "outline"}
                size="sm"
                className="gap-1"
              >
                {isWishlisted ? (
                  <BookmarkCheck className="h-3.5 w-3.5" />
                ) : (
                  <Bookmark className="h-3.5 w-3.5" />
                )}
                {isWishlisted ? 'Saved' : 'Save'}
              </Button>
            </div>
          </div>

          {/* Content indicator when content is available */}
          {reelUrls.length > 0 && (
            <p className="text-[10px] text-muted-foreground text-center pt-1 border-t border-border">
              📹 {reelUrls.length} content video{reelUrls.length > 1 ? 's' : ''} available — swipe image above
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
