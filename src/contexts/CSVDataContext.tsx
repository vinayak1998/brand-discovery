import React, { createContext, useContext, useState, useEffect } from 'react';
import { InsightRow, SurveyResponse } from '@/utils/csvParser';

interface CSVDataContextType {
  insights: InsightRow[];
  surveys: SurveyResponse[];
  setInsights: (data: InsightRow[]) => void;
  setSurveys: (data: SurveyResponse[]) => void;
  addSurveyResponse: (response: SurveyResponse) => void;
  clearData: () => void;
  hasInsightsData: boolean;
  hasSurveyData: boolean;
  exportInsightsCSV: () => string;
  exportSurveysCSV: () => string;
}

const CSVDataContext = createContext<CSVDataContextType | undefined>(undefined);

const STORAGE_KEYS = {
  INSIGHTS: 'csv_insights_data',
  SURVEYS: 'csv_surveys_data'
};

export function CSVDataProvider({ children }: { children: React.ReactNode }) {
  const [insights, setInsightsState] = useState<InsightRow[]>([]);
  const [surveys, setSurveysState] = useState<SurveyResponse[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedInsights = localStorage.getItem(STORAGE_KEYS.INSIGHTS);
      const savedSurveys = localStorage.getItem(STORAGE_KEYS.SURVEYS);

      if (savedInsights) {
        const parsedInsights = JSON.parse(savedInsights);
        setInsightsState(parsedInsights);
      }

      if (savedSurveys) {
        const parsedSurveys = JSON.parse(savedSurveys);
        setSurveysState(parsedSurveys);
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

  const setInsights = (data: InsightRow[]) => {
    setInsightsState(data);
  };

  const setSurveys = (data: SurveyResponse[]) => {
    setSurveysState(data);
  };

  const addSurveyResponse = (response: SurveyResponse) => {
    setSurveysState(prev => [...prev, response]);
  };

  const clearData = () => {
    setInsightsState([]);
    setSurveysState([]);
    localStorage.removeItem(STORAGE_KEYS.INSIGHTS);
    localStorage.removeItem(STORAGE_KEYS.SURVEYS);
  };

  const exportInsightsCSV = (): string => {
    if (insights.length === 0) return '';

    const headers = [
      'creator_id', 'theme_id', 'theme_title', 'icon', 'tagline',
      'color', 'brand_name', 'logo_url', 'metric', 'value'
    ];

    const rows = insights.map(insight => [
      insight.creator_id,
      insight.theme_id,
      insight.theme_title,
      insight.icon,
      insight.tagline,
      insight.color,
      insight.brand_name,
      insight.logo_url,
      insight.metric,
      insight.value.toString()
    ]);

    return [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
  };

  const exportSurveysCSV = (): string => {
    if (surveys.length === 0) return '';

    const headers = ['timestamp', 'creator_id', 'q1_useful', 'q2_intent', 'q3_themes'];

    const rows = surveys.map(survey => [
      survey.timestamp,
      survey.creator_id,
      survey.q1_useful,
      survey.q2_intent,
      survey.q3_themes
    ]);

    return [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
  };

  const value: CSVDataContextType = {
    insights,
    surveys,
    setInsights,
    setSurveys,
    addSurveyResponse,
    clearData,
    hasInsightsData: insights.length > 0,
    hasSurveyData: surveys.length > 0,
    exportInsightsCSV,
    exportSurveysCSV
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