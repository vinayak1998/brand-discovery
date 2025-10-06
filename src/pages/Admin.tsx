import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { parseInsightsCSV, parseCreatorsCSV, parseBrandsCSV } from "@/utils/csvParser";
import { Upload, Database, Users, Building2 } from "lucide-react";
import wishLinkLogo from "@/assets/wishlink-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const AdminContent = () => {
  const [creatorsCSV, setCreatorsCSV] = useState("");
  const [brandsCSV, setBrandsCSV] = useState("");
  const [insightsCSV, setInsightsCSV] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreatorsUpload = async () => {
    if (!creatorsCSV.trim()) {
      toast({
        title: "No data provided",
        description: "Please paste the creators CSV data",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, errors } = parseCreatorsCSV(creatorsCSV);
      
      if (errors.length > 0) {
        toast({
          title: "CSV Parse Errors",
          description: errors.join(", "),
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { data: result, error } = await supabase.functions.invoke('admin-bulk-upload', {
        body: {
          csvType: 'creators',
          csvData: data
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success!",
        description: `Created: ${result.created}, Errors: ${result.errors}`,
      });
      setCreatorsCSV("");
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBrandsUpload = async () => {
    if (!brandsCSV.trim()) {
      toast({
        title: "No data provided",
        description: "Please paste the brands CSV data",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, errors } = parseBrandsCSV(brandsCSV);
      
      if (errors.length > 0) {
        toast({
          title: "CSV Parse Errors",
          description: errors.join(", "),
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { data: result, error } = await supabase.functions.invoke('admin-bulk-upload', {
        body: {
          csvType: 'brands',
          csvData: data
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success!",
        description: `Created: ${result.created}, Errors: ${result.errors}`,
      });
      setBrandsCSV("");
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInsightsUpload = async () => {
    if (!insightsCSV.trim()) {
      toast({
        title: "No data provided",
        description: "Please paste the insights CSV data",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, errors } = parseInsightsCSV(insightsCSV);
      
      if (errors.length > 0) {
        toast({
          title: "CSV Parse Errors",
          description: errors.join(", "),
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { data: result, error } = await supabase.functions.invoke('admin-bulk-upload', {
        body: {
          csvType: 'insights',
          csvData: data
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success!",
        description: `Created: ${result.created}, Errors: ${result.errors}`,
      });
      setInsightsCSV("");
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-center mb-8">
          <img 
            src={wishLinkLogo} 
            alt="WishLink" 
            className="h-12 object-contain"
          />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Bulk upload data for creators, brands, and insights
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Creators Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Creators
              </CardTitle>
              <CardDescription>
                Upload creator profiles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste creators CSV data here...&#10;creator_id,name"
                value={creatorsCSV}
                onChange={(e) => setCreatorsCSV(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
              <Button 
                onClick={handleCreatorsUpload}
                disabled={loading || !creatorsCSV.trim()}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Creators
              </Button>
            </CardContent>
          </Card>

          {/* Brands Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Brands
              </CardTitle>
              <CardDescription>
                Upload brand information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste brands CSV data here...&#10;brand_id,brand_name,logo_url,website_url"
                value={brandsCSV}
                onChange={(e) => setBrandsCSV(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
              <Button 
                onClick={handleBrandsUpload}
                disabled={loading || !brandsCSV.trim()}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Brands
              </Button>
            </CardContent>
          </Card>

          {/* Insights Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Creator Brand Insights
              </CardTitle>
              <CardDescription>
                Upload creator-brand metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste insights CSV data here...&#10;creator_id,brand_id,theme_id,metric,value"
                value={insightsCSV}
                onChange={(e) => setInsightsCSV(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
              <Button 
                onClick={handleInsightsUpload}
                disabled={loading || !insightsCSV.trim()}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Insights
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">CSV Format Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-semibold mb-2">Creators CSV columns:</p>
              <code className="text-xs bg-muted p-2 rounded block">
                creator_id,name
              </code>
              <p className="text-xs text-muted-foreground mt-1">
                (creator_id must be a long integer)
              </p>
            </div>
            <div>
              <p className="font-semibold mb-2">Brands CSV columns:</p>
              <code className="text-xs bg-muted p-2 rounded block">
                brand_id,brand_name,logo_url,website_url
              </code>
              <p className="text-xs text-muted-foreground mt-1">
                (brand_id must be a long integer; logo_url and website_url are optional)
              </p>
            </div>
            <div>
              <p className="font-semibold mb-2">Creator Brand Insights CSV columns:</p>
              <code className="text-xs bg-muted p-2 rounded block">
                creator_id,brand_id,theme_id,metric,value
              </code>
              <p className="text-xs text-muted-foreground mt-1">
                (Both creator_id and brand_id must be long integers; make sure creators and brands exist before uploading insights)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Admin = () => {
  return (
    <ProtectedRoute requireAdmin>
      <AdminContent />
    </ProtectedRoute>
  );
};

export default Admin;
