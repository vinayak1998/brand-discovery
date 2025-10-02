import { useState, useEffect } from 'react';
import { useCSVData } from '@/contexts/CSVDataContext';
import { InsightRow as CSVInsightRow } from '@/utils/csvParser';

// Types for our data structure - extending CSV types for backward compatibility
export interface InsightRow {
  creator_id: string;
  theme_id: 'top_trending' | 'best_reach' | 'fastest_selling' | 'highest_commission' | 'high_engagement' | 'top_spending';
  theme_title: string;
  icon: string;
  tagline: string;
  color?: string;
  brand_name: string;
  logo_url?: string;
  metric: string;
  value: number;
}

export interface SurveyResponse {
  timestamp: string;
  creator_id: string;
  q1_useful: string;
  q2_intent: string;
  q3_themes: string;
}

// Mock data for demonstration
const mockInsightsData: InsightRow[] = [
  // Creator: creator_123
  // Top Trending
  { creator_id: "creator_123", theme_id: "top_trending", theme_title: "Top Trending Brands", icon: "🏆", tagline: "Ride the trend wave!", brand_name: "NewMe", logo_url: "https://newme.ae/uploads/logo/20240130103559537.png", metric: "Trend Score", value: 65, color: "#FF6F3D" },
  { creator_id: "creator_123", theme_id: "top_trending", theme_title: "Top Trending Brands", icon: "🏆", tagline: "Ride the trend wave!", brand_name: "Savana", logo_url: "", metric: "Trend Score", value: 20, color: "#FF6F3D" },
  { creator_id: "creator_123", theme_id: "top_trending", theme_title: "Top Trending Brands", icon: "🏆", tagline: "Ride the trend wave!", brand_name: "H&M", logo_url: "/src/assets/logos/hm-logo.png", metric: "Trend Score", value: 15, color: "#FF6F3D" },
  
  // Best Reach
  { creator_id: "creator_123", theme_id: "best_reach", theme_title: "Best Reach Brands", icon: "📈", tagline: "Maximize your reach!", brand_name: "Freakins", logo_url: "/src/assets/logos/freakins-logo.png", metric: "Avg. Reach", value: 100000, color: "#FF3E6C" },
  { creator_id: "creator_123", theme_id: "best_reach", theme_title: "Best Reach Brands", icon: "📈", tagline: "Maximize your reach!", brand_name: "Fugazee", logo_url: "https://www.fugazee.com/cdn/shop/files/Fugazee_Logo_Black.png", metric: "Avg. Reach", value: 85000, color: "#FF3E6C" },
  { creator_id: "creator_123", theme_id: "best_reach", theme_title: "Best Reach Brands", icon: "📈", tagline: "Maximize your reach!", brand_name: "Littlebox India", logo_url: "", metric: "Avg. Reach", value: 80000, color: "#FF3E6C" },
  
  // Fastest Selling
  { creator_id: "creator_123", theme_id: "fastest_selling", theme_title: "Fastest Selling Brands", icon: "⚡", tagline: "Turn views into sales!", brand_name: "Highlander", logo_url: "https://highlander-outdoor.com/skin/frontend/rwd/default/css/images/logo.png", metric: "Orders/Post", value: 2000, color: "#FFB84D" },
  { creator_id: "creator_123", theme_id: "fastest_selling", theme_title: "Fastest Selling Brands", icon: "⚡", tagline: "Turn views into sales!", brand_name: "Off Duty", logo_url: "https://www.theoffdutybrand.com/uploads/1/3/1/0/131098366/theoffdutybrand-logo-light-7_orig.png", metric: "Orders/Post", value: 1500, color: "#FFB84D" },
  { creator_id: "creator_123", theme_id: "fastest_selling", theme_title: "Fastest Selling Brands", icon: "⚡", tagline: "Turn views into sales!", brand_name: "Blissclub", logo_url: "/src/assets/logos/blissclub-logo.png", metric: "Orders/Post", value: 1000, color: "#FFB84D" },
  
  // Highest Commission
  { creator_id: "creator_123", theme_id: "highest_commission", theme_title: "Highest Commission Brands", icon: "💰", tagline: "Earn more per post!", brand_name: "Highlander", logo_url: "https://highlander-outdoor.com/skin/frontend/rwd/default/css/images/logo.png", metric: "Commission %", value: 25, color: "#FF6F3D" },
  { creator_id: "creator_123", theme_id: "highest_commission", theme_title: "Highest Commission Brands", icon: "💰", tagline: "Earn more per post!", brand_name: "Off Duty", logo_url: "https://www.theoffdutybrand.com/uploads/1/3/1/0/131098366/theoffdutybrand-logo-light-7_orig.png", metric: "Commission %", value: 20, color: "#FF6F3D" },
  { creator_id: "creator_123", theme_id: "highest_commission", theme_title: "Highest Commission Brands", icon: "💰", tagline: "Earn more per post!", brand_name: "Blissclub", logo_url: "/src/assets/logos/blissclub-logo.png", metric: "Commission %", value: 19, color: "#FF6F3D" },

  // Creator: 1111111111
  // Top Trending
  { creator_id: "1111111111", theme_id: "top_trending", theme_title: "Top Trending Brands", icon: "🏆", tagline: "Ride the trend wave!", brand_name: "Nike", logo_url: "https://logo.clearbit.com/nike.com", metric: "Trend Score", value: 92, color: "#FF6F3D" },
  { creator_id: "1111111111", theme_id: "top_trending", theme_title: "Top Trending Brands", icon: "🏆", tagline: "Ride the trend wave!", brand_name: "Adidas", logo_url: "https://logo.clearbit.com/adidas.com", metric: "Trend Score", value: 88, color: "#FF6F3D" },
  { creator_id: "1111111111", theme_id: "top_trending", theme_title: "Top Trending Brands", icon: "🏆", tagline: "Ride the trend wave!", brand_name: "Puma", logo_url: "https://logo.clearbit.com/puma.com", metric: "Trend Score", value: 75, color: "#FF6F3D" },
  
  // Best Reach
  { creator_id: "1111111111", theme_id: "best_reach", theme_title: "Best Reach Brands", icon: "📈", tagline: "Maximize your reach!", brand_name: "Apple", logo_url: "https://logo.clearbit.com/apple.com", metric: "Avg. Reach", value: 250000, color: "#FF3E6C" },
  { creator_id: "1111111111", theme_id: "best_reach", theme_title: "Best Reach Brands", icon: "📈", tagline: "Maximize your reach!", brand_name: "Samsung", logo_url: "https://logo.clearbit.com/samsung.com", metric: "Avg. Reach", value: 220000, color: "#FF3E6C" },
  { creator_id: "1111111111", theme_id: "best_reach", theme_title: "Best Reach Brands", icon: "📈", tagline: "Maximize your reach!", brand_name: "Sony", logo_url: "https://logo.clearbit.com/sony.com", metric: "Avg. Reach", value: 180000, color: "#FF3E6C" },
  
  // Fastest Selling
  { creator_id: "1111111111", theme_id: "fastest_selling", theme_title: "Fastest Selling Brands", icon: "⚡", tagline: "Turn views into sales!", brand_name: "Amazon Basics", logo_url: "https://logo.clearbit.com/amazon.com", metric: "Orders/Post", value: 5000, color: "#FFB84D" },
  { creator_id: "1111111111", theme_id: "fastest_selling", theme_title: "Fastest Selling Brands", icon: "⚡", tagline: "Turn views into sales!", brand_name: "Xiaomi", logo_url: "https://logo.clearbit.com/mi.com", metric: "Orders/Post", value: 4200, color: "#FFB84D" },
  { creator_id: "1111111111", theme_id: "fastest_selling", theme_title: "Fastest Selling Brands", icon: "⚡", tagline: "Turn views into sales!", brand_name: "OnePlus", logo_url: "https://logo.clearbit.com/oneplus.com", metric: "Orders/Post", value: 3800, color: "#FFB84D" },
  
  // Highest Commission
  { creator_id: "1111111111", theme_id: "highest_commission", theme_title: "Highest Commission Brands", icon: "💰", tagline: "Earn more per post!", brand_name: "Dyson", logo_url: "https://logo.clearbit.com/dyson.com", metric: "Commission %", value: 35, color: "#FF6F3D" },
  { creator_id: "1111111111", theme_id: "highest_commission", theme_title: "Highest Commission Brands", icon: "💰", tagline: "Earn more per post!", brand_name: "Apple", logo_url: "https://logo.clearbit.com/apple.com", metric: "Commission %", value: 28, color: "#FF6F3D" },
  { creator_id: "1111111111", theme_id: "highest_commission", theme_title: "Highest Commission Brands", icon: "💰", tagline: "Earn more per post!", brand_name: "Bose", logo_url: "https://logo.clearbit.com/bose.com", metric: "Commission %", value: 25, color: "#FF6F3D" },
];

export const useInsightsData = (creatorId: string) => {
  const [insights, setInsights] = useState<InsightRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { insights: csvInsights, hasInsightsData } = useCSVData();

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (hasInsightsData) {
          // Use CSV data if available
          const filteredData = csvInsights.filter(row => row.creator_id === creatorId);
          console.log('Filtered CSV data for creator:', creatorId, filteredData);
          setInsights(filteredData);
        } else {
          // Fallback to mock data
          const filteredData = mockInsightsData.filter(row => row.creator_id === creatorId);
          console.log('Filtered mock data for creator:', creatorId, filteredData);
          setInsights(filteredData);
        }
      } catch (err) {
        setError('Failed to load insights data');
        console.error('Error fetching insights:', err);
      } finally {
        setLoading(false);
      }
    };

    if (creatorId) {
      fetchInsights();
    }
  }, [creatorId, csvInsights, hasInsightsData]);

  // Group insights by theme and sort by value (descending)
  const getInsightsByTheme = (themeId: InsightRow['theme_id']) => {
    return insights
      .filter(insight => insight.theme_id === themeId)
      .sort((a, b) => b.value - a.value)
      .slice(0, 3); // Top 3 only
  };

  return {
    insights,
    loading,
    error,
    getInsightsByTheme,
    hasData: insights.length > 0
  };
};

export const useSurveySubmission = () => {
  const [submitting, setSubmitting] = useState(false);
  const { addSurveyResponse } = useCSVData();
  
  const submitSurvey = async (data: SurveyResponse) => {
    setSubmitting(true);
    try {
      // In a real implementation, this would post to Google Sheets API
      console.log('Survey submission:', data);
      
      // Add to CSV data context
      addSurveyResponse(data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { success: true };
    } catch (error) {
      console.error('Survey submission error:', error);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    submitSurvey,
    submitting
  };
};