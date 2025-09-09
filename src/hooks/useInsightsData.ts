import { useState, useEffect } from 'react';

// Types for our data structure
export interface InsightRow {
  creator_id: string;
  theme_id: 'top_trending' | 'best_reach' | 'fastest_selling' | 'highest_commission';
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
  // Top Trending
  { creator_id: "creator_123", theme_id: "top_trending", theme_title: "Top Trending Brands", icon: "🏆", tagline: "Ride the trend wave!", brand_name: "TechGear Pro", logo_url: "", metric: "Trend Score", value: 95, color: "#FF6F3D" },
  { creator_id: "creator_123", theme_id: "top_trending", theme_title: "Top Trending Brands", icon: "🏆", tagline: "Ride the trend wave!", brand_name: "Urban Style Co", logo_url: "", metric: "Trend Score", value: 87, color: "#FF6F3D" },
  { creator_id: "creator_123", theme_id: "top_trending", theme_title: "Top Trending Brands", icon: "🏆", tagline: "Ride the trend wave!", brand_name: "Fitness Elite", logo_url: "", metric: "Trend Score", value: 82, color: "#FF6F3D" },
  
  // Best Reach
  { creator_id: "creator_123", theme_id: "best_reach", theme_title: "Best Reach Brands", icon: "📈", tagline: "Maximize your reach!", brand_name: "Global Beauty", logo_url: "", metric: "Avg. Reach", value: 150000, color: "#FF3E6C" },
  { creator_id: "creator_123", theme_id: "best_reach", theme_title: "Best Reach Brands", icon: "📈", tagline: "Maximize your reach!", brand_name: "Travel Essentials", logo_url: "", metric: "Avg. Reach", value: 128000, color: "#FF3E6C" },
  { creator_id: "creator_123", theme_id: "best_reach", theme_title: "Best Reach Brands", icon: "📈", tagline: "Maximize your reach!", brand_name: "Home Comfort", logo_url: "", metric: "Avg. Reach", value: 95000, color: "#FF3E6C" },
  
  // Fastest Selling
  { creator_id: "creator_123", theme_id: "fastest_selling", theme_title: "Fastest Selling Brands", icon: "⚡", tagline: "Turn views into sales!", brand_name: "Quick Kitchen", logo_url: "", metric: "Orders/Post", value: 45, color: "#FFB84D" },
  { creator_id: "creator_123", theme_id: "fastest_selling", theme_title: "Fastest Selling Brands", icon: "⚡", tagline: "Turn views into sales!", brand_name: "Smart Gadgets", logo_url: "", metric: "Orders/Post", value: 38, color: "#FFB84D" },
  { creator_id: "creator_123", theme_id: "fastest_selling", theme_title: "Fastest Selling Brands", icon: "⚡", tagline: "Turn views into sales!", brand_name: "Pet Paradise", logo_url: "", metric: "Orders/Post", value: 29, color: "#FFB84D" },
  
  // Highest Commission
  { creator_id: "creator_123", theme_id: "highest_commission", theme_title: "Highest Commission Brands", icon: "💰", tagline: "Earn more per post!", brand_name: "Luxury Watches", logo_url: "", metric: "Commission %", value: 25, color: "#FF6F3D" },
  { creator_id: "creator_123", theme_id: "highest_commission", theme_title: "Highest Commission Brands", icon: "💰", tagline: "Earn more per post!", brand_name: "Premium Skincare", logo_url: "", metric: "Commission %", value: 18, color: "#FF6F3D" },
  { creator_id: "creator_123", theme_id: "highest_commission", theme_title: "Highest Commission Brands", icon: "💰", tagline: "Earn more per post!", brand_name: "Designer Bags", logo_url: "", metric: "Commission %", value: 15, color: "#FF6F3D" },
];

export const useInsightsData = (creatorId: string) => {
  const [insights, setInsights] = useState<InsightRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Filter mock data by creator_id
        const filteredData = mockInsightsData.filter(row => row.creator_id === creatorId);
        setInsights(filteredData);
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
  }, [creatorId]);

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
  
  const submitSurvey = async (data: SurveyResponse) => {
    setSubmitting(true);
    try {
      // In a real implementation, this would post to Google Sheets API
      console.log('Survey submission:', data);
      
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