// Google AdSense Configuration
// Replace these values with your actual Google AdSense data

export const ADS_CONFIG = {
  // Your Google AdSense Publisher ID
  // Get this from your AdSense dashboard
  CLIENT_ID: "ca-pub-XXXXXXXXXXXXXXXX",
  
  // Ad Unit IDs for different ad types
  // Create these in your AdSense dashboard
  AD_SLOTS: {
    BANNER: "1234567890",           // 728x90 leaderboard banner
    SQUARE: "2345678901",           // 300x250 medium rectangle
    SIDEBAR: "3456789012",          // 160x600 wide skyscraper
    MOBILE_BANNER: "4567890123",    // 320x50 mobile banner
    RESPONSIVE: "5678901234"        // Responsive ad unit
  },
  
  // Ad display preferences
  SETTINGS: {
    SHOW_AD_LABELS: true,           // Show "Advertisement" labels
    ENABLE_LAZY_LOADING: true,      // Load ads when they come into view
    RESPECT_DO_NOT_TRACK: true,     // Respect browser Do Not Track settings
    MIN_VIEW_TIME: 1000,            // Minimum time (ms) ad must be visible to count
  }
};

// Environment-based ad serving
export const getAdConfig = () => {
  const isDevelopment = import.meta.env.DEV;
  const isProduction = import.meta.env.PROD;
  
  return {
    ...ADS_CONFIG,
    ENABLED: isProduction, // Only show ads in production
    DEBUG: isDevelopment   // Enable debug logging in development
  };
};

// AdSense integration helper
export const initializeAdSense = () => {
  if (typeof window === 'undefined') return;
  
  const config = getAdConfig();
  
  if (!config.ENABLED) {
    console.log('🚫 Ads disabled in development environment');
    return;
  }
  
  // Initialize AdSense if not already done
  if (!window.adsbygoogle) {
    window.adsbygoogle = [];
  }
  
  if (config.DEBUG) {
    console.log('📢 AdSense initialized with config:', config);
  }
};