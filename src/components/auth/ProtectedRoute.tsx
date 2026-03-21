import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoading } from '@/components/ui/loading';
import React from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Composant pour protéger les routes qui nécessitent une authentification
 * Redirige vers /auth si l'utilisateur n'est pas connecté
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Afficher un loader pendant la vérification de l'authentification
  if (loading) {
    return <PageLoading />;
  }

  // Si pas d'utilisateur connecté, rediriger vers /auth
  // On sauvegarde la location actuelle pour rediriger après connexion
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Utilisateur connecté, afficher le contenu
  return <>{children}</>;
};

export default ProtectedRoute;
