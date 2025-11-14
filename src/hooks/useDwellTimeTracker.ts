import { useEffect, useRef, useState } from 'react';

interface UseDwellTimeTrackerProps {
  threshold: number; // milliseconds
  onThresholdReached: () => void;
  enabled?: boolean;
}

export const useDwellTimeTracker = ({
  threshold,
  onThresholdReached,
  enabled = true,
}: UseDwellTimeTrackerProps) => {
  const [hasReachedThreshold, setHasReachedThreshold] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityRef = useRef<boolean>(true);

  useEffect(() => {
    if (!enabled || hasReachedThreshold) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden, pause timer
        visibilityRef.current = false;
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      } else {
        // Tab visible, resume timer
        visibilityRef.current = true;
        if (startTimeRef.current && !hasReachedThreshold) {
          const elapsed = Date.now() - startTimeRef.current;
          const remaining = threshold - elapsed;
          
          if (remaining > 0) {
            timerRef.current = setTimeout(() => {
              setHasReachedThreshold(true);
              onThresholdReached();
            }, remaining);
          } else {
            setHasReachedThreshold(true);
            onThresholdReached();
          }
        }
      }
    };

    // Start tracking
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
      timerRef.current = setTimeout(() => {
        if (visibilityRef.current) {
          setHasReachedThreshold(true);
          onThresholdReached();
        }
      }, threshold);
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [enabled, threshold, onThresholdReached, hasReachedThreshold]);

  const reset = () => {
    setHasReachedThreshold(false);
    startTimeRef.current = null;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return { hasReachedThreshold, reset };
};
