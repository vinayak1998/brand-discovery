import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CSVDataProvider } from "@/contexts/CSVDataContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CreatorProvider } from "@/contexts/CreatorContext";
import CreatorUrlInterceptor from "@/components/CreatorUrlInterceptor";
import { ErrorBoundaryWithTracking } from "@/components/ErrorBoundary";
import { useGATracking } from "@/hooks/useGATracking";
import { useScrollTracking } from "@/hooks/useScrollTracking";
import { trackPerformanceWhenReady } from "@/utils/performanceTracker";
import { useEffect, useCallback } from "react";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import Analytics from "./pages/Analytics";
import Auth from "./pages/Auth";
import BrandProducts from "./pages/BrandProducts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Global tracking wrapper component
const GlobalTracking = ({ children }: { children: React.ReactNode }) => {
  const { trackScrollMilestone, trackPerformanceReady } = useGATracking();

  // Track scroll milestones - memoized callback to prevent infinite loop
  const handleScrollMilestone = useCallback((depth: number) => {
    trackScrollMilestone({
      scroll_depth: depth,
      page_section: window.location.pathname,
    });
  }, [trackScrollMilestone]);

  useScrollTracking(handleScrollMilestone);

  // Track performance metrics when page loads
  useEffect(() => {
    trackPerformanceWhenReady((metrics) => {
      trackPerformanceReady(metrics);
    });
  }, [trackPerformanceReady]);

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CreatorProvider>
        <ErrorBoundaryWithTracking>
          <CSVDataProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <CreatorUrlInterceptor />
                <GlobalTracking>
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/insights" element={<Index />} />
                    <Route path="/insights/brands" element={<Index />} />
                    <Route path="/insights/products" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/admin/analytics" element={<Analytics />} />
                    <Route path="/brand/products" element={<BrandProducts />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </GlobalTracking>
              </BrowserRouter>
            </TooltipProvider>
          </CSVDataProvider>
        </ErrorBoundaryWithTracking>
      </CreatorProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
