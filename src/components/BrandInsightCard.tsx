import { Card } from "@/components/ui/card";

interface BrandData {
  brand_name: string;
  logo_url?: string;
  metric: string;
  value: number;
  color?: string;
}

interface BrandInsightCardProps {
  icon: string;
  title: string;
  tagline: string;
  brands: BrandData[];
  delay?: number;
}

const BrandAvatar = ({ logoUrl, brandName }: { logoUrl?: string; brandName: string }) => {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${brandName} logo`}
        className="w-10 h-10 rounded-full object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            parent.innerHTML = getInitials(brandName);
            parent.className = 'brand-avatar';
          }
        }}
      />
    );
  }

  return (
    <div className="brand-avatar">
      {getInitials(brandName)}
    </div>
  );
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

const BrandInsightCard = ({ icon, title, tagline, brands, delay = 0 }: BrandInsightCardProps) => {
  // Calculate max value for proper bar scaling
  const maxValue = brands.length > 0 ? Math.max(...brands.map(b => b.value)) : 0;

  return (
    <Card 
      className="p-6 insight-card animate-fade-in bg-card border-border"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Card Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{tagline}</p>
      </div>

      {/* Brand List */}
      <div className="space-y-4">
        {brands.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No brands available for this category</p>
          </div>
        ) : (
          brands.map((brand, index) => {
            const barWidth = maxValue > 0 ? (brand.value / maxValue) * 100 : 0;
            
            return (
              <div key={`${brand.brand_name}-${index}`} className="space-y-3">
                {/* Brand Info Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <BrandAvatar logoUrl={brand.logo_url} brandName={brand.brand_name} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{brand.brand_name}</p>
                      <p className="text-sm text-muted-foreground">{brand.metric}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{brand.value.toLocaleString()}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-border rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full bar-fill"
                    style={{ 
                      width: `${barWidth}%`,
                      backgroundColor: brand.color || 'hsl(var(--primary))',
                      animationDelay: `${delay + (index * 100)}ms`
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};

export default BrandInsightCard;