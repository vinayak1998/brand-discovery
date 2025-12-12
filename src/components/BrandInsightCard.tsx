import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronDown, ChevronRight, Info } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useAnalytics, ThemeId } from "@/hooks/useAnalytics";
import { useGATracking } from "@/hooks/useGATracking";
import { useNavigate } from "react-router-dom";
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
  showTooltipOnFirst?: boolean;
  onFirstBrandClick?: () => void;
  onDismissTooltip?: () => void;
  onBrandClick?: () => void;
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
  showTooltipOnFirst = false,
  onFirstBrandClick,
  onDismissTooltip,
  onBrandClick,
}: BrandInsightCardProps) => {
  const { trackThemeView, trackBrandClick } = useAnalytics(creatorId);
  const { trackThemeImpression, trackThemeInteraction, trackBrandInteraction } = useGATracking(creatorId);
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);

  // Track theme view on mount (existing Supabase analytics)
  useEffect(() => {
    trackThemeView(themeId);
  }, [themeId, trackThemeView]);

  // Track theme impression when card becomes visible (GA4)
  useEffect(() => {
    if (!cardRef.current || hasTrackedImpression) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            trackThemeImpression({
              theme_id: themeId,
              theme_name: title,
              brand_count: brands.length,
              position: Array.from(document.querySelectorAll(".insight-card")).indexOf(entry.target as Element),
            });
            setHasTrackedImpression(true);
          }
        });
      },
      { threshold: 0.5 },
    );

    observer.observe(cardRef.current);

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [themeId, title, brands.length, hasTrackedImpression, trackThemeImpression]);

  // Calculate max value for proper bar scaling using rounded values
  const maxValue = brands.length > 0 ? Math.max(...brands.map((b) => Math.ceil(b.value))) : 0;

  return (
    <>
      <Collapsible
        open={isOpen}
        onOpenChange={(open) => {
          onOpenChange(open);
          // Track GA4 theme interaction
          if (open) {
            trackThemeInteraction({
              action: "theme_expand",
              theme_id: themeId,
              theme_name: title,
              brand_count: brands.length,
            });
          }
        }}
      >
        <Card
          ref={cardRef}
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
                    {title === "Most Shared Brands"
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
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-2">
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
                        className="space-y-2 brand-tile-stagger relative"
                        style={{ "--stagger-index": index } as any}
                      >
                        {/* Onboarding Tooltip - shown on first brand only */}
                        {index === 0 && showTooltipOnFirst && (
                          <div className="absolute -top-14 right-2 z-50 animate-fade-in max-w-[calc(100vw-2rem)]">
                            <div className="relative bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-lg text-xs font-medium whitespace-nowrap">
                              Tap to view products
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDismissTooltip?.();
                                }}
                                className="ml-2 hover:opacity-80 text-base leading-none"
                                aria-label="Dismiss"
                              >
                                ×
                              </button>
                              {/* Arrow pointer */}
                              <div className="absolute -bottom-1 right-3 w-2 h-2 bg-primary transform rotate-45" />
                            </div>
                          </div>
                        )}

                        {/* Brand Info Row */}
                        <div
                          className="group flex items-center justify-between cursor-pointer bg-card active:bg-accent active:scale-[0.98] p-3 rounded-lg transition-all duration-200 border border-primary/20 shadow-sm active:shadow-md"
                          onClick={() => {
                            // Track engagement click
                            onBrandClick?.();

                            // Notify parent if this is the first brand
                            if (index === 0 && onFirstBrandClick) {
                              onFirstBrandClick();
                            }
                            // Track existing Supabase analytics
                            if (brand.brand_id) {
                              trackBrandClick(brand.brand_id, themeId);
                            }
                            // Track GA4 brand click
                            trackBrandInteraction({
                              action: "brand_click",
                              brand_id: brand.brand_id || 0,
                              brand_name: brand.brand_name,
                              theme_id: themeId,
                            });
                            navigate(`/brand/products?brand_name=${encodeURIComponent(brand.brand_name)}`);
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
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div 
                                  className="text-muted-foreground hover:text-foreground cursor-help p-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Info className="w-4 h-4" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                <p className="text-xs">
                                  {themeId === 'top_trending' && `${Math.ceil(brand.value).toLocaleString()} shares by similar creators`}
                                  {themeId === 'best_reach' && `${Math.ceil(brand.value).toLocaleString()} views per recent post`}
                                  {themeId === 'fastest_selling' && `₹${Math.ceil(brand.value).toLocaleString()} sales per link`}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                            <ChevronRight className="w-5 h-5 text-primary transition-all" />
                          </div>
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
