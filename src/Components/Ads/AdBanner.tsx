import React from 'react';
import GoogleAd from './GoogleAd';
import { getAdConfig } from '../../config/adsConfig';
import './GoogleAd.css';

interface AdBannerProps {
  type: 'banner' | 'square' | 'sidebar' | 'mobile-banner' | 'responsive';
  className?: string;
  showLabel?: boolean;
}

const AdBanner: React.FC<AdBannerProps> = ({ 
  type, 
  className = "",
  showLabel = true 
}) => {
  const config = getAdConfig();
  
  const adSlots = {
    banner: config.AD_SLOTS.BANNER,
    square: config.AD_SLOTS.SQUARE,
    sidebar: config.AD_SLOTS.SIDEBAR,
    'mobile-banner': config.AD_SLOTS.MOBILE_BANNER,
    responsive: config.AD_SLOTS.RESPONSIVE
  };

  const adSlot = adSlots[type];

  if (!adSlot) {
    console.warn(`Ad slot not configured for type: ${type}`);
    return null;
  }

  return (
    <div className={`google-ad-container ${type} ${className}`}>
      {showLabel && config.SETTINGS.SHOW_AD_LABELS && <div className="ad-label" />}
      <GoogleAd
        adSlot={adSlot}
        adFormat={type === 'responsive' ? 'auto' : undefined}
        responsive={type === 'responsive'}
        className={type}
      />
    </div>
  );
};

export default AdBanner;