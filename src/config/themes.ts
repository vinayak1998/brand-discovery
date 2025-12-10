import { Flame, TrendingUp, Zap, DollarSign } from "lucide-react";

export interface ThemeConfig {
  id: string;
  title: string;
  icon: any;
  tagline: string;
  color: string;
}

export const THEMES: Record<string, ThemeConfig> = {
  top_trending: {
    id: "top_trending",
    title: "Most Shared Brands",
    icon: Flame,
    tagline: "What other creators similar to you are talking about most",
    color: "hsl(var(--primary))",
  },
  best_reach: {
    id: "best_reach",
    title: "Brands Driving High Reel Reach",
    icon: TrendingUp,
    tagline: "Maximize your reel reach with these brands",
    color: "hsl(var(--chart-2))",
  },
  fastest_selling: {
    id: "fastest_selling",
    title: "High Sales Brands",
    icon: Zap,
    tagline: "Products with highest sales performance",
    color: "hsl(var(--chart-3))",
  },
};

export const getTheme = (themeId: string): ThemeConfig | undefined => {
  return THEMES[themeId];
};
