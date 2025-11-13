import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect, useRef } from "react";
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
}: BrandInsightCardProps) => {
  const { trackThemeView, trackBrandClick } = useAnalytics(creatorId);
  const { trackThemeImpression, trackBrandInteraction } = useGATracking();
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);

  useEffect(() => {
    trackThemeView(themeId);
  }, [themeId, trackThemeView]);

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
              position: Array.from(document.querySelectorAll('.insight-card')).indexOf(entry.target as Element),
            });
            setHasTrackedImpression(true);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(cardRef.current);
    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [themeId, title, brands.length, hasTrackedImpression, trackThemeImpression]);

  return (
    <Card 
      ref={cardRef}
      className="overflow-hidden border-primary/10 bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm insight-card"
    >
      <div className="p-4 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground mb-0.5 truncate">{title}</h3>
            <p className="text-xs text-muted-foreground truncate">{tagline}</p>
          </div>
        </div>
      </div>

      <div className="px-3 pb-3 pt-3 space-y-3">
        {brands.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No brands available in this category
          </p>
        )}
        
        {brands.map((brand, index) => {
          const handleBrandClick = async () => {
            if (creatorId && brand.brand_id) {
              await trackBrandClick(themeId as string, brand.brand_id);
            }

            trackBrandInteraction({
              brand_id: brand.brand_id?.toString() || brand.brand_name,
              brand_name: brand.brand_name,
              theme_id: themeId as string,
              theme_name: title,
              position: index,
              interaction_type: 'brand_click',
            });

            if (brand.brand_id) {
              try {
                const { data: brandData, error } = await supabase
                  .from('brands')
                  .select('brand_name, display_name')
                  .eq('brand_id', brand.brand_id)
                  .single();

                if (error) {
                  console.error('Error fetching brand details:', error);
                  navigate(`/brands/${brand.brand_id}`);
                  return;
                }

                const displayName = brandData?.display_name || brandData?.brand_name || brand.brand_name;
                navigate(`/brands/${brand.brand_id}`, { 
                  state: { 
                    brandName: displayName,
                    logoUrl: brand.logo_url,
                    websiteUrl: brand.website_url,
                    sourcingLink: brand.sourcing_link,
                    themeId: themeId,
                  } 
                });
              } catch (error) {
                console.error('Error in brand click handler:', error);
                navigate(`/brands/${brand.brand_id}`);
              }
            }
          };

          return (
            <div
              key={`${brand.brand_name}-${index}`}
              onClick={handleBrandClick}
              className="flex items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-all duration-200 cursor-pointer border border-primary/20 shadow-sm active:shadow-md"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <BrandAvatar logoUrl={brand.logo_url} brandName={brand.brand_name} />
                <span className="text-xs font-medium text-foreground truncate">
                  {brand.brand_name}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-medium text-foreground whitespace-nowrap">
                  {brand.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default BrandInsightCard;
