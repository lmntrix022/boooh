import React from 'react';

interface SchemaArticleProps {
  title: string;
  description: string;
  image: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  url: string;
}

/**
 * Component pour injecter le schéma BlogPosting JSON-LD
 */
export const SchemaArticle: React.FC<SchemaArticleProps> = ({
  title,
  description,
  image,
  author,
  datePublished,
  dateModified,
  url
}) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'headline': title,
    'description': description,
    'image': image,
    'author': {
      '@type': 'Person',
      'name': author
    },
    'datePublished': datePublished,
    'dateModified': dateModified || datePublished,
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': url
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'Booh',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://booh.app/logo.svg'
      }
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
  }, [title, description, image, author, datePublished, dateModified, url]);

  return null;
};
