import { useEffect, useState, useRef, RefObject } from 'react';

interface UseInViewportOptions {
  threshold?: number; // 0 à 1, défaut 0.1
  rootMargin?: string; // Marge avant de charger (ex: '200px' = charge 200px avant)
  triggerOnce?: boolean; // Ne déclenche qu'une seule fois
}

/**
 * Hook pour détecter quand un élément entre dans le viewport
 * Utilise Intersection Observer pour une performance optimale
 * 
 * @example
 * const ref = useRef(null);
 * const isVisible = useInViewport(ref, { rootMargin: '200px', triggerOnce: true });
 */
export function useInViewport<T extends HTMLElement>(
  ref: RefObject<T>,
  options: UseInViewportOptions = {}
): boolean {
  const {
    threshold = 0.1,
    rootMargin = '200px', // Charge 200px avant que l'élément soit visible
    triggerOnce = true,
  } = options;

  const [isInView, setIsInView] = useState(false);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Si déjà déclenché et triggerOnce est true, ne rien faire
    if (hasTriggeredRef.current && triggerOnce) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting;
        
        if (inView) {
          setIsInView(true);
          if (triggerOnce) {
            hasTriggeredRef.current = true;
            observer.disconnect(); // Arrête d'observer une fois déclenché
          }
        } else if (!triggerOnce) {
          setIsInView(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, threshold, rootMargin, triggerOnce]);

  return isInView;
}

/**
 * Hook similaire mais retourne un ref à assigner
 * Plus simple à utiliser quand on n'a pas besoin de créer le ref ailleurs
 * 
 * @example
 * const [ref, isVisible] = useInViewportRef({ rootMargin: '200px' });
 * return <div ref={ref}>{isVisible && <HeavyComponent />}</div>
 */
export function useInViewportRef<T extends HTMLElement>(
  options: UseInViewportOptions = {}
): [RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const isVisible = useInViewport(ref, options);
  return [ref, isVisible];
}

