import React from 'react';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface SchemaBreadcrumbProps {
  items: BreadcrumbItem[];
}

/**
 * Component pour injecter le schéma BreadcrumbList JSON-LD
 */
export const SchemaBreadcrumb: React.FC<SchemaBreadcrumbProps> = ({ items }) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': item.url
    }))
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
  }, [items]);

  return null;
};
