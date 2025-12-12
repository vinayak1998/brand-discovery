import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseWishlistReturn {
  wishlistedProducts: Set<number>;
  isWishlisted: (productId: number) => boolean;
  toggleWishlist: (productId: number) => Promise<void>;
  loading: boolean;
}

export const useWishlist = (creatorId: number | null): UseWishlistReturn => {
  const [wishlistedProducts, setWishlistedProducts] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  // Fetch wishlisted products on mount
  useEffect(() => {
    const fetchWishlist = async () => {
      if (!creatorId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('creator_wishlisted_products')
          .select('product_id')
          .eq('creator_id', creatorId);

        if (error) {
          console.error('Error fetching wishlist:', error);
        } else if (data) {
          setWishlistedProducts(new Set(data.map(item => item.product_id)));
        }
      } catch (err) {
        console.error('Error fetching wishlist:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [creatorId]);

  const isWishlisted = useCallback((productId: number): boolean => {
    return wishlistedProducts.has(productId);
  }, [wishlistedProducts]);

  const toggleWishlist = useCallback(async (productId: number): Promise<void> => {
    if (!creatorId) return;

    const isCurrentlyWishlisted = wishlistedProducts.has(productId);

    // Optimistic update
    setWishlistedProducts(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyWishlisted) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });

    try {
      if (isCurrentlyWishlisted) {
        // Remove from wishlist
        const { error } = await supabase
          .from('creator_wishlisted_products')
          .delete()
          .eq('creator_id', creatorId)
          .eq('product_id', productId);

        if (error) throw error;
      } else {
        // Add to wishlist
        const { error } = await supabase
          .from('creator_wishlisted_products')
          .insert({
            creator_id: creatorId,
            product_id: productId,
          });

        if (error) throw error;
      }
    } catch (err) {
      // Revert optimistic update on error
      console.error('Error toggling wishlist:', err);
      setWishlistedProducts(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyWishlisted) {
          newSet.add(productId);
        } else {
          newSet.delete(productId);
        }
        return newSet;
      });
    }
  }, [creatorId, wishlistedProducts]);

  return {
    wishlistedProducts,
    isWishlisted,
    toggleWishlist,
    loading,
  };
};
