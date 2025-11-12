export interface TourStep {
  id: string;
  target: string; // CSS selector or data attribute
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  spotlightPadding?: number;
  action?: 'modal' | 'tooltip';
}

export const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    target: 'body',
    title: '👋 Welcome to Your Discovery Hub!',
    description: 'Find brands and products tailored to your audience. Let\'s take a quick tour!',
    action: 'modal',
  },
  {
    id: 'brand-themes',
    target: '[data-tour="brand-themes"]',
    title: '🎯 Curated Brand Themes',
    description: 'These themes show brands matched to your content style. Click any theme to explore brands.',
    position: 'bottom',
    action: 'tooltip',
  },
  {
    id: 'brand-card',
    target: '[data-tour="brand-card"]',
    title: '🏢 Brand Details',
    description: 'Click on any brand to see personalized product recommendations with commission rates and performance metrics.',
    position: 'right',
    action: 'tooltip',
  },
  {
    id: 'products-tab',
    target: '[data-tour="products-tab"]',
    title: '🛍️ Product Discovery',
    description: 'Switch to Products to explore all recommendations across brands in one view.',
    position: 'bottom',
    action: 'tooltip',
  },
  {
    id: 'filters',
    target: '[data-tour="filters"]',
    title: '🔍 Smart Filters',
    description: 'Filter by category, subcategory, or brand to find exactly what you need.',
    position: 'bottom',
    action: 'tooltip',
  },
  {
    id: 'sorting',
    target: '[data-tour="sorting"]',
    title: '📊 Sort Options',
    description: 'Sort by match score, reach, sales, or price to prioritize what matters most.',
    position: 'bottom',
    action: 'tooltip',
  },
  {
    id: 'product-tile',
    target: '[data-tour="product-tile"]',
    title: '💎 Product Insights',
    description: 'Each tile shows match score, brand, theme, price, and commission. Click to visit the product!',
    position: 'left',
    action: 'tooltip',
  },
  {
    id: 'complete',
    target: 'body',
    title: '🎉 You\'re All Set!',
    description: 'Start exploring brands and products. You can revisit this tour anytime from settings.',
    action: 'modal',
  },
];
