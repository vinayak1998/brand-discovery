import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAnalytics, ThemeId } from "@/hooks/useAnalytics";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface BrandData {
  brand_name: string;
  logo_url?: string;
  value: number;
  website_url?: string;
  brand_id?: number;
  sourcing_link?: string;
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
  const [isOpen, setIsOpen] = useState(false);
  const { trackThemeView, trackBrandClick } = useAnalytics(creatorId);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const creatorUuid = searchParams.get("creator_id");

  // Track theme view on mount
  useEffect(() => {
    trackThemeView(themeId);
  }, [themeId, trackThemeView]);

  // Calculate max value for proper bar scaling using rounded values
  const maxValue = brands.length > 0 ? Math.max(...brands.map((b) => Math.ceil(b.value))) : 0;

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card
          className="insight-card animate-fade-in bg-card border-border overflow-hidden"
          style={{ animationDelay: `${delay}ms` }}
        >
          {/* Collapsible Header */}
          <CollapsibleTrigger className="w-full p-6 text-left hover:bg-accent/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <Icon className="w-6 h-6 flex-shrink-0" style={{ color }} />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {title === "Top Trending Brands"
                      ? "What other creators similar to you are talking about most"
                      : tagline}
                  </p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform duration-200 flex-shrink-0 ml-2",
                  isOpen && "rotate-180",
                )}
              />
            </div>
          </CollapsibleTrigger>

          {/* Collapsible Content */}
          <CollapsibleContent>
            <div className="px-6 pb-6 pt-2">
              {/* Metric Header */}
              <div className="flex justify-end mb-3">
                <p className="text-xs text-muted-foreground font-medium">
                  {title === "Top Trending Brands" && "Brands recently shared by similar creators!"}
                  {title === "Best Reach Brands" && "Views per recent posts"}
                  {title === "Fastest Selling Products" && "Sales per link"}
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
                          className="group flex items-center justify-between cursor-pointer hover:bg-accent/70 active:bg-accent p-3 rounded-lg transition-all ring-offset-background focus-visible:outline-none focus-visible:ring-2 border border-border hover:border-primary/40 hover:shadow-sm"
                          onClick={() => {
                            if (brand.brand_id) {
                              trackBrandClick(brand.brand_id, themeId);
                            }
                            navigate(
                              `/brand/products?creator_id=${creatorUuid}&brand_name=${encodeURIComponent(brand.brand_name)}`
                            );
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <BrandAvatar logoUrl={brand.logo_url} brandName={brand.brand_name} />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-foreground truncate">{brand.brand_name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground">{Math.ceil(brand.value).toLocaleString()}</p>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </>
  );
};

export default BrandInsightCard;
