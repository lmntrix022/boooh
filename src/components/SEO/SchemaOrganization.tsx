import React from 'react';

/**
 * Component pour injecter le schéma Organization JSON-LD
 */
export const SchemaOrganization: React.FC = () => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'Bööh',
    'url': 'https://booh.ga',
    'logo': 'https://booh.ga/logo.svg',
    'description': 'Plateforme business IA tout-en-un : carte digitale, CRM, e-commerce, facturation, gestion de stock, DRM et protection de fichiers.',
    'sameAs': [
      'https://facebook.com/booh',
      'https://twitter.com/booh',
      'https://linkedin.com/company/booh',
      'https://instagram.com/booh'
    ],
    'contactPoint': {
      '@type': 'ContactPoint',
      'contactType': 'Customer Support',
      'email': 'support@booh.ga',
      'url': 'https://booh.ga/contact'
    },
    'address': {
      '@type': 'PostalAddress',
      'addressCountry': 'GA',
      'addressLocality': 'Libreville',
      'streetAddress': ''
    }
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
