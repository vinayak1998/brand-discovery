import { useState, useEffect } from 'react';
import { useCSVData } from '@/contexts/CSVDataContext';
import { InsightRow as CSVInsightRow } from '@/utils/csvParser';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useCreatorData } from './useCreatorData';

// Types for our data structure - extending CSV types for backward compatibility
export interface InsightRow {
  creator_id: number;
  theme_id: string;
  brand_name: string;
  logo_url?: string;
  value: number;
  website_url?: string;
  brand_id?: number;
  sourcing_link?: string;
}

export interface SurveyResponse {
  timestamp: string;
  creator_id: string;
  q1_value_rating: number;
  q2_actionability: string;
  q3_themes: string;
  q4_missing_info: string;
  q5_barriers?: string;
  q6_open_feedback?: string;
}

// Mock data for demonstration
const mockInsightsData: InsightRow[] = [
  // Creator: 1001
  // Top Trending
  { creator_id: 1001, theme_id: "top_trending", brand_name: "TechCorp", logo_url: "https://example.com/techcorp-logo.png", value: 95 },
  { creator_id: 1001, theme_id: "top_trending", brand_name: "FashionHub", logo_url: "https://example.com/fashionhub-logo.png", value: 88 },
  { creator_id: 1001, theme_id: "top_trending", brand_name: "FoodieWorld", logo_url: "https://example.com/foodieworld-logo.png", value: 75 },
  
  // Best Reach
  { creator_id: 1001, theme_id: "best_reach", brand_name: "TechCorp", logo_url: "https://example.com/techcorp-logo.png", value: 250000 },
  { creator_id: 1001, theme_id: "best_reach", brand_name: "FashionHub", logo_url: "https://example.com/fashionhub-logo.png", value: 220000 },
  { creator_id: 1001, theme_id: "best_reach", brand_name: "FoodieWorld", logo_url: "https://example.com/foodieworld-logo.png", value: 180000 },
];

export const useInsightsData = (creatorUuid: string) => {
  const [insights, setInsights] = useState<InsightRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const { insights: csvInsights, hasInsightsData } = useCSVData();
  
  // Use shared creator data hook
  const { creatorData, loading: creatorLoading } = useCreatorData(creatorUuid);

  useEffect(() => {
    const fetchInsights = async () => {
      // Wait for creator data to load
      if (creatorLoading || !creatorData) {
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Use the edge function for better reliability
        const { data, error: functionError } = await supabase.functions.invoke('get-creator-insights', {
          body: { creator_uuid: creatorUuid }
        });

        if (functionError) {
          console.error('Error calling edge function:', functionError);
          throw functionError;
        }

        if (!data || !data.insights || data.insights.length === 0) {
          console.log('No insights found, trying fallback data');
          // Try CSV or mock data as fallback
          if (hasInsightsData) {
            const filteredData = csvInsights.filter(row => row.creator_id === creatorData.creator_id).map(row => ({
              ...row,
              brand_name: '',
              logo_url: '',
              website_url: ''
            }));
            setInsights(filteredData as any);
          } else {
            // Fallback to mock data
            const filteredData = mockInsightsData.filter(row => row.creator_id === creatorData.creator_id);
            setInsights(filteredData);
          }
          setLoading(false);
          return;
        }

        // Transform edge function response to InsightRow format
        const transformedData: InsightRow[] = data.insights.map((insight: any) => ({
          creator_id: insight.creator_id || 0,
          theme_id: insight.theme_id,
          brand_name: insight.brands?.brand_name || '',
          logo_url: insight.brands?.logo_url,
          value: insight.value,
          website_url: insight.brands?.website_url,
          brand_id: insight.brands?.brand_id,
          sourcing_link: insight.brands?.sourcing_link
        }));

        // Set last updated to today for now (edge function doesn't return this)
        setLastUpdated(format(new Date(), 'MMMM d, yyyy'));
        
        console.log('Fetched data from edge function for creator UUID:', creatorUuid, transformedData);
        setInsights(transformedData);
      } catch (err) {
        console.error('Error fetching insights:', err);
        
        // Try fallback data on error
        if (hasInsightsData && creatorData) {
          const filteredData = csvInsights.filter(row => row.creator_id === creatorData.creator_id).map(row => ({
            ...row,
            brand_name: '',
            logo_url: '',
            website_url: ''
          }));
          setInsights(filteredData as any);
          setLoading(false);
          return;
        }
        
        // If all else fails, use mock data
        if (creatorData) {
          const filteredData = mockInsightsData.filter(row => row.creator_id === creatorData.creator_id);
          if (filteredData.length > 0) {
            setInsights(filteredData);
            setLoading(false);
            return;
          }
        }
        
        setError('Failed to load insights data');
      } finally {
        setLoading(false);
      }
    };

    if (creatorUuid && !creatorLoading) {
      fetchInsights();
    }
  }, [creatorUuid, creatorData, creatorLoading, csvInsights, hasInsightsData]);

  // Group insights by theme and sort by value (descending)
  const getInsightsByTheme = (themeId: InsightRow['theme_id']) => {
    return insights
      .filter(insight => insight.theme_id === themeId)
      .sort((a, b) => b.value - a.value)
      .slice(0, 3); // Top 3 only
  };

  return {
    insights,
    loading: loading || creatorLoading,
    error,
    getInsightsByTheme,
    hasData: insights.length > 0,
    lastUpdated,
    creatorName: creatorData?.name || null,
    creatorIdNum: creatorData?.creator_id || null
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