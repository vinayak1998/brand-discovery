import { useCallback } from 'react';

// GA4 Event Types
export type GAEventCategory = 
  | 'brand_discovery'
  | 'product_discovery'
  | 'saved_products'
  | 'engagement'
  | 'conversion'
  | 'error'
  | 'performance';

export type GAEventAction =
  | 'page_view'
  | 'session_start'
  | 'theme_impression'
  | 'theme_view'
  | 'theme_expand'
  | 'brand_click'
  | 'brand_products_view'
  | 'product_click'
  | 'product_list_view'
  | 'filter_apply'
  | 'sort_change'
  | 'filter_clear'
  | 'sourcing_click'
  | 'survey_submit'
  | 'scroll'
  | 'external_redirect'
  | 'engagement_qualified'
  | 'perf_ready'
  | 'api_error'
  | 'load_error'
  | 'navigation_error'
  | 'dialog_view'
  | 'link_copy'
  | 'wishlist_add'
  | 'wishlist_remove'
  | 'content_idea_click'
  | 'tab_switch'
  | 'back_click'
  | 'breadcrumb_click'
  | 'logo_click'
  | 'check_product_click';

interface GAEventParams {
  event_category: GAEventCategory;
  event_action: GAEventAction;
  event_label?: string;
  event_label_2?: string;
  event_label_3?: string;
  screen?: string;
  page?: string;
  event_value?: number;
  [key: string]: any; // Allow additional custom parameters
}

// Declare gtag on window
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Main GA4 tracking hook
 * Uses numeric creator_id for user identification
 */
export const useGATracking = (creatorId?: number | null) => {
  // Core tracking function
  const trackEvent = useCallback((eventName: string, params: GAEventParams) => {
    if (typeof window.gtag === 'function') {
      // Set user_id from numeric creator ID
      if (creatorId) {
        window.gtag('set', 'user_properties', {
          user_id: creatorId.toString(),
          creator_id: creatorId.toString(),
        });
      }

      // Send event with all parameters
      window.gtag('event', eventName, {
        ...params,
        creator_id: creatorId,
        timestamp: Date.now(),
      });
    }
  }, [creatorId]);

  // 1. PAGE VIEW
  const trackPageView = useCallback((params: {
    page_path: string;
    page_title: string;
    tab?: 'brands' | 'products';
    screen?: string;
  }) => {
    trackEvent('page_view', {
      event_category: 'engagement',
      event_action: 'page_view',
      page: params.page_path,
      screen: params.screen || params.page_title,
      event_label: params.tab,
      ...params,
    });
  }, [trackEvent]);

  // 2. SESSION START (GA4 auto-tracks, but we enhance with creator_id)
  const trackSessionStart = useCallback(() => {
    trackEvent('session_start', {
      event_category: 'engagement',
      event_action: 'session_start',
      page: window.location.pathname,
    });
  }, [trackEvent]);

  // 3. ENGAGEMENT QUALIFIED (retention criteria met)
  const trackEngagementQualified = useCallback((params: {
    engagement_type: 'time' | 'clicks' | 'scroll';
    time_spent?: number;
    interaction_count?: number;
    scroll_depth?: number;
  }) => {
    trackEvent('engagement_qualified', {
      event_category: 'engagement',
      event_action: 'engagement_qualified',
      event_label: params.engagement_type,
      event_value: params.time_spent || params.interaction_count || params.scroll_depth,
      ...params,
    });
  }, [trackEvent]);

  // 4. THEME IMPRESSION (visible to user - IntersectionObserver)
  const trackThemeImpression = useCallback((params: {
    theme_id: string;
    theme_name: string;
    brand_count: number;
    position: number;
  }) => {
    trackEvent('theme_impression', {
      event_category: 'brand_discovery',
      event_action: 'theme_impression',
      event_label: params.theme_id,
      event_label_2: params.theme_name,
      event_value: params.brand_count,
      ...params,
    });
  }, [trackEvent]);

  // 5. THEME INTERACTION (expand/collapse)
  const trackThemeInteraction = useCallback((params: {
    action: 'theme_view' | 'theme_expand';
    theme_id: string;
    theme_name: string;
    brand_count: number;
  }) => {
    trackEvent('theme_interaction', {
      event_category: 'brand_discovery',
      event_action: params.action,
      event_label: params.theme_id,
      event_label_2: params.theme_name,
      event_value: params.brand_count,
      ...params,
    });
  }, [trackEvent]);

  // 6. BRAND INTERACTION
  const trackBrandInteraction = useCallback((params: {
    action: 'brand_click' | 'brand_products_view';
    brand_id: number;
    brand_name: string;
    theme_id: string;
    product_count?: number;
  }) => {
    trackEvent('brand_interaction', {
      event_category: 'brand_discovery',
      event_action: params.action,
      event_label: params.brand_name,
      event_label_2: params.theme_id,
      event_value: params.brand_id,
      ...params,
    });
  }, [trackEvent]);

  // 7. PRODUCT INTERACTION (product click)
  const trackProductInteraction = useCallback((params: {
    product_id: number;
    product_name: string;
    brand_id: number;
    brand_name: string;
    theme_id?: string;
    match_score: number;
    price?: number;
    source_tab: 'brand_discovery' | 'product_discovery';
    short_code: string;
    scroll_depth_at_click: number;
  }) => {
    trackEvent('product_interaction', {
      event_category: params.source_tab,
      event_action: 'product_click',
      event_label: params.product_name,
      event_label_2: params.brand_name,
      event_label_3: params.theme_id,
      event_value: params.product_id,
      ...params,
    });
  }, [trackEvent]);

  // 8. PRODUCT LIST VIEW (list rendering)
  const trackProductListView = useCallback((params: {
    list_context: 'product_tab' | 'brand_page' | 'empty_state' | 'filtered';
    visible_count: number;
    total_count: number;
    is_empty: boolean;
    brand_name?: string;
    filter_count?: number;
  }) => {
    trackEvent('product_list_view', {
      event_category: 'product_discovery',
      event_action: 'product_list_view',
      event_label: params.list_context,
      event_value: params.visible_count,
      ...params,
    });
  }, [trackEvent]);

  // 9. FILTER/SORT ACTION - supports brand, category, price filtering
  const trackFilterSortAction = useCallback((params: {
    action: 'filter_apply' | 'sort_change' | 'filter_clear';
    filter_type?: 'brand' | 'category' | 'price' | 'both';
    filter_count?: number;
    sort_by?: string;
    selected_brands?: string[];
    selected_categories?: string[];
    page?: string;
    screen?: string;
    previous_sort?: string;
  }) => {
    trackEvent('filter_sort_action', {
      event_category: 'product_discovery',
      event_action: params.action,
      event_label: params.sort_by || params.filter_type,
      event_label_2: params.previous_sort,
      event_value: params.filter_count,
      page: params.page,
      screen: params.screen,
      ...params,
    });
  }, [trackEvent]);

  // 10. CONVERSION ACTION (CTA clicks)
  const trackConversionAction = useCallback((params: {
    action: 'sourcing_click' | 'survey_submit';
    brand_id?: number;
    brand_name?: string;
  }) => {
    trackEvent('conversion_action', {
      event_category: 'conversion',
      event_action: params.action,
      event_label: params.brand_name,
      event_value: params.brand_id,
      ...params,
    });
  }, [trackEvent]);

  // 11. SCROLL MILESTONE
  const trackScrollMilestone = useCallback((params: {
    scroll_depth: number;
    page_section: string;
    page?: string;
    screen?: string;
  }) => {
    trackEvent('scroll_milestone', {
      event_category: 'engagement',
      event_action: 'scroll',
      event_label: `${params.scroll_depth}%`,
      event_value: params.scroll_depth,
      page: params.page,
      screen: params.screen,
      ...params,
    });
  }, [trackEvent]);

  // 12. EXTERNAL REDIRECT (before window.open)
  const trackExternalRedirect = useCallback((params: {
    destination: 'wishlink_product' | 'brand_sourcing';
    url: string;
    product_id?: number;
    brand_id?: number;
    brand_name?: string;
    short_code?: string;
  }) => {
    trackEvent('external_redirect', {
      event_category: 'conversion',
      event_action: 'external_redirect',
      event_label: params.destination,
      event_label_2: params.brand_name,
      event_value: params.product_id || params.brand_id,
      ...params,
    });
  }, [trackEvent]);

  // 13. ERROR EVENT
  const trackError = useCallback((params: {
    action: 'api_error' | 'load_error' | 'navigation_error';
    error_message: string;
    error_context: string;
  }) => {
    trackEvent('error_event', {
      event_category: 'error',
      event_action: params.action,
      event_label: params.error_context,
      event_label_2: params.error_message,
      ...params,
    });
  }, [trackEvent]);

  // 14. PERFORMANCE READY
  const trackPerformanceReady = useCallback((params: {
    dom_load_time: number;
    full_load_time: number;
    time_to_interactive: number;
    page_path: string;
  }) => {
    trackEvent('perf_ready', {
      event_category: 'performance',
      event_action: 'perf_ready',
      page: params.page_path,
      event_value: params.time_to_interactive,
      ...params,
    });
  }, [trackEvent]);

  // 15. PRODUCT DIALOG VIEW
  const trackProductDialogView = useCallback((params: {
    product_id: number;
    product_name: string;
    brand_id?: number;
    brand_name?: string;
    source_tab: 'brand_discovery' | 'product_discovery' | 'saved_products';
    page: string;
    screen: string;
  }) => {
    trackEvent('product_dialog_view', {
      event_category: params.source_tab,
      event_action: 'dialog_view',
      event_label: params.product_name,
      event_label_2: params.brand_name,
      event_value: params.product_id,
      page: params.page,
      screen: params.screen,
      ...params,
    });
  }, [trackEvent]);

  // 16. LINK COPY ACTION
  const trackLinkCopy = useCallback((params: {
    product_id: number;
    product_name: string;
    brand_name?: string;
    source_tab: 'brand_discovery' | 'product_discovery' | 'saved_products';
    page: string;
    screen: string;
  }) => {
    trackEvent('link_copy', {
      event_category: 'conversion',
      event_action: 'link_copy',
      event_label: params.product_name,
      event_label_2: params.brand_name,
      event_value: params.product_id,
      page: params.page,
      screen: params.screen,
      ...params,
    });
  }, [trackEvent]);

  // 17. WISHLIST ACTION
  const trackWishlistAction = useCallback((params: {
    action: 'wishlist_add' | 'wishlist_remove';
    product_id: number;
    product_name: string;
    brand_name?: string;
    source_tab: 'brand_discovery' | 'product_discovery' | 'saved_products';
    page: string;
    screen: string;
  }) => {
    trackEvent('wishlist_action', {
      event_category: 'engagement',
      event_action: params.action,
      event_label: params.product_name,
      event_label_2: params.brand_name,
      event_value: params.product_id,
      page: params.page,
      screen: params.screen,
      ...params,
    });
  }, [trackEvent]);

  // 18. CONTENT IDEA CLICK (Reel)
  const trackContentIdeaClick = useCallback((params: {
    product_id: number;
    product_name: string;
    reel_url: string;
    reel_position: number;
    page: string;
    screen: string;
  }) => {
    trackEvent('content_idea_click', {
      event_category: 'engagement',
      event_action: 'content_idea_click',
      event_label: params.product_name,
      event_label_2: params.reel_url,
      event_value: params.reel_position,
      page: params.page,
      screen: params.screen,
      ...params,
    });
  }, [trackEvent]);

  // 19. TAB SWITCH
  const trackTabSwitch = useCallback((params: {
    from_tab: 'brands' | 'products' | 'saved';
    to_tab: 'brands' | 'products' | 'saved';
    page: string;
    screen: string;
  }) => {
    trackEvent('tab_switch', {
      event_category: 'engagement',
      event_action: 'tab_switch',
      event_label: params.to_tab,
      event_label_2: params.from_tab,
      page: params.page,
      screen: params.screen,
      ...params,
    });
  }, [trackEvent]);

  // 20. NAVIGATION ACTION
  const trackNavigation = useCallback((params: {
    action: 'back_click' | 'breadcrumb_click' | 'logo_click';
    from_page: string;
    to_page: string;
    screen: string;
  }) => {
    trackEvent('navigation', {
      event_category: 'engagement',
      event_action: params.action,
      event_label: params.from_page,
      event_label_2: params.to_page,
      page: params.from_page,
      screen: params.screen,
      ...params,
    });
  }, [trackEvent]);

  // 21. CHECK PRODUCT CTA CLICK
  const trackCheckProductClick = useCallback((params: {
    product_id: number;
    product_name: string;
    brand_name?: string;
    source_tab: 'brand_discovery' | 'product_discovery' | 'saved_products';
    page: string;
    screen: string;
  }) => {
    trackEvent('check_product_click', {
      event_category: 'conversion',
      event_action: 'check_product_click',
      event_label: params.product_name,
      event_label_2: params.brand_name,
      event_value: params.product_id,
      page: params.page,
      screen: params.screen,
      ...params,
    });
  }, [trackEvent]);

  return {
    trackPageView,
    trackSessionStart,
    trackEngagementQualified,
    trackThemeImpression,
    trackThemeInteraction,
    trackBrandInteraction,
    trackProductInteraction,
    trackProductListView,
    trackFilterSortAction,
    trackConversionAction,
    trackScrollMilestone,
    trackExternalRedirect,
    trackError,
    trackPerformanceReady,
    trackProductDialogView,
    trackLinkCopy,
    trackWishlistAction,
    trackContentIdeaClick,
    trackTabSwitch,
    trackNavigation,
    trackCheckProductClick,
  };
};
