import { useEffect, useState, useCallback } from 'react';

const SESSION_KEY = 'onboarding_tooltip_shown';
const TRIGGER_DELAY = 7000; // 7 seconds

/**
 * Hook to manage onboarding tooltip that appears after scrolling without clicking
 * Shows once per session after 7 seconds of scroll activity without brand clicks
 */
export const useOnboardingTooltip = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);

  // Check if tooltip was already shown this session
  useEffect(() => {
    const alreadyShown = sessionStorage.getItem(SESSION_KEY);
    if (alreadyShown === 'true') {
      setHasDismissed(true);
    }
  }, []);

  // Track scroll events
  useEffect(() => {
    if (hasDismissed) return;

    const handleScroll = () => {
      setHasScrolled(true);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasDismissed]);

  // Trigger tooltip after delay if user scrolled but didn't click
  useEffect(() => {
    if (!hasScrolled || hasDismissed || showTooltip) return;

    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, TRIGGER_DELAY);

    return () => clearTimeout(timer);
  }, [hasScrolled, hasDismissed, showTooltip]);

  // Handle brand click - hide tooltip and mark as dismissed
  const onBrandClick = useCallback(() => {
    if (showTooltip) {
      setShowTooltip(false);
    }
    setHasDismissed(true);
    sessionStorage.setItem(SESSION_KEY, 'true');
  }, [showTooltip]);

  // Handle explicit dismiss
  const dismissTooltip = useCallback(() => {
    setShowTooltip(false);
    setHasDismissed(true);
    sessionStorage.setItem(SESSION_KEY, 'true');
  }, []);

  return {
    showTooltip,
    onBrandClick,
    dismissTooltip,
  };
};
