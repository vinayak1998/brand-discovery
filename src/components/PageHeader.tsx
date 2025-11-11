import wishLinkLogo from "@/assets/wishlink-logo.png";

interface PageHeaderProps {
  lastUpdated?: string;
  creatorName?: string;
  pageContext?: 'brands' | 'products';
  brandName?: string;
}

const PageHeader = ({ lastUpdated, creatorName, pageContext = 'brands', brandName }: PageHeaderProps) => {
  return (
    <header className="bg-primary text-primary-foreground py-4 sm:py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="flex items-start gap-3 sm:gap-4 flex-1">
            <div className="flex-shrink-0">
              <img 
                src={wishLinkLogo} 
                alt="Wishlink" 
                className="h-8 sm:h-12 w-auto object-contain"
              />
            </div>
            
            <div className="flex-1">
              {pageContext === 'products' && brandName && (
                <h1 className="text-xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">
                  {brandName} - Product Recommendations
                </h1>
              )}
              <p className={`text-primary-foreground/90 ${pageContext === 'products' ? 'text-sm sm:text-lg' : 'text-base sm:text-xl'} mb-1 sm:mb-2`}>
                {pageContext === 'products' 
                  ? 'Products curated just for you'
                  : 'Boost your reach & earnings with data-driven brand picks'}
              </p>
            </div>
          </div>

          {creatorName && (
            <div className="flex-shrink-0 text-right">
              <p className="text-primary-foreground font-semibold text-xs sm:text-sm md:text-base">{creatorName}</p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default PageHeader;