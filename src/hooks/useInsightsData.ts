import { useState, useEffect } from 'react';
import { useCSVData } from '@/contexts/CSVDataContext';
import { InsightRow as CSVInsightRow } from '@/utils/csvParser';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

// Types for our data structure - extending CSV types for backward compatibility
export interface InsightRow {
  creator_id: number;
  theme_id: string;
  brand_name: string;
  logo_url?: string;
  value: number;
  website_url?: string;
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
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const { insights: csvInsights, hasInsightsData } = useCSVData();

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // First, look up the creator by UUID to get the internal creator_id
        const { data: creatorData, error: creatorError } = await supabase
          .from('creators')
          .select('creator_id, uuid, name')
          .eq('uuid', creatorUuid)
          .maybeSingle();

        if (creatorError) {
          console.error('Error fetching creator:', creatorError);
          throw creatorError;
        }

        if (!creatorData) {
          console.log('Creator not found, trying fallback data');
          // Try CSV or mock data as fallback
          if (hasInsightsData) {
            const creatorIdNum = parseInt(creatorUuid);
            if (!isNaN(creatorIdNum)) {
              const filteredData = csvInsights.filter(row => row.creator_id === creatorIdNum).map(row => ({
                ...row,
                brand_name: '',
                logo_url: '',
                website_url: ''
              }));
              setInsights(filteredData as any);
            }
          }
          setLoading(false);
          return;
        }

        const creator_id = creatorData.creator_id;
        setCreatorName(creatorData.name);
        console.log('Found creator_id:', creator_id, 'for UUID:', creatorUuid);

        // Now fetch insights using the creator_id
        const { data: dbInsights, error: dbError } = await supabase
          .from('creator_brand_insights')
          .select(`
            creator_id,
            theme_id,
            value,
            updated_at,
            brands (
              brand_name,
              logo_url,
              website_url
            )
          `)
          .eq('creator_id', creator_id);

        if (dbError) {
          console.error('Error fetching from Supabase:', dbError);
          throw dbError;
        }

        if (dbInsights && dbInsights.length > 0) {
          // Transform Supabase data to InsightRow format
          const transformedData: InsightRow[] = dbInsights.map(insight => ({
            creator_id: insight.creator_id,
            theme_id: insight.theme_id,
            brand_name: (insight.brands as any)?.brand_name || '',
            logo_url: (insight.brands as any)?.logo_url,
            value: insight.value,
            website_url: (insight.brands as any)?.website_url
          }));
          
          // Get the most recent updated_at timestamp
          const latestUpdate = dbInsights.reduce((latest, insight) => {
            const currentDate = new Date(insight.updated_at);
            return currentDate > latest ? currentDate : latest;
          }, new Date(0));
          
          setLastUpdated(format(latestUpdate, 'MMMM d, yyyy'));
          console.log('Fetched data from Supabase for creator UUID:', creatorUuid, transformedData);
          setInsights(transformedData);
        } else if (hasInsightsData) {
          // Use CSV data if available
          const creatorIdNum = parseInt(creatorUuid);
          if (!isNaN(creatorIdNum)) {
            const filteredData = csvInsights.filter(row => row.creator_id === creatorIdNum).map(row => ({
              ...row,
              brand_name: '',
              logo_url: '',
              website_url: ''
            }));
            console.log('Filtered CSV data for creator:', creatorUuid, filteredData);
            setInsights(filteredData as any);
          }
        } else {
          // Fallback to mock data
          const creatorIdNum = parseInt(creatorUuid);
          if (!isNaN(creatorIdNum)) {
            const filteredData = mockInsightsData.filter(row => row.creator_id === creatorIdNum);
            console.log('Filtered mock data for creator:', creatorUuid, filteredData);
            setInsights(filteredData);
          }
        }
      } catch (err) {
        setError('Failed to load insights data');
        console.error('Error fetching insights:', err);
      } finally {
        setLoading(false);
      }
    };

    if (creatorUuid) {
      fetchInsights();
    }
  }, [creatorUuid, csvInsights, hasInsightsData]);

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
    hasData: insights.length > 0,
    lastUpdated,
    creatorName
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