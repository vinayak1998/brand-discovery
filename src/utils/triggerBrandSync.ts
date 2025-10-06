import { supabase } from "@/integrations/supabase/client";

export const triggerBrandSync = async () => {
  const { data, error } = await supabase.functions.invoke('sync-redash-brands');
  
  if (error) {
    console.error('Error syncing brands:', error);
    throw error;
  }
  
  return data;
};
