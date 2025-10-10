import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, Users, MousePointer, FileText, BarChart3, ArrowLeft } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import wishLinkLogo from "@/assets/wishlink-logo.png";

interface AnalyticsData {
  total_events: number;
  unique_creators: number;
  events_by_type: Record<string, number>;
  theme_engagement: Record<string, number>;
  brand_clicks: number;
  brand_website_clicks: number;
  cta_clicks: number;
  survey_starts: number;
  survey_submits: number;
  creator_metrics: Array<{
    creator_id: number;
    creator_name: string;
    page_views: number;
    brand_clicks: number;
    website_clicks: number;
    cta_clicks: number;
    survey_submitted: boolean;
    themes_viewed: string[];
    total_engagement: number;
    first_visit: string;
    last_visit: string;
  }>;
  daily_breakdown: Array<{
    date: string;
    events: number;
    unique_creators: number;
  }>;
  survey_responses?: Array<{
    q1_value_rating: number;
    q2_actionability: string;
    q3_themes: string;
    q4_missing_info: string;
    q5_barriers?: string;
    q6_open_feedback?: string;
    creator_name: string;
  }>;
}

const THEME_COLORS = {
  top_trending: "hsl(var(--chart-1))",
  best_reach: "hsl(var(--chart-2))",
  fastest_selling: "hsl(var(--chart-3))",
  highest_commission: "hsl(var(--chart-4))",
};

const THEME_LABELS = {
  top_trending: "Top Trending",
  best_reach: "Best Reach",
  fastest_selling: "Fastest Selling",
  highest_commission: "Highest Commission",
};

const AnalyticsContent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState("30");
  const [selectedCreator, setSelectedCreator] = useState<string>("all");

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const dateFrom = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString();
      const dateTo = new Date().toISOString();

      const params = new URLSearchParams({
        date_from: dateFrom,
        date_to: dateTo,
      });

      if (selectedCreator !== "all") {
        params.append('creator_id', selectedCreator);
      }

      const { data: analyticsData, error } = await supabase.functions.invoke('get-analytics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (error) throw error;

      setData(analyticsData);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, selectedCreator]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="p-6">
          <p className="text-muted-foreground">Failed to load analytics data</p>
        </Card>
      </div>
    );
  }

  // Prepare chart data
  const themeEngagementData = Object.entries(data.theme_engagement).map(([theme, count]) => ({
    name: THEME_LABELS[theme as keyof typeof THEME_LABELS] || theme,
    value: count,
    color: THEME_COLORS[theme as keyof typeof THEME_COLORS],
  }));

  const funnelData = [
    { stage: "Page Views", count: data.events_by_type.page_view || 0, color: "hsl(var(--chart-1))", creators: [] as string[] },
    { stage: "Brand Clicks", count: data.brand_clicks, color: "hsl(var(--chart-2))", creators: [] as string[] },
    { stage: "Website Visits", count: data.brand_website_clicks, color: "hsl(var(--chart-3))", creators: [] as string[] },
    { stage: "CTA Clicks", count: data.cta_clicks, color: "hsl(var(--chart-4))", creators: [] as string[] },
    { stage: "Survey Started", count: data.survey_starts, color: "hsl(var(--chart-5))", creators: [] as string[] },
    { stage: "Survey Submitted", count: data.survey_submits, color: "hsl(var(--primary))", creators: [] as string[] },
  ];

  // Map creators to funnel stages
  data.creator_metrics.forEach(creator => {
    if (creator.page_views > 0) funnelData[0].creators.push(creator.creator_name);
    if (creator.brand_clicks > 0) funnelData[1].creators.push(creator.creator_name);
    if (creator.website_clicks > 0) funnelData[2].creators.push(creator.creator_name);
    if (creator.cta_clicks > 0) funnelData[3].creators.push(creator.creator_name);
  });

  // Survey responses visualization
  const surveyValueDistribution = data.survey_responses ? 
    [1, 2, 3, 4, 5].map(rating => ({
      rating: `${rating} Star${rating > 1 ? 's' : ''}`,
      count: data.survey_responses!.filter(r => r.q1_value_rating === rating).length,
    })) : [];

  const surveyActionabilityData = data.survey_responses ?
    ["Very Likely", "Likely", "Neutral", "Unlikely", "Very Unlikely"].map(response => ({
      response,
      count: data.survey_responses!.filter(r => r.q2_actionability === response).length,
    })).filter(d => d.count > 0) : [];

  const topCreators = [...data.creator_metrics]
    .sort((a, b) => b.total_engagement - a.total_engagement)
    .slice(0, 10);

  // Calculate conversion rates
  const pageViews = data.events_by_type.page_view || 1;
  const brandClickRate = ((data.brand_clicks / pageViews) * 100).toFixed(1);
  const websiteClickRate = ((data.brand_website_clicks / data.brand_clicks || 1) * 100).toFixed(1);
  const surveyCompletionRate = ((data.survey_submits / data.survey_starts || 1) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={wishLinkLogo} alt="WishLink" className="h-10 object-contain" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Analytics Dashboard
              </h1>
              <p className="text-muted-foreground">Creator engagement & adoption metrics</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCreator} onValueChange={setSelectedCreator}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Creators" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Creators</SelectItem>
                {data.creator_metrics.map(c => (
                  <SelectItem key={c.creator_id} value={c.creator_id.toString()}>
                    {c.creator_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.total_events.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Tracked interactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Creators</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.unique_creators}</div>
              <p className="text-xs text-muted-foreground">Unique visitors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Brand Click Rate</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{brandClickRate}%</div>
              <p className="text-xs text-muted-foreground">Clicks per page view</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Survey Completion</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{surveyCompletionRate}%</div>
              <p className="text-xs text-muted-foreground">{data.survey_submits} completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Theme Engagement */}
          <Card>
            <CardHeader>
              <CardTitle>Theme Engagement</CardTitle>
              <CardDescription>Which themes creators interact with most</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={themeEngagementData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {themeEngagementData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Engagement Funnel</CardTitle>
              <CardDescription>Creator journey from view to action</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="stage" type="category" width={120} />
                  <Tooltip 
                    content={({ payload }) => {
                      if (!payload || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold">{data.stage}</p>
                          <p className="text-sm">Count: {data.count}</p>
                          {data.creators.length > 0 && (
                            <div className="mt-2 text-xs max-w-xs">
                              <p className="font-medium">Creators:</p>
                              <p className="text-muted-foreground">{data.creators.join(', ')}</p>
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))">
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Survey Results - Only show if there are responses */}
        {data.survey_responses && data.survey_responses.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Survey Value Rating Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Survey: Value Rating</CardTitle>
                <CardDescription>How valuable creators found the insights</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={surveyValueDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="rating" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--chart-1))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Survey Actionability */}
            <Card>
              <CardHeader>
                <CardTitle>Survey: Likelihood to Act</CardTitle>
                <CardDescription>How likely creators are to take action</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={surveyActionabilityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="response" angle={-15} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--chart-2))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Daily Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Activity Trend</CardTitle>
            <CardDescription>Events and unique creators over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.daily_breakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="events" stroke="hsl(var(--chart-1))" name="Events" />
                <Line yAxisId="right" type="monotone" dataKey="unique_creators" stroke="hsl(var(--chart-2))" name="Unique Creators" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Creators Table */}
        <Card>
          <CardHeader>
            <CardTitle>Top Engaged Creators</CardTitle>
            <CardDescription>Creators with highest total engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Creator</th>
                    <th className="text-right p-2">Page Views</th>
                    <th className="text-right p-2">Brand Clicks</th>
                    <th className="text-right p-2">Website Clicks</th>
                    <th className="text-right p-2">CTA Clicks</th>
                    <th className="text-center p-2">Survey</th>
                    <th className="text-right p-2">Total Engagement</th>
                  </tr>
                </thead>
                <tbody>
                  {topCreators.map((creator) => (
                    <tr key={creator.creator_id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{creator.creator_name}</td>
                      <td className="text-right p-2">{creator.page_views}</td>
                      <td className="text-right p-2">{creator.brand_clicks}</td>
                      <td className="text-right p-2">{creator.website_clicks}</td>
                      <td className="text-right p-2">{creator.cta_clicks}</td>
                      <td className="text-center p-2">{creator.survey_submitted ? "✓" : "—"}</td>
                      <td className="text-right p-2 font-semibold">{creator.total_engagement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Analytics = () => {
  return (
    <ProtectedRoute requireAdmin>
      <AnalyticsContent />
    </ProtectedRoute>
  );
};

export default Analytics;