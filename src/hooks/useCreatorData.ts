import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGATracking } from './useGATracking';

interface CreatorData {
  creator_id: number;
  name: string;
  brand_sourcing: boolean;
  gender: string | null;
}

/**
 * Shared hook for fetching creator data
 * Eliminates duplicate creator lookups across components
 */
export const useCreatorData = (creatorUuid: string | null) => {
  const [creatorData, setCreatorData] = useState<CreatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { trackError } = useGATracking();

  useEffect(() => {
    const fetchCreator = async () => {
      if (!creatorUuid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const { data, error: creatorError } = await supabase
          .from('creators')
          .select('creator_id, name, brand_sourcing, gender')
          .eq('uuid', creatorUuid)
          .single();

        if (creatorError) {
          console.error('Error fetching creator:', creatorError);
          trackError({
            action: 'api_error',
            error_message: 'Failed to fetch creator information',
            error_context: creatorError.message,
          });
          setError('Failed to fetch creator information');
          setLoading(false);
          return;
        }

        if (!data) {
          setError('Creator not found');
          setLoading(false);
          return;
        }

        setCreatorData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error in useCreatorData:', err);
        trackError({
          action: 'load_error',
          error_message: err instanceof Error ? err.message : 'An unexpected error occurred',
          error_context: 'useCreatorData hook',
        });
        setError('An unexpected error occurred');
        setLoading(false);
      }
    };

    fetchCreator();
  }, [creatorUuid, trackError]);

  return { creatorData, loading, error };
};
