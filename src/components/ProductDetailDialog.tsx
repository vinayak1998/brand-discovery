import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ExternalLink, Copy, Bookmark, BookmarkCheck, Check, Play } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getTheme } from '@/config/themes';

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
}

interface ProductDetailDialogProps {
  product: ProductWithBrand | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  creatorId: number | null;
  onExternalRedirect?: () => void;
}

export const ProductDetailDialog = ({
  product,
  open,
  onOpenChange,
  isWishlisted,
  onToggleWishlist,
  creatorId,
  onExternalRedirect,
}: ProductDetailDialogProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

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
      <DialogContent className="max-w-sm sm:max-w-md p-0 overflow-hidden">
        {/* Product Image */}
        <div className="relative w-full aspect-square bg-muted">
          {product.thumbnail_url ? (
            <img
              src={product.thumbnail_url}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
          
          {/* Theme badge overlay */}
          {themeConfig && (
            <Badge 
              className="absolute bottom-3 right-3 text-xs px-2 py-1"
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
        <div className="p-4 sm:p-6 space-y-4">
          <DialogHeader className="p-0 space-y-3">
            {/* Brand Info */}
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="h-6 w-6 rounded-md">
                      <AvatarImage src={product.brand_logo} alt={product.brand_name} />
                      <AvatarFallback className="text-xs rounded-md">
                        {product.brand_name?.charAt(0) || 'B'}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{product.brand_name || 'Unknown Brand'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="text-sm text-muted-foreground">{product.brand_name}</span>
            </div>

            {/* Product Title */}
            <DialogTitle className="text-lg font-semibold leading-snug line-clamp-2">
              {product.name}
            </DialogTitle>

            {/* Price and Match Score Row */}
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold">
                {product.price != null ? `₹${product.price.toLocaleString('en-IN')}` : 'Price N/A'}
              </span>
              {showMatchScore && (
                <Badge 
                  variant="secondary" 
                  className="bg-green-500/10 text-green-600 border-green-500/20"
                >
                  {matchScore}% Match
                </Badge>
              )}
            </div>
          </DialogHeader>

          {/* CTA Buttons */}
          <div className="space-y-3 pt-2">
            {/* Primary CTA - Check Product */}
            <Button 
              onClick={handleCheckProduct}
              className="w-full gap-2"
              size="lg"
            >
              <ExternalLink className="h-4 w-4" />
              Check Product
            </Button>

            {/* Secondary CTAs Row */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="gap-2"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>

              <Button
                onClick={handleSaveForLater}
                variant={isWishlisted ? "secondary" : "outline"}
                className="gap-2"
              >
                {isWishlisted ? (
                  <BookmarkCheck className="h-4 w-4" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
                {isWishlisted ? 'Saved' : 'Save'}
              </Button>
            </div>

            {/* Content Ideas Section */}
            {reelUrls.length > 0 && (
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  📹 Content Ideas
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    {reelUrls.length}
                  </Badge>
                </h4>
                <div className="flex gap-2">
                  {reelUrls.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => window.open(url, '_blank')}
                      className="relative w-16 h-16 rounded-lg overflow-hidden group transition-transform hover:scale-105"
                      style={{
                        background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
                        padding: '2px'
                      }}
                    >
                      <div className="w-full h-full bg-background rounded-md flex items-center justify-center">
                        <Play className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Tap to see how creators styled this product
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
