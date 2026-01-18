// Content Theme definitions for product discovery
export interface ContentTheme {
  id: string;
  label: string;
  icon: string;
}

// 14 Content Themes based on actual product data
export const CONTENT_THEMES: ContentTheme[] = [
  { id: "festive_ethnic", label: "Festive & Ethnic", icon: "✨" },
  { id: "party_glam", label: "Party & Glam", icon: "🎉" },
  { id: "casual_everyday", label: "Everyday", icon: "👕" },
  { id: "workwear", label: "Office Ready", icon: "💼" },
  { id: "loungewear", label: "Cozy Lounge", icon: "🛋️" },
  { id: "summer_vibes", label: "Summer", icon: "☀️" },
  { id: "winter_layers", label: "Winter", icon: "❄️" },
  { id: "makeup_beauty", label: "Makeup", icon: "💄" },
  { id: "skincare_routine", label: "Skincare", icon: "🧴" },
  { id: "haircare", label: "Hair Goals", icon: "💇" },
  { id: "accessory_haul", label: "Accessories", icon: "👜" },
  { id: "shoe_closet", label: "Shoes", icon: "👠" },
  { id: "home_living", label: "Home & Living", icon: "🏠" },
  { id: "fragrance", label: "Fragrance", icon: "🌸" },
];

// Helper function to get theme by ID
export const getContentTheme = (themeId: string): ContentTheme | undefined => {
  return CONTENT_THEMES.find((theme) => theme.id === themeId);
};
