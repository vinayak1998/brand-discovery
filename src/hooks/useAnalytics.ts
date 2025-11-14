import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type EventType = 
  | 'page_view'
  | 'theme_view'
  | 'brand_click'
  | 'brand_website_click'
  | 'cta_click'
  | 'survey_start'
  | 'survey_submit'
  | 'session_start'
  | 'session_end';

export type ThemeId = 'top_trending' | 'best_reach' | 'fastest_selling';

interface TrackEventParams {
  eventType: EventType;
  themeId?: ThemeId;
  brandId?: number;
  metadata?: Record<string, any>;
}

interface AnalyticsEvent extends TrackEventParams {
  creatorId: number;
  timestamp: string;
}

/**
 * Modular analytics hook for tracking creator engagement
 * Designed to be easily swappable with Google Analytics or other providers
 */
export const useAnalytics = (creatorId: number | null) => {
  const eventQueueRef = useRef<AnalyticsEvent[]>([]);
  const flushTimeoutRef = useRef<NodeJS.Timeout>();
  const sessionStartedRef = useRef(false);

  // Flush events to backend
  const flushEvents = useCallback(async () => {
    if (eventQueueRef.current.length === 0 || !creatorId) return;

    const events = [...eventQueueRef.current];
    eventQueueRef.current = [];

    try {
      const { error } = await supabase.functions.invoke('track-engagement', {
        body: events.map(e => ({
          creator_id: e.creatorId,
          event_type: e.eventType,
          theme_id: e.themeId,
          brand_id: e.brandId,
          metadata: e.metadata || {},
        }))
      });

      if (error) {
        console.error('Failed to track events:', error);
        // Re-queue failed events
        eventQueueRef.current.unshift(...events);
      }
    } catch (error) {
      console.error('Analytics tracking error:', error);
      eventQueueRef.current.unshift(...events);
    }
  }, [creatorId]);

  // Track event (with batching)
  const trackEvent = useCallback(({ eventType, themeId, brandId, metadata }: TrackEventParams) => {
    if (!creatorId) return;

    const event: AnalyticsEvent = {
      creatorId,
      eventType,
      themeId,
      brandId,
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      },
      timestamp: new Date().toISOString(),
    };

    eventQueueRef.current.push(event);

    // Debounce flush - batch events together
    if (flushTimeoutRef.current) {
      clearTimeout(flushTimeoutRef.current);
    }
    flushTimeoutRef.current = setTimeout(flushEvents, 2000);
  }, [creatorId, flushEvents]);

  // Track page view
  const trackPageView = useCallback(() => {
    trackEvent({ eventType: 'page_view' });
  }, [trackEvent]);

  // Track theme view
  const trackThemeView = useCallback((themeId: ThemeId) => {
    trackEvent({ eventType: 'theme_view', themeId });
  }, [trackEvent]);

  // Track brand click
  const trackBrandClick = useCallback((brandId: number, themeId?: ThemeId) => {
    trackEvent({ eventType: 'brand_click', brandId, themeId });
  }, [trackEvent]);

  // Track brand website click
  const trackBrandWebsiteClick = useCallback((brandId: number, themeId?: ThemeId) => {
    trackEvent({ eventType: 'brand_website_click', brandId, themeId });
  }, [trackEvent]);

  // Track CTA click
  const trackCTAClick = useCallback(() => {
    trackEvent({ eventType: 'cta_click' });
  }, [trackEvent]);

  // Track survey start
  const trackSurveyStart = useCallback(() => {
    trackEvent({ eventType: 'survey_start' });
  }, [trackEvent]);

  // Track survey submit
  const trackSurveySubmit = useCallback(() => {
    trackEvent({ eventType: 'survey_submit' });
  }, [trackEvent]);

  // Track quick survey shown
  const trackQuickSurveyShown = useCallback((surveyId: string, context?: Record<string, any>) => {
    trackEvent({ 
      eventType: 'page_view', // Reusing event type for now
      metadata: { 
        survey_event: 'survey_shown',
        survey_id: surveyId,
        ...context 
      } 
    });
  }, [trackEvent]);

  // Track quick survey response
  const trackQuickSurveyResponse = useCallback((surveyId: string, questionId: string, answer: any) => {
    trackEvent({ 
      eventType: 'page_view', // Reusing event type for now
      metadata: { 
        survey_event: 'survey_response',
        survey_id: surveyId,
        question_id: questionId,
        answer 
      } 
    });
  }, [trackEvent]);

  // Track quick survey submit
  const trackQuickSurveySubmit = useCallback((surveyId: string, questionCount: number, timeToComplete: number) => {
    trackEvent({ 
      eventType: 'page_view', // Reusing event type for now
      metadata: { 
        survey_event: 'survey_submit',
        survey_id: surveyId,
        question_count: questionCount,
        time_to_complete_ms: timeToComplete 
      } 
    });
  }, [trackEvent]);

  // Track quick survey dismissed
  const trackQuickSurveyDismissed = useCallback((surveyId: string, context?: Record<string, any>) => {
    trackEvent({ 
      eventType: 'page_view', // Reusing event type for now
      metadata: { 
        survey_event: 'survey_dismissed',
        survey_id: surveyId,
        ...context 
      } 
    });
  }, [trackEvent]);

  // Session management
  useEffect(() => {
    if (!creatorId || sessionStartedRef.current) return;

    // Track session start
    trackEvent({ eventType: 'session_start' });
    sessionStartedRef.current = true;

    // Track session end on unmount or page unload
    const handleSessionEnd = () => {
      trackEvent({ eventType: 'session_end' });
      flushEvents();
    };

    window.addEventListener('beforeunload', handleSessionEnd);

    return () => {
      handleSessionEnd();
      window.removeEventListener('beforeunload', handleSessionEnd);
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
      }
    };
  }, [creatorId, trackEvent, flushEvents]);

  // Periodic flush
  useEffect(() => {
    const interval = setInterval(flushEvents, 10000); // Flush every 10 seconds
    return () => clearInterval(interval);
  }, [flushEvents]);

  return {
    trackPageView,
    trackThemeView,
    trackBrandClick,
    trackBrandWebsiteClick,
    trackCTAClick,
    trackSurveyStart,
    trackSurveySubmit,
    trackQuickSurveyShown,
    trackQuickSurveyResponse,
    trackQuickSurveySubmit,
    trackQuickSurveyDismissed,
  };
};