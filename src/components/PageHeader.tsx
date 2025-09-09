import { useState } from 'react';
import { Database } from 'lucide-react';
import wishLinkLogo from "@/assets/wishlink-logo.png";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CSVUploadDialog from '@/components/CSVUploadDialog';
import { useCSVData } from '@/contexts/CSVDataContext';

interface PageHeaderProps {
  lastUpdated?: string;
}

const PageHeader = ({ lastUpdated }: PageHeaderProps) => {
  const [showCSVDialog, setShowCSVDialog] = useState(false);
  const { hasInsightsData, hasSurveyData } = useCSVData();

  return (
    <>
      <header className="bg-primary text-primary-foreground py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
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

            {/* Data Management Section */}
            <div className="flex flex-col items-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowCSVDialog(true)}
                className="flex items-center gap-2"
              >
                <Database className="w-4 h-4" />
                Manage Data
              </Button>
              
              <div className="flex gap-2">
                {hasInsightsData && (
                  <Badge variant="secondary" className="text-xs">
                    Insights Active
                  </Badge>
                )}
                {hasSurveyData && (
                  <Badge variant="secondary" className="text-xs">
                    Surveys Active
                  </Badge>
                )}
                {!hasInsightsData && !hasSurveyData && (
                  <Badge variant="outline" className="text-xs text-primary-foreground/70">
                    Using Mock Data
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <CSVUploadDialog 
        open={showCSVDialog} 
        onOpenChange={setShowCSVDialog}
      />
    </>
  );
};

export default PageHeader;