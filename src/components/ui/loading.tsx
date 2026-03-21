import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({ 
  size = 'md', 
  text = 'Chargement...',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-[200px] ${className}`}>
      <div className="relative">
        <Loader2 
          className={`${sizeClasses[size]} animate-spin text-primary`}
        />
        <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
      </div>
      {text && (
        <p className="mt-4 text-sm text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

// Composant de chargement optimisé pour les pages
export const PageLoading: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <div className="relative inline-block">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground animate-pulse">
          Chargement de l'application...
        </p>
      </div>
    </div>
  );
};

// Composant de chargement pour les composants
export const ComponentLoading: React.FC = () => {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="w-5 h-5 animate-spin text-primary" />
  </div>
  );
};

// Composant de chargement pour les boutons
export const ButtonLoading: React.FC = () => {
  return (
    <Loader2 className="w-4 h-4 animate-spin" />
  );
}; 