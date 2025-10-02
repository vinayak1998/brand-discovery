import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCSVData } from "@/contexts/CSVDataContext";
import { parseInsightsCSV, parseBrandLogosCSV } from "@/utils/csvParser";
import { Upload, Database, ImageIcon } from "lucide-react";
import wishLinkLogo from "@/assets/wishlink-logo.png";

const Admin = () => {
  const [insightsCSV, setInsightsCSV] = useState("");
  const [logosCSV, setLogosCSV] = useState("");
  const [loading, setLoading] = useState(false);
  const { setInsights, setBrandLogos } = useCSVData();
  const { toast } = useToast();

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

      setInsights(data);
      toast({
        title: "Success!",
        description: `Uploaded ${data.length} insights records`,
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

  const handleLogosUpload = async () => {
    if (!logosCSV.trim()) {
      toast({
        title: "No data provided",
        description: "Please paste the brand logos CSV data",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, errors } = parseBrandLogosCSV(logosCSV);
      
      if (errors.length > 0) {
        toast({
          title: "CSV Parse Errors",
          description: errors.join(", "),
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      setBrandLogos(data);
      toast({
        title: "Success!",
        description: `Uploaded ${Object.keys(data).length} brand logo mappings`,
      });
      setLogosCSV("");
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
      <div className="max-w-5xl mx-auto space-y-8">
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
            Upload and manage creator insights data
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Insights Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Creator Insights Data
              </CardTitle>
              <CardDescription>
                Upload CSV containing insights for all creators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste your insights CSV data here...&#10;creator_id,theme_id,theme_title,icon,tagline,color,brand_name,logo_url,metric,value"
                value={insightsCSV}
                onChange={(e) => setInsightsCSV(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
              <Button 
                onClick={handleInsightsUpload}
                disabled={loading || !insightsCSV.trim()}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Insights Data
              </Button>
            </CardContent>
          </Card>

          {/* Brand Logos Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Brand Logos
              </CardTitle>
              <CardDescription>
                Upload CSV mapping brand names to logo URLs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste your brand logos CSV data here...&#10;brand_name,logo_url"
                value={logosCSV}
                onChange={(e) => setLogosCSV(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
              <Button 
                onClick={handleLogosUpload}
                disabled={loading || !logosCSV.trim()}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Brand Logos
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
              <p className="font-semibold mb-2">Insights CSV columns:</p>
              <code className="text-xs bg-muted p-2 rounded block">
                creator_id,theme_id,theme_title,icon,tagline,color,brand_name,logo_url,metric,value
              </code>
            </div>
            <div>
              <p className="font-semibold mb-2">Brand Logos CSV columns:</p>
              <code className="text-xs bg-muted p-2 rounded block">
                brand_name,logo_url
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
