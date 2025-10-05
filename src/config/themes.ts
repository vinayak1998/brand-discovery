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
    title: "Top Trending Brands",
    icon: Flame,
    tagline: "Brands gaining the most momentum right now",
    color: "hsl(var(--primary))",
  },
  best_reach: {
    id: "best_reach",
    title: "Best Reach Brands",
    icon: TrendingUp,
    tagline: "Maximize your audience with these brands",
    color: "hsl(var(--chart-2))",
  },
  fastest_selling: {
    id: "fastest_selling",
    title: "Fastest Selling Products",
    icon: Zap,
    tagline: "Products flying off the shelves",
    color: "hsl(var(--chart-3))",
  },
  highest_commission: {
    id: "highest_commission",
    title: "Highest Commission Rates",
    icon: DollarSign,
    tagline: "Earn more with these top-paying brands",
    color: "hsl(var(--chart-4))",
  },
};

export const getTheme = (themeId: string): ThemeConfig | undefined => {
  return THEMES[themeId];
};
