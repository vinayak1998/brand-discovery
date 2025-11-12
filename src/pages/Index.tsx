import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useInsightsData, useSurveySubmission } from '@/hooks/useInsightsData';
import { useCreatorContext } from '@/contexts/CreatorContext';
import { useGATracking } from '@/hooks/useGATracking';
import PageHeader from '@/components/PageHeader';
import BrandInsightCard from '@/components/BrandInsightCard';
import SurveySection from '@/components/SurveySection';
import AllProductsView from '@/components/AllProductsView';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Sparkles } from 'lucide-react';
import { THEMES, getTheme } from '@/config/themes';
import { useAnalytics, ThemeId } from '@/hooks/useAnalytics';

const Index = () => {
  const navigate = useNavigate();
  const { creatorUuid, isReady } = useCreatorContext();
  const [searchParams] = useSearchParams();
  const creatorIdFromUrl = searchParams.get('creator_id');
  
  // Determine active tab from URL path
  const pathname = window.location.pathname;
  const activeTab = pathname.includes('/products') ? 'products' : 'brands';
  
  const initialOpenId = Object.values(THEMES)[0]?.id ?? null;
  const [openAccordion, setOpenAccordion] = useState<string | null>(initialOpenId); // Ensure at least one is always open
  const [timeSpent, setTimeSpent] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [scrollCount, setScrollCount] = useState(0);
  const hasTrackedEngagement = useRef(false);
  
  // Redirect to landing if no creator_id (but wait if URL has creator_id being processed)
  useEffect(() => {
    if (isReady && !creatorUuid && !creatorIdFromUrl) {
      navigate('/');
    }
  }, [isReady, creatorUuid, creatorIdFromUrl, navigate]);
  
  // Redirect /insights to /insights/brands for backward compatibility
  useEffect(() => {
    if (pathname === '/insights' && isReady && creatorUuid) {
      navigate('/insights/brands', { replace: true });
    }
  }, [pathname, isReady, creatorUuid, navigate]);

  const { insights, loading, error, getInsightsByTheme, hasData, lastUpdated, creatorName, creatorIdNum } = useInsightsData(creatorUuid || '');
  const { submitSurvey } = useSurveySubmission();
  
  // Initialize analytics tracking
  const { trackPageView, trackCTAClick } = useAnalytics(creatorIdNum);
  const { trackPageView: trackGAPageView, trackEngagementQualified, trackConversionAction } = useGATracking();
  
  // Track page view on mount (GA4)
  useEffect(() => {
    if (creatorIdNum && hasData) {
      trackPageView();
      trackGAPageView({
        page_path: window.location.pathname,
        page_title: activeTab === 'brands' ? 'Brand Discovery' : 'Product Discovery',
        tab: activeTab,
        screen: activeTab === 'brands' ? 'brand_discovery' : 'product_discovery',
      });
    }
  }, [creatorIdNum, hasData, trackPageView, trackGAPageView, activeTab]);

  // Timer for 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Track engagement qualified (retention criteria: 2 clicks OR 1 scroll OR 20 seconds)
  useEffect(() => {
    if (hasTrackedEngagement.current) return;
    
    const meetsRetentionCriteria = clickCount >= 2 || scrollCount >= 1 || timeSpent >= 20;
    
    if (meetsRetentionCriteria) {
      const engagementType = clickCount >= 2 ? 'clicks' : scrollCount >= 1 ? 'scroll' : 'time';
      
      trackEngagementQualified({
        engagement_type: engagementType,
        time_spent: timeSpent,
        interaction_count: clickCount,
        scroll_depth: scrollCount,
      });
      
      hasTrackedEngagement.current = true;
    }
  }, [clickCount, scrollCount, timeSpent, trackEngagementQualified]);

  // Track scroll events
  useEffect(() => {
    let hasScrolled = false;
    const handleScroll = () => {
      if (!hasScrolled) {
        setScrollCount(prev => prev + 1);
        hasScrolled = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { once: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if survey should be shown (30 seconds OR 1+ interactions)
  const showSurvey = timeSpent >= 30 || hasInteracted;

  // Check if this is an invalid creator ID (no data exists)
  const isInvalidCreator = !loading && !error && !hasData && creatorUuid && creatorUuid !== '0000000000';

  const themes = Object.values(THEMES);

  // Ensure at least one accordion is always open
  useEffect(() => {
    if (!openAccordion || !themes.some(t => t.id === openAccordion)) {
      if (themes[0]) {
        setOpenAccordion(themes[0].id);
      }
    }
  }, [openAccordion, themes]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            {[1, 2, 3].map((i) => (
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
      <PageHeader lastUpdated={lastUpdated || undefined} creatorName={creatorName || undefined} />
      
      <main className="max-w-7xl mx-auto px-6 py-4">
        {/* Tabs for Brand Discovery vs Product Discovery */}
        <Tabs value={activeTab} onValueChange={(tab) => {
          setHasInteracted(true);
          setClickCount(prev => prev + 1);
          navigate(`/insights/${tab}`);
        }} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto mb-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <TabsTrigger value="brands">Brands</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
          </TabsList>

          {/* Brand Discovery Tab */}
          <TabsContent value="brands" className="space-y-12">
            {/* Brand Insight Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    brands={themeBrands.map((insight) => ({
                      brand_name: insight.brand_name,
                      logo_url: insight.logo_url,
                      value: insight.value,
                      website_url: insight.website_url,
                      brand_id: insight.brand_id,
                      sourcing_link: insight.sourcing_link,
                    }))}
                    delay={index * 100}
                    isOpen={openAccordion === theme.id}
                    onOpenChange={(isOpen) => {
                      setHasInteracted(true);
                      setClickCount(prev => prev + 1);
                      if (isOpen) {
                        setOpenAccordion(theme.id);
                      } else if (openAccordion === theme.id) {
                        // Open next theme in cyclic order
                        const currentIndex = themes.findIndex(t => t.id === theme.id);
                        const nextIndex = (currentIndex + 1) % themes.length;
                        setOpenAccordion(themes[nextIndex].id);
                      }
                    }}
                  />
                );
              })}
            </div>

            {/* Survey Section - Only show after 30s or 1+ interactions */}
            {showSurvey && (
              <div className="max-w-2xl mx-auto">
                <SurveySection 
                  creatorId={creatorUuid || ''} 
                  onSubmit={(data) => {
                    submitSurvey(data);
                    // Track survey submit
                    trackConversionAction({
                      action: 'survey_submit',
                    });
                  }}
                />
              </div>
            )}
          </TabsContent>

          {/* Product Discovery Tab */}
          <TabsContent value="products" className="pt-2">
            <AllProductsView creatorUuid={creatorUuid || ''} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
