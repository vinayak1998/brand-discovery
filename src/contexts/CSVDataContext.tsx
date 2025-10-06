import React, { createContext, useContext, useState, useEffect } from 'react';
import { InsightRow, SurveyResponse } from '@/utils/csvParser';

export type BrandLogosMap = Record<string, string>;

interface CSVDataContextType {
  insights: InsightRow[];
  surveys: SurveyResponse[];
  brandLogos: BrandLogosMap;
  setInsights: (data: InsightRow[]) => void;
  setSurveys: (data: SurveyResponse[]) => void;
  setBrandLogos: (data: BrandLogosMap) => void;
  addSurveyResponse: (response: SurveyResponse) => void;
  clearData: () => void;
  hasInsightsData: boolean;
  hasSurveyData: boolean;
  exportInsightsCSV: () => string;
  exportSurveysCSV: () => string;
  getLogoUrl: (brandName: string) => string;
}

const CSVDataContext = createContext<CSVDataContextType | undefined>(undefined);

const STORAGE_KEYS = {
  INSIGHTS: 'csv_insights_data',
  SURVEYS: 'csv_surveys_data',
  BRAND_LOGOS: 'csv_brand_logos_data'
};

export function CSVDataProvider({ children }: { children: React.ReactNode }) {
  const [insights, setInsightsState] = useState<InsightRow[]>([]);
  const [surveys, setSurveysState] = useState<SurveyResponse[]>([]);
  const [brandLogos, setBrandLogosState] = useState<BrandLogosMap>({});

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedInsights = localStorage.getItem(STORAGE_KEYS.INSIGHTS);
      const savedSurveys = localStorage.getItem(STORAGE_KEYS.SURVEYS);
      const savedBrandLogos = localStorage.getItem(STORAGE_KEYS.BRAND_LOGOS);

      if (savedInsights) {
        const parsedInsights = JSON.parse(savedInsights);
        setInsightsState(parsedInsights);
      }

      if (savedSurveys) {
        const parsedSurveys = JSON.parse(savedSurveys);
        setSurveysState(parsedSurveys);
      }

      if (savedBrandLogos) {
        const parsedBrandLogos = JSON.parse(savedBrandLogos);
        setBrandLogosState(parsedBrandLogos);
      }
    } catch (error) {
      console.error('Error loading CSV data from localStorage:', error);
    }
  }, []);

  // Save insights to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INSIGHTS, JSON.stringify(insights));
    } catch (error) {
      console.error('Error saving insights to localStorage:', error);
    }
  }, [insights]);

  // Save surveys to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SURVEYS, JSON.stringify(surveys));
    } catch (error) {
      console.error('Error saving surveys to localStorage:', error);
    }
  }, [surveys]);

  // Save brand logos to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BRAND_LOGOS, JSON.stringify(brandLogos));
    } catch (error) {
      console.error('Error saving brand logos to localStorage:', error);
    }
  }, [brandLogos]);

  const setInsights = (data: InsightRow[]) => {
    setInsightsState(data);
  };

  const setSurveys = (data: SurveyResponse[]) => {
    setSurveysState(data);
  };

  const setBrandLogos = (data: BrandLogosMap) => {
    setBrandLogosState(data);
  };

  const addSurveyResponse = (response: SurveyResponse) => {
    setSurveysState(prev => [...prev, response]);
  };

  const clearData = () => {
    setInsightsState([]);
    setSurveysState([]);
    setBrandLogosState({});
    localStorage.removeItem(STORAGE_KEYS.INSIGHTS);
    localStorage.removeItem(STORAGE_KEYS.SURVEYS);
    localStorage.removeItem(STORAGE_KEYS.BRAND_LOGOS);
  };

  const getLogoUrl = (brandName: string): string => {
    return brandLogos[brandName] || '';
  };

  const exportInsightsCSV = (): string => {
    if (insights.length === 0) return '';

    const headers = ['creator_id', 'brand_name', 'theme_id', 'metric', 'value'];

    const rows = insights.map(insight => [
      insight.creator_id,
      insight.brand_name,
      insight.theme_id,
      insight.metric,
      insight.value.toString()
    ]);

    return [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
  };

  const exportSurveysCSV = (): string => {
    if (surveys.length === 0) return '';

    const headers = ['timestamp', 'creator_id', 'q1_value_rating', 'q2_actionability', 'q3_themes', 'q4_missing_info', 'q5_barriers', 'q6_open_feedback'];

    const rows = surveys.map(survey => [
      survey.timestamp,
      survey.creator_id,
      survey.q1_value_rating.toString(),
      survey.q2_actionability,
      survey.q3_themes,
      survey.q4_missing_info,
      survey.q5_barriers || '',
      survey.q6_open_feedback || ''
    ]);

    return [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
  };

  const value: CSVDataContextType = {
    insights,
    surveys,
    brandLogos,
    setInsights,
    setSurveys,
    setBrandLogos,
    addSurveyResponse,
    clearData,
    hasInsightsData: insights.length > 0,
    hasSurveyData: surveys.length > 0,
    exportInsightsCSV,
    exportSurveysCSV,
    getLogoUrl
  };

  return (
    <CSVDataContext.Provider value={value}>
      {children}
    </CSVDataContext.Provider>
  );
}

export function useCSVData() {
  const context = useContext(CSVDataContext);
  if (context === undefined) {
    throw new Error('useCSVData must be used within a CSVDataProvider');
  }
  return context;
}