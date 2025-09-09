import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Download, FileText, AlertCircle, CheckCircle2, Database } from 'lucide-react';
import { CSVParser, InsightRow, SurveyResponse } from '@/utils/csvParser';
import { useCSVData } from '@/contexts/CSVDataContext';
import { useToast } from '@/hooks/use-toast';

interface CSVUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CSVUploadDialog({ open, onOpenChange }: CSVUploadDialogProps) {
  const { setInsights, setSurveys, hasInsightsData, hasSurveyData, exportInsightsCSV, exportSurveysCSV } = useCSVData();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('insights');
  const [csvText, setCsvText] = useState('');
  const [previewData, setPreviewData] = useState<InsightRow[] | SurveyResponse[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    if (!file.type.includes('csv') && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file.",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvText(text);
      handlePreview(text);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handlePreview = (text: string) => {
    if (!text.trim()) {
      setPreviewData([]);
      setErrors([]);
      return;
    }

    setIsLoading(true);
    
    try {
      if (activeTab === 'insights') {
        const result = CSVParser.parseInsightsCSV(text);
        setPreviewData(result.data.slice(0, 5)); // Show first 5 rows for preview
        setErrors(result.errors);
      } else {
        const result = CSVParser.parseSurveyCSV(text);
        setPreviewData(result.data.slice(0, 5));
        setErrors(result.errors);
      }
    } catch (error) {
      setErrors([`Failed to parse CSV: ${error}`]);
      setPreviewData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmUpload = () => {
    if (!csvText.trim()) return;

    try {
      if (activeTab === 'insights') {
        const result = CSVParser.parseInsightsCSV(csvText);
        if (result.success) {
          setInsights(result.data);
          toast({
            title: "Insights data uploaded successfully",
            description: `Loaded ${result.data.length} insights records.`
          });
          onOpenChange(false);
        } else {
          toast({
            title: "Upload failed",
            description: result.errors.join(', '),
            variant: "destructive"
          });
        }
      } else {
        const result = CSVParser.parseSurveyCSV(csvText);
        if (result.success) {
          setSurveys(result.data);
          toast({
            title: "Survey data uploaded successfully",
            description: `Loaded ${result.data.length} survey responses.`
          });
          onOpenChange(false);
        } else {
          toast({
            title: "Upload failed",
            description: result.errors.join(', '),
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: `Error: ${error}`,
        variant: "destructive"
      });
    }
  };

  const downloadSample = () => {
    const sampleCSV = activeTab === 'insights' 
      ? CSVParser.generateSampleInsightsCSV()
      : CSVParser.generateSampleSurveyCSV();
    
    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample-${activeTab}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const downloadCurrentData = () => {
    const csvData = activeTab === 'insights' ? exportInsightsCSV() : exportSurveysCSV();
    
    if (!csvData) {
      toast({
        title: "No data to export",
        description: `No ${activeTab} data available.`,
        variant: "destructive"
      });
      return;
    }

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `current-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setCsvText('');
    setPreviewData([]);
    setErrors([]);
  };

  const hasCurrentData = activeTab === 'insights' ? hasInsightsData : hasSurveyData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            CSV Data Management
          </DialogTitle>
          <DialogDescription>
            Upload CSV files to manage insights and survey data for your application.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          resetForm();
        }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Insights Data
              {hasInsightsData && <Badge variant="secondary" className="ml-1">Active</Badge>}
            </TabsTrigger>
            <TabsTrigger value="surveys" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Survey Data
              {hasSurveyData && <Badge variant="secondary" className="ml-1">Active</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Upload insights data containing brand metrics and themes.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={downloadSample}>
                  <Download className="w-4 h-4 mr-2" />
                  Sample CSV
                </Button>
                {hasInsightsData && (
                  <Button variant="outline" size="sm" onClick={downloadCurrentData}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Current
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="surveys" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Upload survey response data from users.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={downloadSample}>
                  <Download className="w-4 h-4 mr-2" />
                  Sample CSV
                </Button>
                {hasSurveyData && (
                  <Button variant="outline" size="sm" onClick={downloadCurrentData}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Current
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Upload Area */}
        <div className="space-y-4">
          <div 
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">
              Drop your CSV file here or click to browse
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Supports CSV files up to 10MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              className="hidden"
            />
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
            >
              Browse Files
            </Button>
          </div>

          {/* Text Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Or paste CSV data directly:</label>
            <Textarea
              placeholder={`Paste your ${activeTab} CSV data here...`}
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                handlePreview(e.target.value);
              }}
              className="min-h-[120px] font-mono text-sm"
            />
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {errors.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {previewData.length > 0 && errors.length === 0 && (
            <Alert>
              <CheckCircle2 className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Preview ({previewData.length} rows shown)</p>
                  <div className="text-xs bg-muted p-2 rounded max-h-32 overflow-y-auto">
                    <pre>{JSON.stringify(previewData, null, 2)}</pre>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Status */}
          {hasCurrentData && (
            <Alert>
              <CheckCircle2 className="w-4 h-4" />
              <AlertDescription>
                Current {activeTab} data is loaded and active.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {csvText && (
              <Button variant="outline" onClick={resetForm}>
                Clear
              </Button>
            )}
            <Button 
              onClick={handleConfirmUpload}
              disabled={!csvText.trim() || errors.length > 0 || isLoading}
            >
              {isLoading ? 'Processing...' : 'Upload Data'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}