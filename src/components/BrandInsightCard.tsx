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
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const BrandAvatar = ({ logoUrl, brandName }: { logoUrl?: string; brandName: string }) => {
  return (
    <Avatar className="w-8 h-8">
      {logoUrl && <AvatarImage src={logoUrl} alt={`${brandName} logo`} />}
      <AvatarFallback className="brand-avatar-small">{getInitials(brandName)}</AvatarFallback>
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
  isOpen,
  onOpenChange,
}: BrandInsightCardProps) => {
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
      <Collapsible open={isOpen} onOpenChange={onOpenChange}>
        <Card
          className={cn(
            "insight-card animate-fade-in bg-card border-border overflow-hidden transition-all duration-300",
            isOpen && "ring-2 ring-primary/20 shadow-lg",
          )}
          style={{ animationDelay: `${delay}ms` }}
        >
          {/* Collapsible Header */}
          <CollapsibleTrigger className="w-full p-4 sm:p-5 text-left hover:bg-accent/30 transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 flex-1">
                <Icon className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110" style={{ color }} />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-foreground mb-0.5">{title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-tight">
                    {title === "Top Trending Brands"
                      ? "What other creators similar to you are talking about most"
                      : tagline}
                  </p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "w-5 h-5 text-muted-foreground transition-all duration-300 flex-shrink-0 ml-2 group-hover:text-primary",
                  isOpen && "rotate-180",
                )}
              />
            </div>
          </CollapsibleTrigger>

          {/* Collapsible Content */}
          <CollapsibleContent className="accordion-content">
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1">
              {/* Metric Header */}
              <div className="flex justify-end mb-2">
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                  {title === "Top Trending Brands" && "Recent shares by similar creators"}
                  {title === "Best Reach Brands" && "Views per recent posts"}
                  {title === "Fastest Selling Products" && "Sales per link(₹)"}
                </p>
              </div>

              {/* Brand List */}
              <div className="space-y-3">
                {brands.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">No brands available for this category</p>
                  </div>
                ) : (
                  brands.map((brand, index) => {
                    const roundedValue = Math.ceil(brand.value);
                    const barWidth = maxValue > 0 ? (roundedValue / maxValue) * 100 : 0;

                    return (
                      <div
                        key={`${brand.brand_name}-${index}`}
                        className="space-y-2 brand-tile-stagger"
                        style={{ "--stagger-index": index } as any}
                        data-tour={index === 0 ? "brand-card" : undefined}
                      >
                        {/* Brand Info Row */}
                        <div
                          className="group flex items-center justify-between cursor-pointer hover:bg-accent/70 active:bg-accent active:scale-[0.98] p-2 rounded-lg transition-all duration-200 ring-offset-background focus-visible:outline-none focus-visible:ring-2 border border-border hover:border-primary/40 hover:shadow-sm"
                          onClick={() => {
                            if (brand.brand_id) {
                              trackBrandClick(brand.brand_id, themeId);
                            }
                            navigate(
                              `/brand/products?creator_id=${creatorUuid}&brand_name=${encodeURIComponent(brand.brand_name)}`,
                            );
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <BrandAvatar logoUrl={brand.logo_url} brandName={brand.brand_name} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{brand.brand_name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-foreground">
                              {Math.ceil(brand.value).toLocaleString()}
                            </p>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-border rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-full rounded-full bar-fill progress-gradient"
                            style={{
                              width: `${barWidth}%`,
                              backgroundColor: color,
                              animationDelay: `${delay + index * 50}ms`,
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
