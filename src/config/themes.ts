import { Flame, TrendingUp, Zap, DollarSign } from "lucide-react";

export interface ThemeConfig {
  id: string;
  title: string;
  icon: any;
  tagline: string;
  color: string;
}

export const THEMES: Record<string, ThemeConfig> = {
  best_reach: {
    id: "best_reach",
    title: "Best Reach Brands",
    icon: TrendingUp,
    tagline: "Maximize your audience with these brands",
    color: "hsl(var(--chart-2))",
  },
  top_trending: {
    id: "top_trending",
    title: "Most Shared Brands",
    icon: Flame,
    tagline: "Brands gaining the most momentum right now",
    color: "hsl(var(--primary))",
  },
  fastest_selling: {
    id: "fastest_selling",
    title: "Fast Selling Brands",
    icon: Zap,
    tagline: "Products flying off the shelves",
    color: "hsl(var(--chart-3))",
  },
};

export const getTheme = (themeId: string): ThemeConfig | undefined => {
  return THEMES[themeId];
};
