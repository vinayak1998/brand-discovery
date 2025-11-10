import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { parseInsightsCSV, parseCreatorsCSV, parseBrandsCSV } from "@/utils/csvParser";
import { Upload, Database, Users, Building2, BarChart3, PackageCheck, Download } from "lucide-react";
import wishLinkLogo from "@/assets/wishlink-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";

const AdminContent = () => {
  const navigate = useNavigate();
  const [creatorsFile, setCreatorsFile] = useState<File | null>(null);
  const [brandsFile, setBrandsFile] = useState<File | null>(null);
  const [insightsFile, setInsightsFile] = useState<File | null>(null);
  const [sourcingCreatorIds, setSourcingCreatorIds] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    type: 'creators' | 'brands' | 'insights' | 'sourcing' | null;
    current: number;
    total: number;
  }>({ type: null, current: 0, total: 0 });
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
    setUploadProgress({ type: 'creators', current: 0, total: 0 });
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
        setUploadProgress({ type: null, current: 0, total: 0 });
        return;
      }

      setUploadProgress({ type: 'creators', current: 0, total: data.length });

      const { data: result, error } = await supabase.functions.invoke('admin-bulk-upload', {
        body: {
          csvType: 'creators',
          csvData: data
        }
      });

      if (error) {
        throw error;
      }

      setUploadProgress({ type: 'creators', current: data.length, total: data.length });

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
      setTimeout(() => setUploadProgress({ type: null, current: 0, total: 0 }), 2000);
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
    setUploadProgress({ type: 'brands', current: 0, total: 0 });
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
        setUploadProgress({ type: null, current: 0, total: 0 });
        return;
      }

      setUploadProgress({ type: 'brands', current: 0, total: data.length });

      const { data: result, error } = await supabase.functions.invoke('admin-bulk-upload', {
        body: {
          csvType: 'brands',
          csvData: data
        }
      });

      if (error) {
        throw error;
      }

      setUploadProgress({ type: 'brands', current: data.length, total: data.length });

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
      setTimeout(() => setUploadProgress({ type: null, current: 0, total: 0 }), 2000);
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
    setUploadProgress({ type: 'insights', current: 0, total: 0 });
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
        setUploadProgress({ type: null, current: 0, total: 0 });
        return;
      }

      setUploadProgress({ type: 'insights', current: 0, total: data.length });

      const { data: result, error } = await supabase.functions.invoke('admin-bulk-upload', {
        body: {
          csvType: 'insights',
          csvData: data
        }
      });

      if (error) {
        throw error;
      }

      setUploadProgress({ type: 'insights', current: data.length, total: data.length });

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
      setTimeout(() => setUploadProgress({ type: null, current: 0, total: 0 }), 2000);
    }
  };

  const handleSourcingUpload = async () => {
    if (!sourcingCreatorIds.trim()) {
      toast({
        title: "No Creator IDs provided",
        description: "Please enter at least one creator ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setUploadProgress({ type: 'sourcing', current: 0, total: 0 });
    
    try {
      // Parse creator IDs (comma or newline separated)
      const ids = sourcingCreatorIds
        .split(/[\n,]/)
        .map(id => id.trim())
        .filter(id => id.length > 0)
        .map(id => parseInt(id, 10))
        .filter(id => !isNaN(id));

      if (ids.length === 0) {
        toast({
          title: "Invalid Creator IDs",
          description: "Please enter valid numeric creator IDs",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      setUploadProgress({ type: 'sourcing', current: 0, total: ids.length });

      // Update creators in the database
      const { error } = await supabase
        .from('creators')
        .update({ brand_sourcing: true })
        .in('creator_id', ids);

      if (error) {
        throw error;
      }

      setUploadProgress({ type: 'sourcing', current: ids.length, total: ids.length });

      toast({
        title: "Success!",
        description: `Brand sourcing enabled for ${ids.length} creator(s)`,
      });
      setSourcingCreatorIds("");
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress({ type: null, current: 0, total: 0 }), 2000);
    }
  };

  const handleDownloadProductRecommendations = async () => {
    setLoading(true);
    try {
      toast({
        title: "Downloading...",
        description: "Fetching product recommendations data",
      });

      const { data, error } = await supabase
        .from('creator_x_product_recommendations')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        toast({
          title: "No data found",
          description: "The product recommendations table is empty",
          variant: "destructive",
        });
        return;
      }

      // Convert to CSV
      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            // Escape values containing commas or quotes
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          }).join(',')
        )
      ];
      const csvContent = csvRows.join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `product_recommendations_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Success!",
        description: `Downloaded ${data.length} product recommendations`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
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

        <div className="flex items-center justify-between">
          <div className="text-center flex-1 space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Bulk upload data for creators, brands, and insights
            </p>
          </div>
          <Button onClick={() => navigate('/admin/analytics')} className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            View Analytics
          </Button>
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
              {uploadProgress.type === 'creators' && uploadProgress.total > 0 && (
                <div className="space-y-2">
                  <Progress value={(uploadProgress.current / uploadProgress.total) * 100} />
                  <p className="text-xs text-muted-foreground text-center">
                    {uploadProgress.current} / {uploadProgress.total} rows
                  </p>
                </div>
              )}
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
              {uploadProgress.type === 'brands' && uploadProgress.total > 0 && (
                <div className="space-y-2">
                  <Progress value={(uploadProgress.current / uploadProgress.total) * 100} />
                  <p className="text-xs text-muted-foreground text-center">
                    {uploadProgress.current} / {uploadProgress.total} rows
                  </p>
                </div>
              )}
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
              {uploadProgress.type === 'insights' && uploadProgress.total > 0 && (
                <div className="space-y-2">
                  <Progress value={(uploadProgress.current / uploadProgress.total) * 100} />
                  <p className="text-xs text-muted-foreground text-center">
                    {uploadProgress.current} / {uploadProgress.total} rows
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Brand Sourcing Section */}
          <Card className="border-accent/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackageCheck className="h-5 w-5" />
                Enable Brand Sourcing
              </CardTitle>
              <CardDescription>
                Enable brand sourcing for specific creators by entering their IDs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter creator IDs (comma or newline separated)&#10;Example: 123456, 789012&#10;Or:&#10;123456&#10;789012"
                value={sourcingCreatorIds}
                onChange={(e) => setSourcingCreatorIds(e.target.value)}
                className="min-h-[120px] font-mono text-sm"
              />
              <Button 
                onClick={handleSourcingUpload}
                disabled={loading || !sourcingCreatorIds.trim()}
                className="w-full"
              >
                <PackageCheck className="mr-2 h-4 w-4" />
                Enable Sourcing for Creators
              </Button>
              {uploadProgress.type === 'sourcing' && uploadProgress.total > 0 && (
                <div className="space-y-2">
                  <Progress value={(uploadProgress.current / uploadProgress.total) * 100} />
                  <p className="text-xs text-muted-foreground text-center">
                    {uploadProgress.current} / {uploadProgress.total} creators updated
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Download Product Recommendations */}
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Product Recommendations
              </CardTitle>
              <CardDescription>
                Download current snapshot of all product recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Click below to export all product recommendations as CSV
                </p>
                <p className="text-xs text-muted-foreground">
                  Includes all fields: ID, creator, product, scores, clicks, etc.
                </p>
              </div>
              <Button 
                onClick={handleDownloadProductRecommendations}
                disabled={loading}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Download CSV
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
                creator_id,brand_id,theme_id,value
              </code>
              <p className="text-xs text-muted-foreground mt-1">
                (Both creator_id and brand_id must be long integers; theme_id should be one of: top_trending, best_reach, fastest_selling, highest_commission. Make sure creators and brands exist before uploading insights)
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
