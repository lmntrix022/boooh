/**
 * SchemaFAQ Component
 * Injects JSON-LD FAQPage schema for rich snippets
 * 
 * Displays FAQ as rich snippets in Google Search results
 * Improves CTR and user experience
 * 
 * Phase 3.4: Rich Snippets Implementation
 */

import React from 'react';

export interface FAQItem {
  question: string;
  answer: string;
}

interface SchemaFAQProps {
  faqs: FAQItem[];
  mainEntity?: boolean;
}

export const SchemaFAQ: React.FC<SchemaFAQProps> = ({ 
  faqs,
  mainEntity = true 
}) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: mainEntity ? faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })) : undefined,
  };

  // Remove mainEntity if not needed
  if (!mainEntity) {
    delete schema.mainEntity;
  }

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
  }, [faqs]);

  return null;
};

export default SchemaFAQ;
