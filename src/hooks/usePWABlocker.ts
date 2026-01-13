import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to block PWA install prompts on public routes
 * This ensures customers coming from WhatsApp, Instagram, etc. 
 * have a seamless web experience without install interruptions
 */
export const usePWABlocker = () => {
  const location = useLocation();

  useEffect(() => {
    // Define public routes where PWA install should be blocked
    const publicRoutes = ['/chat', '/vitrine', '/loja'];
    const isPublicRoute = publicRoutes.some(route => 
      location.pathname.startsWith(route)
    );

    if (isPublicRoute) {
      // Block the beforeinstallprompt event on public routes
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        // Don't store the event - we never want to show the prompt on public routes
        return false;
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      // Also prevent any existing prompts
      if ('getInstalledRelatedApps' in navigator) {
        // This API helps detect if app is already installed
        // We use it to ensure we don't prompt on public routes
      }

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, [location.pathname]);
};

export default usePWABlocker;
