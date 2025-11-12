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
    title: '👋 Welcome!',
    description: 'Quick tour to help you discover brands and products tailored to your audience.',
    action: 'modal',
  },
  {
    id: 'brand-themes',
    target: '[data-tour="brand-themes"]',
    title: '🎯 Brand Themes',
    description: 'Tap any theme to explore brands matched to your content.',
    position: 'bottom',
    action: 'tooltip',
    spotlightPadding: 12,
  },
  {
    id: 'brand-card',
    target: '[data-tour="brand-card"]',
    title: '🏢 Brand Cards',
    description: 'Tap a brand to see personalized products with commission rates.',
    position: 'right',
    action: 'tooltip',
    spotlightPadding: 8,
  },
  {
    id: 'products-tab',
    target: '[data-tour="products-tab"]',
    title: '🛍️ Products Tab',
    description: 'Browse all product recommendations in one place.',
    position: 'bottom',
    action: 'tooltip',
    spotlightPadding: 8,
  },
  {
    id: 'filters',
    target: '[data-tour="filters"]',
    title: '🔍 Filters',
    description: 'Filter by category, subcategory, or brand.',
    position: 'bottom',
    action: 'tooltip',
    spotlightPadding: 8,
  },
  {
    id: 'sorting',
    target: '[data-tour="sorting"]',
    title: '📊 Sorting',
    description: 'Sort by match score, reach, sales, or price.',
    position: 'bottom',
    action: 'tooltip',
    spotlightPadding: 8,
  },
  {
    id: 'product-tile',
    target: '[data-tour="product-tile"]',
    title: '💎 Product Tile',
    description: 'Shows match score, brand, theme, and price. Tap to visit!',
    position: 'left',
    action: 'tooltip',
    spotlightPadding: 8,
  },
  {
    id: 'complete',
    target: 'body',
    title: '🎉 All Set!',
    description: 'Start exploring! You can restart this tour anytime from settings.',
    action: 'modal',
  },
];
