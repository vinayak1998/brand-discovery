import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useInsightsData, useSurveySubmission } from '@/hooks/useInsightsData';
import PageHeader from '@/components/PageHeader';
import BrandInsightCard from '@/components/BrandInsightCard';
import SurveySection from '@/components/SurveySection';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle, Sparkles } from 'lucide-react';
import { THEMES, getTheme } from '@/config/themes';
import { useAnalytics, ThemeId } from '@/hooks/useAnalytics';

const Index = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const creatorUuid = searchParams.get('creator_id');
  
  // Redirect to landing if no creator_id
  useEffect(() => {
    if (!creatorUuid) {
      navigate('/');
    }
  }, [creatorUuid, navigate]);

  const { insights, loading, error, getInsightsByTheme, hasData, lastUpdated } = useInsightsData(creatorUuid || '');
  const { submitSurvey } = useSurveySubmission();
  
  // Initialize analytics tracking
  const creatorIdNum = creatorUuid ? parseInt(creatorUuid) : null;
  const { trackPageView, trackCTAClick } = useAnalytics(creatorIdNum);
  
  // Track page view on mount
  useEffect(() => {
    if (creatorIdNum && hasData) {
      trackPageView();
    }
  }, [creatorIdNum, hasData, trackPageView]);

  // Check if this is an invalid creator ID (no data exists)
  const isInvalidCreator = !loading && !error && !hasData && creatorUuid && creatorUuid !== '0000000000';

  const themes = Object.values(THEMES);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <div className="space-y-3">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                        <Skeleton className="h-3 w-full" />
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <Card className="p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground">{error}</p>
          </Card>
        </main>
      </div>
    );
  }

  // Show invalid creator ID error
  if (isInvalidCreator) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-destructive/5 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center shadow-xl">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-4">
              <AlertCircle className="w-12 h-12 text-destructive" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Invalid Creator ID</h2>
          <p className="text-muted-foreground mb-6">
            The Creator ID "{creatorUuid}" was not found in our system. Please check your ID and try again.
          </p>
          <Button onClick={() => navigate('/')}>
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <Card className="p-8 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-semibold mb-2">We're preparing your insights</h2>
            <p className="text-muted-foreground mb-8">Please check back soon.</p>
            
            {/* Still show survey even with no data */}
            <div className="max-w-2xl mx-auto">
              <SurveySection 
                creatorId={creatorUuid || ''} 
                onSubmit={submitSurvey}
              />
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader lastUpdated={lastUpdated || undefined} />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Brand Insight Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {themes.map((theme, index) => {
            const themeBrands = getInsightsByTheme(theme.id);
            
            return (
              <BrandInsightCard
                key={theme.id}
                icon={theme.icon}
                title={theme.title}
                tagline={theme.tagline}
                color={theme.color}
                themeId={theme.id as ThemeId}
                creatorId={creatorIdNum}
                brands={themeBrands.map(insight => ({
                  brand_name: insight.brand_name,
                  logo_url: insight.logo_url,
                  value: insight.value,
                  website_url: (insight as any).website_url,
                  brand_id: (insight as any).brand_id,
                }))}
                delay={index * 100}
              />
            );
          })}
        </div>

        {/* CTA Section */}
        <Card className="p-8 mb-12 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
          <div className="text-center max-w-2xl mx-auto">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-3">Ready to Start Creating?</h2>
            <p className="text-muted-foreground mb-6">
              Now that you've discovered the trending brands, it's time to create content and share your unique links!
            </p>
            <Button
              size="lg"
              onClick={() => {
                trackCTAClick();
                window.open('https://creator.wishlink.com/create-diy', '_blank');
              }}
            >
              Start Creating Content
            </Button>
          </div>
        </Card>

        {/* Survey Section */}
        <div className="max-w-2xl mx-auto">
          <SurveySection 
            creatorId={creatorUuid || ''} 
            onSubmit={submitSurvey}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
