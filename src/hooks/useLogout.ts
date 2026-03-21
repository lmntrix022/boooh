import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCardStore } from '@/stores/cardStore';

/**
 * Hook centralisé pour la déconnexion
 * 
 * Remplace les 3 implémentations dupliquées:
 * - DashboardLayout.tsx (lignes 316-345)
 * - Sidebar.tsx (lignes 143-178)
 * - AuthContext.tsx (lignes 300-318)
 * 
 * @returns Fonction de déconnexion
 */
export const useLogout = () => {
  const { signOut } = useAuth();
  const { setSelectedCardId } = useCardStore();

  const logout = useCallback(async () => {
    
    try {
      // 1. Nettoyer le store Zustand
      setSelectedCardId(null);
      
      // 2. Appeler signOut de AuthContext
      if (signOut) {
        await signOut();
        
        // 3. Nettoyer le cache client
        localStorage.clear();
        sessionStorage.clear();
        
        // 4. Rediriger vers /auth
        window.location.href = '/auth';
      } else {
        console.warn('⚠️ signOut function not available');
        // Fallback: nettoyage manuel
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/auth';
      }
    } catch (error) {
      console.error('❌ Error during logout:', error);
      // Force logout même en cas d'erreur
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/auth';
    }
  }, [signOut, setSelectedCardId]);

  return logout;
};

