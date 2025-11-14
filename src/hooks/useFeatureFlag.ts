import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useFeatureFlag = (flagKey: string): boolean => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFlag = async () => {
      try {
        const { data, error } = await supabase
          .from('feature_flags')
          .select('is_enabled')
          .eq('flag_key', flagKey)
          .maybeSingle();

        if (error) {
          console.error('Error fetching feature flag:', error);
          setIsEnabled(false);
        } else {
          setIsEnabled(data?.is_enabled ?? false);
        }
      } catch (error) {
        console.error('Error fetching feature flag:', error);
        setIsEnabled(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlag();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`feature_flag_${flagKey}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feature_flags',
          filter: `flag_key=eq.${flagKey}`,
        },
        (payload) => {
          if (payload.new && 'is_enabled' in payload.new) {
            setIsEnabled(payload.new.is_enabled as boolean);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [flagKey]);

  return isLoading ? false : isEnabled;
};
