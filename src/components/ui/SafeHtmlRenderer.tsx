import React from 'react';

interface SafeHtmlRendererProps {
  content: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export const SafeHtmlRenderer: React.FC<SafeHtmlRendererProps> = ({
  content,
  className = '',
  as: Component = 'div'
}) => {
  // Nettoyer le contenu HTML pour éviter les injections XSS
  const sanitizeHtml = (html: string): string => {
    // Liste des balises autorisées
    const allowedTags = [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'a'
    ];
    
    // Créer un élément temporaire pour parser le HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Fonction récursive pour nettoyer les nœuds
    const cleanNode = (node: Node): Node | null => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node;
      }
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();
        
        if (allowedTags.includes(tagName)) {
          // Créer un nouvel élément avec les attributs autorisés
          const newElement = document.createElement(tagName);
          
          // Copier les attributs autorisés
          if (tagName === 'a' && element.hasAttribute('href')) {
            const href = element.getAttribute('href');
            if (href && (href.startsWith('http') || href.startsWith('/'))) {
              newElement.setAttribute('href', href);
              newElement.setAttribute('target', '_blank');
              newElement.setAttribute('rel', 'noopener noreferrer');
            }
          }
          
          // Nettoyer récursivement les enfants
          Array.from(element.childNodes).forEach(child => {
            const cleanChild = cleanNode(child);
            if (cleanChild) {
              newElement.appendChild(cleanChild);
            }
          });
          
          return newElement;
        } else {
          // Si la balise n'est pas autorisée, ne garder que le texte
          const textContent = element.textContent || '';
          return document.createTextNode(textContent);
        }
      }
      
      return null;
    };
    
    // Nettoyer tous les nœuds
    const cleanNodes = Array.from(temp.childNodes)
      .map(child => cleanNode(child))
      .filter(node => node !== null);
    
    // Créer un nouveau conteneur avec le contenu nettoyé
    const cleanContainer = document.createElement('div');
    cleanNodes.forEach(node => {
      if (node) {
        cleanContainer.appendChild(node);
      }
    });
    
    return cleanContainer.innerHTML;
  };

  // Si le contenu est vide, ne rien rendre
  if (!content || content.trim() === '') {
    return null;
  }

  // Nettoyer le contenu HTML
  const sanitizedContent = sanitizeHtml(content);

  return (
    <Component
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};
