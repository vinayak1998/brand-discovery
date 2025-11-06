import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ExternalLink, ShoppingBag } from "lucide-react";
import { useState, useEffect } from "react";
import { useAnalytics, ThemeId } from "@/hooks/useAnalytics";
import { useSearchParams, useNavigate } from "react-router-dom";

interface BrandData {
  brand_name: string;
  logo_url?: string;
  value: number;
  website_url?: string;
  brand_id?: number;
}

interface BrandInsightCardProps {
  icon: any;
  title: string;
  tagline: string;
  color: string;
  themeId: ThemeId;
  creatorId: number | null;
  brands: BrandData[];
  delay?: number;
}

const BrandAvatar = ({ logoUrl, brandName }: { logoUrl?: string; brandName: string }) => {
  return (
    <Avatar className="w-10 h-10">
      {logoUrl && <AvatarImage src={logoUrl} alt={`${brandName} logo`} />}
      <AvatarFallback className="brand-avatar">{getInitials(brandName)}</AvatarFallback>
    </Avatar>
  );
};

const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

const BrandInsightCard = ({
  icon: Icon,
  title,
  tagline,
  color,
  themeId,
  creatorId,
  brands,
  delay = 0,
}: BrandInsightCardProps) => {
  const [selectedBrand, setSelectedBrand] = useState<BrandData | null>(null);
  const { trackThemeView, trackBrandClick, trackBrandWebsiteClick } = useAnalytics(creatorId);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const creatorUuid = searchParams.get('creator_id');

  // Track theme view on mount
  useEffect(() => {
    trackThemeView(themeId);
  }, [themeId, trackThemeView]);

  // Calculate max value for proper bar scaling using rounded values
  const maxValue = brands.length > 0 ? Math.max(...brands.map((b) => Math.ceil(b.value))) : 0;

  return (
    <>
      <Card className="p-6 insight-card animate-fade-in bg-card border-border" style={{ animationDelay: `${delay}ms` }}>
        {/* Card Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Icon className="w-6 h-6" style={{ color }} />
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {title === "Top Trending Brands" ? "What other creators similar to you are talking about most" : tagline}
          </p>
        </div>

        {/* Metric Header */}
        <div className="flex justify-end mb-3">
          <p className="text-xs text-muted-foreground font-medium">
            {title === "Top Trending Brands" && "Products recently shared by other creators like you!"}
            {title === "Best Reach Brands" && "Views per recent posts"}
            {title === "Fastest Selling Products" && "Sales per link"}
            {title === "Highest Commission Rates" && "Commission%"}
          </p>
        </div>

        {/* Brand List */}
        <div className="space-y-4">
          {brands.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No brands available for this category</p>
            </div>
          ) : (
            brands.map((brand, index) => {
              const roundedValue = Math.ceil(brand.value);
              const barWidth = maxValue > 0 ? (roundedValue / maxValue) * 100 : 0;

              return (
                <div key={`${brand.brand_name}-${index}`} className="space-y-3">
                  {/* Brand Info Row */}
                  <div
                    className="flex items-center justify-between cursor-pointer hover:bg-accent/50 p-2 rounded-lg transition-colors"
                    onClick={() => {
                      if (brand.brand_id) {
                        trackBrandClick(brand.brand_id, themeId);
                      }
                      setSelectedBrand(brand);
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <BrandAvatar logoUrl={brand.logo_url} brandName={brand.brand_name} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{brand.brand_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{Math.ceil(brand.value).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-border rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full bar-fill"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: color,
                        animationDelay: `${delay + index * 100}ms`,
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <Dialog open={!!selectedBrand} onOpenChange={() => setSelectedBrand(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedBrand && (
                <>
                  <BrandAvatar logoUrl={selectedBrand.logo_url} brandName={selectedBrand.brand_name} />
                  <span>{selectedBrand.brand_name}</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Primary CTA: View Recommended Products */}
            <Button
              onClick={() => {
                if (selectedBrand?.brand_id) {
                  trackBrandClick(selectedBrand.brand_id, themeId);
                }
                navigate(`/brand/products?creator_id=${creatorUuid}&brand_name=${encodeURIComponent(selectedBrand?.brand_name || '')}`);
              }}
              className="w-full"
              size="lg"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              View Recommended Products
            </Button>

            {/* Secondary CTA: Go to Brand Website */}
            {selectedBrand?.website_url ? (
              <Button
                variant="outline"
                onClick={() => {
                  if (selectedBrand.brand_id) {
                    trackBrandWebsiteClick(selectedBrand.brand_id, themeId);
                  }
                  window.open(selectedBrand.website_url, "_blank");
                }}
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit Brand Website
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BrandInsightCard;
