import { useEffect, useRef, useState } from 'react';

interface UseProductScrollTrackerProps {
  threshold: number; // number of products
  onThresholdReached: () => void;
  enabled?: boolean;
}

export const useProductScrollTracker = ({
  threshold,
  onThresholdReached,
  enabled = true,
}: UseProductScrollTrackerProps) => {
  const [productsViewed, setProductsViewed] = useState(0);
  const [hasReachedThreshold, setHasReachedThreshold] = useState(false);
  const observedProductsRef = useRef<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!enabled || hasReachedThreshold) return;

    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const productId = entry.target.getAttribute('data-product-id');
            if (productId && !observedProductsRef.current.has(productId)) {
              observedProductsRef.current.add(productId);
              const newCount = observedProductsRef.current.size;
              setProductsViewed(newCount);

              if (newCount >= threshold && !hasReachedThreshold) {
                setHasReachedThreshold(true);
                onThresholdReached();
              }
            }
          }
        });
      },
      {
        threshold: 0.5, // 50% of product card visible
        rootMargin: '0px',
      }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [enabled, threshold, onThresholdReached, hasReachedThreshold]);

  const observeProduct = (element: HTMLElement | null) => {
    if (element && observerRef.current && !hasReachedThreshold) {
      observerRef.current.observe(element);
    }
  };

  const reset = () => {
    setProductsViewed(0);
    setHasReachedThreshold(false);
    observedProductsRef.current.clear();
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
  };

  return { productsViewed, hasReachedThreshold, observeProduct, reset };
};
