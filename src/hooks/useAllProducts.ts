import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProductWithBrand {
  id: number;
  name: string;
  brand: string;
  brand_id: number | null;
  thumbnail_url: string | null;
  purchase_url: string | null;
  sim_score: number;
  short_code: string | null;
  price: number | null;
  category: string | null;
  subcategory: string | null;
  logo_url: string | null;
  theme_id: string | null;
}

export const useAllProducts = (creatorUuid: string | null) => {
  const [products, setProducts] = useState<ProductWithBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatorNumericId, setCreatorNumericId] = useState<number | null>(null);

  useEffect(() => {
    const fetchAllProducts = async () => {
      if (!creatorUuid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get creator's numeric ID
        const { data: creatorData, error: creatorError } = await supabase
          .from('creators')
          .select('creator_id')
          .eq('uuid', creatorUuid)
          .single();

        if (creatorError) throw creatorError;
        if (!creatorData) throw new Error('Creator not found');
        
        setCreatorNumericId(creatorData.creator_id);

        // Fetch all products for this creator with brand info and theme
        const { data, error: productsError } = await supabase
          .from('creator_x_product_recommendations')
          .select(`
            id, 
            name, 
            brand, 
            brand_id,
            thumbnail_url, 
            purchase_url, 
            sim_score, 
            short_code, 
            price,
            category,
            subcategory
          `)
          .eq('creator_id', creatorData.creator_id)
          .order('sim_score', { ascending: false });

        if (productsError) throw productsError;

        // For each product, get brand logo and theme
        const productsWithBrandInfo = await Promise.all(
          (data || []).map(async (product) => {
            let logo_url = null;
            let theme_id = null;

            if (product.brand_id) {
              // Get brand logo
              const { data: brandData } = await supabase
                .from('brands')
                .select('logo_url')
                .eq('brand_id', product.brand_id)
                .maybeSingle();

              logo_url = brandData?.logo_url || null;

              // Get theme for this brand
              const { data: insightData } = await supabase
                .from('creator_brand_insights')
                .select('theme_id')
                .eq('creator_id', creatorData.creator_id)
                .eq('brand_id', product.brand_id)
                .maybeSingle();

              theme_id = insightData?.theme_id || null;
            }

            return {
              ...product,
              logo_url,
              theme_id,
            };
          })
        );

        setProducts(productsWithBrandInfo);
      } catch (err) {
        console.error('Error fetching all products:', err);
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchAllProducts();
  }, [creatorUuid]);

  return { products, loading, error, creatorNumericId };
};
