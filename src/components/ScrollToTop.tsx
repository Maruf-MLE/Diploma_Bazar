import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 * 
 * Automatically scrolls to the top of the page when the route changes.
 * Place this component inside the Router but outside the Routes in App.tsx.
 */
export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // When route changes, scroll to top with the most compatible method
    try {
      // Try the modern API with fallback to the standard method
      if ('scrollTo' in window) {
        window.scrollTo(0, 0);
      } else {
        // Fallback for very old browsers
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0; // For Safari
      }
      
      // Force immediate check for any layout calculations
      setTimeout(() => {
        // Double-check scroll position
        if (window.pageYOffset > 0) {
          window.scrollTo(0, 0);
        }
      }, 0);
    } catch (e) {
      console.error('Error scrolling to top:', e);
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop; 