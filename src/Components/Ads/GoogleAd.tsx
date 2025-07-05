import React, { useEffect, useRef } from 'react';
import { getAdConfig } from '../../config/adsConfig';

interface GoogleAdProps {
  adSlot: string;
  adClient?: string;
  adFormat?: string;
  adStyle?: React.CSSProperties;
  className?: string;
  responsive?: boolean;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

const GoogleAd: React.FC<GoogleAdProps> = ({
  adSlot,
  adClient,
  adFormat = "auto",
  adStyle = { display: 'block' },
  className = "",
  responsive = true
}) => {
  const config = getAdConfig();
  const finalAdClient = adClient || config.CLIENT_ID;
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!config.ENABLED) {
      if (config.DEBUG) {
        console.log('🚫 Ad rendering disabled');
      }
      return;
    }

    try {
      // Check if adsbygoogle is available
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        // Push ad to adsbygoogle array to initialize
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        
        if (config.DEBUG) {
          console.log('📢 Ad initialized:', { slot: adSlot, client: finalAdClient });
        }
      }
    } catch (error) {
      console.warn('Google Ad failed to load:', error);
    }
  }, []);

  // Don't render ads in development or if disabled
  if (!config.ENABLED) {
    return (
      <div className={`ad-placeholder ${className}`} style={adStyle}>
        <div style={{ 
          padding: '20px', 
          background: '#f0f0f0', 
          textAlign: 'center', 
          border: '2px dashed #ccc',
          color: '#666'
        }}>
          📢 Ad Placeholder<br />
          <small>Slot: {adSlot}</small>
        </div>
      </div>
    );
  }

  const adProps = {
    className: `adsbygoogle ${className}`,
    style: adStyle,
    'data-ad-client': finalAdClient,
    'data-ad-slot': adSlot,
    'data-ad-format': adFormat,
    ...(responsive && { 'data-full-width-responsive': 'true' })
  };

  return (
    <div ref={adRef}>
      <ins {...adProps} />
    </div>
  );
};

export default GoogleAd;