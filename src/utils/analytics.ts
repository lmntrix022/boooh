/**
 * Google Analytics 4 (GA4) Integration
 * Track page views and custom events
 */

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

let isInitialized = false;

/**
 * Initialize Google Analytics 4
 * @param measurementId - GA4 Measurement ID (format: G-XXXXXXXXXX)
 */
export const initGA = (measurementId: string) => {
  if (typeof window === 'undefined' || isInitialized) {
    return;
  }

  // Initialize dataLayer and gtag function first (even if script fails to load)
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }

  // Load GA4 script with error handling
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.async = true;
  
  // Handle script loading errors silently
  script.onerror = () => {
    // Silently fail - analytics is not critical for app functionality
    if (import.meta.env.DEV) {
      console.warn('⚠️ Google Analytics script failed to load (network issue)');
    }
  };
  
  script.onload = () => {
    gtag('js', new Date());
    gtag('config', measurementId, {
      send_page_view: true,
      page_title: document.title,
      page_location: window.location.href,
      // Additional config
      anonymize_ip: true,
      cookie_flags: 'SameSite=None;Secure',
    });
    
    if (import.meta.env.DEV) {
      console.log('✅ GA4 initialized:', measurementId);
    }
  };
  
  document.head.appendChild(script);

  // Export gtag globally (works even if script fails)
  window.gtag = gtag;
  isInitialized = true;
};

/**
 * Track a page view
 * @param url - Page path
 * @param title - Page title
 */
export const trackPageView = (url: string, title: string) => {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId) {
    return;
  }

  window.gtag('config', measurementId, {
    page_path: url,
    page_title: title,
  });

  console.log('📊 Page view tracked:', url);
};

/**
 * Track a custom event
 * @param eventName - Event name (e.g., 'signup', 'purchase')
 * @param params - Event parameters
 */
export const trackEvent = (
  eventName: string,
  params?: Record<string, any>
) => {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('event', eventName, params);
  console.log('📊 Event tracked:', eventName, params);
};

/**
 * Track conversion events
 */
export const trackConversion = {
  signup: (method: string = 'email') => {
    trackEvent('signup', { method, timestamp: new Date().toISOString() });
  },
  
  signupComplete: (plan: string = 'free') => {
    trackEvent('signup_complete', { 
      plan,
      timestamp: new Date().toISOString() 
    });
  },
  
  buttonClick: (buttonName: string) => {
    trackEvent('button_click', { 
      button_name: buttonName,
      timestamp: new Date().toISOString()
    });
  },
  
  purchase: (value: number, currency: string = 'XOF', plan: string) => {
    trackEvent('purchase', {
      value,
      currency,
      plan,
      timestamp: new Date().toISOString()
    });
  },
  
  contactForm: () => {
    trackEvent('contact_form_submit', {
      timestamp: new Date().toISOString()
    });
  },
  
  download: (resourceName: string) => {
    trackEvent('download', {
      resource_name: resourceName,
      timestamp: new Date().toISOString()
    });
  }
};

