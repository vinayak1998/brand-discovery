import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SurveyId = 'discovery' | 'intent' | 'outcome' | 'tile_ranker';

interface UseQuickSurveyProps {
  creatorId: number | null;
  surveyId: SurveyId;
  onShown?: () => void;
  onDismissed?: () => void;
  onSubmitted?: () => void;
}

export const useQuickSurvey = ({
  creatorId,
  surveyId,
  onShown,
  onDismissed,
  onSubmitted,
}: UseQuickSurveyProps) => {
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const shownTimeRef = useRef<number | null>(null);

  // Check eligibility
  const checkEligibility = useCallback(async () => {
    if (!creatorId) {
      setIsEligible(false);
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-survey-eligibility', {
        body: { creator_id: creatorId, survey_id: surveyId },
      });

      if (error) throw error;

      const eligible = data?.eligible || false;
      setIsEligible(eligible);
      return eligible;
    } catch (error) {
      console.error('Error checking survey eligibility:', error);
      setIsEligible(false);
      return false;
    }
  }, [creatorId, surveyId]);

  // Show survey
  const showSurvey = useCallback(async () => {
    const eligible = await checkEligibility();
    if (eligible) {
      setIsVisible(true);
      shownTimeRef.current = Date.now();
      onShown?.();
    }
  }, [checkEligibility, onShown]);

  // Dismiss survey
  const dismissSurvey = useCallback(() => {
    setIsVisible(false);
    shownTimeRef.current = null;
    onDismissed?.();
  }, [onDismissed]);

  // Submit survey
  const submitSurvey = useCallback(
    async (questions: Record<string, any>, context?: Record<string, any>) => {
      if (!creatorId) return false;

      setIsSubmitting(true);
      try {
        const timeToComplete = shownTimeRef.current
          ? Date.now() - shownTimeRef.current
          : undefined;

        const { error } = await supabase.functions.invoke('submit-quick-survey', {
          body: {
            creator_id: creatorId,
            survey_id: surveyId,
            context: context || {},
            questions,
            time_to_complete_ms: timeToComplete,
          },
        });

        if (error) throw error;

        setIsVisible(false);
        shownTimeRef.current = null;
        onSubmitted?.();
        return true;
      } catch (error) {
        console.error('Error submitting survey:', error);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [creatorId, surveyId, onSubmitted]
  );

  return {
    isEligible,
    isVisible,
    isSubmitting,
    showSurvey,
    dismissSurvey,
    submitSurvey,
  };
};
