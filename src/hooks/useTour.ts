import { useState, useEffect } from 'react';

const TOUR_COMPLETED_KEY = 'onboarding_tour_completed';

export const useTour = () => {
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedTour, setHasCompletedTour] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(TOUR_COMPLETED_KEY);
    setHasCompletedTour(completed === 'true');
    
    // Auto-start tour for first-time users after a brief delay
    if (!completed) {
      const timer = setTimeout(() => {
        setIsTourActive(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const startTour = () => {
    setCurrentStep(0);
    setIsTourActive(true);
  };

  const nextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const previousStep = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const skipTour = () => {
    setIsTourActive(false);
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
    setHasCompletedTour(true);
  };

  const completeTour = () => {
    setIsTourActive(false);
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
    setHasCompletedTour(true);
  };

  const resetTour = () => {
    localStorage.removeItem(TOUR_COMPLETED_KEY);
    setHasCompletedTour(false);
    startTour();
  };

  return {
    isTourActive,
    currentStep,
    hasCompletedTour,
    startTour,
    nextStep,
    previousStep,
    skipTour,
    completeTour,
    resetTour,
  };
};
