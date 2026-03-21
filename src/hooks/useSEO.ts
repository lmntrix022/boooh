import { useEffect } from 'react';

interface SEOMeta {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  author?: string;
  publishedDate?: string;
  twitterHandle?: string;
  keywords?: string;
}

/**
 * Hook personnalisé pour gérer les meta tags SEO dynamiques
 * Alternative à React Helmet si non disponible
 */
export const useSEO = (meta: SEOMeta) => {
  const {
    title,
    description,
    image = 'https://booh.ga/og-image-default.png',
    url = typeof window !== 'undefined' ? window.location.href : 'https://booh.ga',
    type = 'website',
    author,
    publishedDate,
    twitterHandle = '@booh',
    keywords
  } = meta;

  useEffect(() => {
    // Update page title
    document.title = title;

    // Update or create meta description
    let descMeta = document.querySelector('meta[name="description"]');
    if (!descMeta) {
      descMeta = document.createElement('meta');
      descMeta.setAttribute('name', 'description');
      document.head.appendChild(descMeta);
    }
    descMeta.setAttribute('content', description);

    // Update or create keywords meta
    if (keywords) {
      let keywordsMeta = document.querySelector('meta[name="keywords"]');
      if (!keywordsMeta) {
        keywordsMeta = document.createElement('meta');
        keywordsMeta.setAttribute('name', 'keywords');
        document.head.appendChild(keywordsMeta);
      }
      keywordsMeta.setAttribute('content', keywords);
    }

    // Update or create Open Graph tags
    const updateOrCreateMeta = (property: string, content: string, isProperty = true) => {
      const selector = isProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`;
      let meta = document.querySelector(selector);
      if (!meta) {
        meta = document.createElement('meta');
        if (isProperty) {
          meta.setAttribute('property', property);
        } else {
          meta.setAttribute('name', property);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // OG Meta Tags
    updateOrCreateMeta('og:title', title);
    updateOrCreateMeta('og:description', description);
    updateOrCreateMeta('og:image', image);
    updateOrCreateMeta('og:url', url);
    updateOrCreateMeta('og:type', type);
    updateOrCreateMeta('og:site_name', 'Booh');
    updateOrCreateMeta('og:locale', 'fr_FR');

    // Twitter Card Tags
    updateOrCreateMeta('twitter:card', 'summary_large_image', false);
    updateOrCreateMeta('twitter:title', title, false);
    updateOrCreateMeta('twitter:description', description, false);
    updateOrCreateMeta('twitter:image', image, false);
    updateOrCreateMeta('twitter:site', twitterHandle, false);
    updateOrCreateMeta('twitter:creator', twitterHandle, false);

    // Article specific meta
    if (publishedDate) {
      updateOrCreateMeta('article:published_time', publishedDate);
    }
    if (author) {
      updateOrCreateMeta('article:author', author);
    }

    // Canonical tag
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

  }, [title, description, image, url, type, author, publishedDate, twitterHandle, keywords]);
};
