/**
 * Google Analytics 4 Component
 * Handles page view tracking and GA4 initialization
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initGA, trackPageView } from '@/utils/analytics';

export const GoogleAnalytics = () => {
  const location = useLocation();

  // Initialize GA4 on mount
  useEffect(() => {
    const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
    
    if (GA_MEASUREMENT_ID) {
      initGA(GA_MEASUREMENT_ID);
    } else {
      console.warn('⚠️ GA4 Measurement ID not found. Add VITE_GA_MEASUREMENT_ID to .env');
    }
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (import.meta.env.VITE_GA_MEASUREMENT_ID && document.title) {
      trackPageView(location.pathname + location.search, document.title);
    }
  }, [location]);

  return null;
};

