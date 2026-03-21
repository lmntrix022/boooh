/**
 * SchemaLocalBusiness Component
 * Injects JSON-LD LocalBusiness schema for rich snippets
 * 
 * Used for Contact page to help Google understand:
 * - Business name and type
 * - Contact information
 * - Address
 * - Social profiles
 * - Website
 * 
 * Phase 3.4: Rich Snippets Implementation
 */

import React from 'react';

interface LocalBusinessSchemaProps {
  name?: string;
  type?: 'LocalBusiness' | 'ProfessionalService' | 'Organization';
  description?: string;
  phone?: string;
  email?: string;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  url?: string;
  logo?: string;
  image?: string;
  sameAs?: string[];
  priceRange?: string;
  openingHours?: Array<{
    dayOfWeek: string;
    opens: string;
    closes: string;
  }>;
}

export const SchemaLocalBusiness: React.FC<LocalBusinessSchemaProps> = ({
  name = 'Booh',
  type = 'Organization',
  description = 'Plateforme de création de cartes de visite digitales modernes et professionnelles',
  phone = '+241 077 000 000',
  email = 'support@booh.app',
  address = {
    streetAddress: '',
    addressLocality: 'Libreville',
    postalCode: '',
    addressCountry: 'GA',
  },
  url = 'https://booh.app',
  logo = 'https://booh.app/logo.svg',
  image = 'https://booh.app/og-image-default.png',
  sameAs = [
    'https://facebook.com/booh',
    'https://twitter.com/booh',
    'https://linkedin.com/company/booh',
    'https://instagram.com/booh',
  ],
  priceRange = '$$',
  openingHours = [
    { dayOfWeek: 'Monday', opens: '09:00', closes: '18:00' },
    { dayOfWeek: 'Tuesday', opens: '09:00', closes: '18:00' },
    { dayOfWeek: 'Wednesday', opens: '09:00', closes: '18:00' },
    { dayOfWeek: 'Thursday', opens: '09:00', closes: '18:00' },
    { dayOfWeek: 'Friday', opens: '09:00', closes: '18:00' },
  ],
}) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': type,
    name,
    description,
    url,
    logo,
    image,
    telephone: phone,
    email,
    sameAs,
    address: {
      '@type': 'PostalAddress',
      streetAddress: address.streetAddress || '',
      addressLocality: address.addressLocality || 'Libreville',
      postalCode: address.postalCode || '',
      addressCountry: address.addressCountry || 'GA',
    },
    priceRange,
    openingHoursSpecification: openingHours.map(hour => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: hour.dayOfWeek,
      opens: hour.opens,
      closes: hour.closes,
    })),
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: phone,
      contactType: 'Customer Support',
      email,
      url: `${url}/contact`,
    },
  };

  React.useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return null;
};

export default SchemaLocalBusiness;
