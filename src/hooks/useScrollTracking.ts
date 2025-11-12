import { useEffect, useState, useCallback } from 'react';

interface ScrollState {
  currentDepth: number;
  maxDepth: number;
  milestonesReached: Set<number>;
}

/**
 * Global scroll tracking hook
 * Tracks current scroll depth and milestones (25%, 50%, 75%, 100%)
 */
export const useScrollTracking = (
  onMilestone?: (depth: number) => void
) => {
  const [scrollState, setScrollState] = useState<ScrollState>({
    currentDepth: 0,
    maxDepth: 0,
    milestonesReached: new Set(),
  });

  const calculateScrollDepth = useCallback(() => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    const scrollableHeight = documentHeight - windowHeight;
    const depth = scrollableHeight > 0 
      ? Math.round((scrollTop / scrollableHeight) * 100) 
      : 0;

    return Math.min(100, Math.max(0, depth));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentDepth = calculateScrollDepth();

      setScrollState(prev => {
        const newMaxDepth = Math.max(prev.maxDepth, currentDepth);
        const newMilestones = new Set(prev.milestonesReached);

        // Check milestones: 25%, 50%, 75%, 100%
        const milestones = [25, 50, 75, 100];
        milestones.forEach(milestone => {
          if (currentDepth >= milestone && !prev.milestonesReached.has(milestone)) {
            newMilestones.add(milestone);
            if (onMilestone) {
              onMilestone(milestone);
            }
          }
        });

        return {
          currentDepth,
          maxDepth: newMaxDepth,
          milestonesReached: newMilestones,
        };
      });
    };

    // Initial calculation
    handleScroll();

    // Throttled scroll listener (every 100ms)
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', throttledScroll);
    };
  }, [calculateScrollDepth, onMilestone]);

  return scrollState;
};
