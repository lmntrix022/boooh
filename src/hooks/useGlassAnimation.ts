import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface GlassAnimationProps {
  onHover?: boolean;
  duration?: number;
}

export const useGlassAnimation = <T extends HTMLElement>({ onHover = false, duration = 0.3 }: GlassAnimationProps = {}) => {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    if (onHover) {
      const enterAnimation = () => {
        gsap.to(element, {
          duration,
          scale: 1.02,
          ease: 'power2.out',
        });
      };

      const leaveAnimation = () => {
        gsap.to(element, {
          duration,
          scale: 1,
          ease: 'power2.out',
        });
      };

      element.addEventListener('mouseenter', enterAnimation);
      element.addEventListener('mouseleave', leaveAnimation);

      return () => {
        element.removeEventListener('mouseenter', enterAnimation);
        element.removeEventListener('mouseleave', leaveAnimation);
      };
    }
  }, [onHover, duration]);

  return elementRef;
};

export default useGlassAnimation; 