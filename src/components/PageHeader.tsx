import wishLinkLogo from "@/assets/wishlink-logo.png";

interface PageHeaderProps {
  lastUpdated?: string;
}

const PageHeader = ({ lastUpdated }: PageHeaderProps) => {
  return (
    <header className="bg-primary text-primary-foreground py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <img 
              src={wishLinkLogo} 
              alt="Wishlink" 
              className="h-12 w-auto object-contain"
            />
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Your Brand Insights</h1>
            <p className="text-primary-foreground/90 text-lg mb-2">
              Data-driven recommendations to help you earn more on Wishlink
            </p>
            {lastUpdated && (
              <p className="text-primary-foreground/70 text-sm">
                Last updated: {lastUpdated}
              </p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default PageHeader;