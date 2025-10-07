import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { parseInsightsCSV, parseCreatorsCSV, parseBrandsCSV } from "@/utils/csvParser";
import { Upload, Database, Users, Building2 } from "lucide-react";
import wishLinkLogo from "@/assets/wishlink-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const AdminContent = () => {
  const [creatorsFile, setCreatorsFile] = useState<File | null>(null);
  const [brandsFile, setBrandsFile] = useState<File | null>(null);
  const [insightsFile, setInsightsFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleCreatorsUpload = async () => {
    if (!creatorsFile) {
      toast({
        title: "No file selected",
        description: "Please select a creators CSV file",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const csvText = await readFileAsText(creatorsFile);
      const { data, errors } = parseCreatorsCSV(csvText);
      
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
      setCreatorsFile(null);
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
    if (!brandsFile) {
      toast({
        title: "No file selected",
        description: "Please select a brands CSV file",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const csvText = await readFileAsText(brandsFile);
      const { data, errors } = parseBrandsCSV(csvText);
      
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
      setBrandsFile(null);
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
    if (!insightsFile) {
      toast({
        title: "No file selected",
        description: "Please select an insights CSV file",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const csvText = await readFileAsText(insightsFile);
      const { data, errors } = parseInsightsCSV(csvText);
      
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
      setInsightsFile(null);
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
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCreatorsFile(e.target.files?.[0] || null)}
                  className="max-w-full"
                />
                {creatorsFile && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Selected: {creatorsFile.name}
                  </p>
                )}
              </div>
              <Button 
                onClick={handleCreatorsUpload}
                disabled={loading || !creatorsFile}
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
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setBrandsFile(e.target.files?.[0] || null)}
                  className="max-w-full"
                />
                {brandsFile && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Selected: {brandsFile.name}
                  </p>
                )}
              </div>
              <Button 
                onClick={handleBrandsUpload}
                disabled={loading || !brandsFile}
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
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setInsightsFile(e.target.files?.[0] || null)}
                  className="max-w-full"
                />
                {insightsFile && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Selected: {insightsFile.name}
                  </p>
                )}
              </div>
              <Button 
                onClick={handleInsightsUpload}
                disabled={loading || !insightsFile}
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
