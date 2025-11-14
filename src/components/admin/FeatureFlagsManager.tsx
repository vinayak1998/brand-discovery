import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Flag } from 'lucide-react';

interface FeatureFlag {
  id: string;
  flag_key: string;
  flag_name: string;
  description: string | null;
  is_enabled: boolean;
}

export const FeatureFlagsManager = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('flag_name');

      if (error) throw error;
      setFlags(data || []);
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      toast({
        title: 'Error',
        description: 'Failed to load feature flags',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (flagId: string, currentValue: boolean) => {
    setUpdating(flagId);
    try {
      const { error } = await supabase
        .from('feature_flags')
        .update({ is_enabled: !currentValue })
        .eq('id', flagId);

      if (error) throw error;

      setFlags(flags.map(flag => 
        flag.id === flagId ? { ...flag, is_enabled: !currentValue } : flag
      ));

      toast({
        title: 'Success',
        description: 'Feature flag updated',
      });
    } catch (error) {
      console.error('Error updating feature flag:', error);
      toast({
        title: 'Error',
        description: 'Failed to update feature flag',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Feature Flags
          </CardTitle>
          <CardDescription>Loading feature flags...</CardDescription>
        </CardHeader>
        <CardContent>
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="h-5 w-5" />
          Feature Flags
        </CardTitle>
        <CardDescription>
          Enable or disable features across the application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {flags.length === 0 ? (
          <p className="text-sm text-muted-foreground">No feature flags configured</p>
        ) : (
          flags.map((flag) => (
            <div
              key={flag.id}
              className="flex items-center justify-between space-x-4 rounded-lg border p-4"
            >
              <div className="flex-1 space-y-1">
                <Label
                  htmlFor={flag.flag_key}
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  {flag.flag_name}
                </Label>
                {flag.description && (
                  <p className="text-sm text-muted-foreground">
                    {flag.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {updating === flag.id && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                <Switch
                  id={flag.flag_key}
                  checked={flag.is_enabled}
                  onCheckedChange={() => toggleFlag(flag.id, flag.is_enabled)}
                  disabled={updating === flag.id}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
