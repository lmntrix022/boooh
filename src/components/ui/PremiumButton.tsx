import React from 'react';
import { Button } from './button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PremiumButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'default',
  size = 'default',
  loading = false,
  disabled = false,
  className,
  icon,
  iconPosition = 'left'
}) => {
  const isDisabled = disabled || loading;

  return (
    <Button
      type={type}
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        // Base styles
        "relative overflow-hidden transition-all duration-300",
        "font-medium tracking-wide",
        "focus:ring-4 focus:ring-blue-100/50",
        "active:scale-95 transform",
        
        // Hover effects
        !isDisabled && [
          "hover:shadow-lg hover:shadow-blue-100/30",
          "hover:scale-[1.02] transform",
          "hover:-translate-y-0.5"
        ],
        
        // Loading state
        loading && "cursor-wait",
        
        // Premium glassmorphism for default variant
        variant === 'default' && [
          "bg-gradient-to-r from-white-600 to-indigo-600",
          "hover:from-white hover:to-white",
          "text-blue-950 shadow-lg shadow-black/25",
          "border border-black/20"
        ],
        
        // Premium outline variant
        variant === 'outline' && [
          "bg-white/80 backdrop-blur-sm",
          "border-2 border-blue-300",
          "text-blue-700 hover:text-blue-800",
          "hover:bg-blue-50/80",
          "hover:border-blue-400",
          "shadow-lg shadow-blue-100/20"
        ],
        
        // Premium destructive variant
        variant === 'destructive' && [
          "bg-gradient-to-r from-red-500 to-black-500",
          "hover:from-red-600 hover:to-black-600",
          "text-white shadow-lg shadow-red-500/25",
          "border border-red-500/20"
        ],
        
        // Premium secondary variant
        variant === 'secondary' && [
          "bg-gradient-to-r from-gray-100 to-gray-200",
          "hover:from-gray-200 hover:to-gray-300",
          "text-gray-700 hover:text-gray-800",
          "border border-gray-300/50",
          "shadow-lg shadow-gray-100/20"
        ],
        
        className
      )}
    >
      {/* Loader glassy animé */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-md">
          <Loader2 className="w-5 h-5 animate-spin text-current" />
        </div>
      )}
      
      {/* Contenu du bouton */}
      <div className={cn(
        "flex items-center gap-2 transition-opacity duration-300",
        loading && "opacity-0"
      )}>
        {icon && iconPosition === 'left' && (
          <span className="transition-transform duration-300 group-hover:scale-110">
            {icon}
          </span>
        )}
        
        <span>{children}</span>
        
        {icon && iconPosition === 'right' && (
          <span className="transition-transform duration-300 group-hover:scale-110">
            {icon}
          </span>
        )}
      </div>
      
      {/* Effet de brillance au hover */}
      {!isDisabled && (
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 hover:translate-x-full pointer-events-none" />
      )}
    </Button>
  );
};

// Composants spécialisés
export const SubmitButton: React.FC<Omit<PremiumButtonProps, 'type' | 'variant'> & { 
  text?: string;
  loadingText?: string;
}> = ({ 
  text = "Enregistrer", 
  loadingText = "Enregistrement...",
  loading,
  ...props 
}) => (
  <PremiumButton
    {...props}
    type="submit"
    variant="default"
    loading={loading}
    icon={<Save className="w-4 h-4" />}
  >
    {loading ? loadingText : text}
  </PremiumButton>
);

export const CancelButton: React.FC<Omit<PremiumButtonProps, 'variant'> & { 
  text?: string;
}> = ({ 
  text = "Annuler",
  ...props 
}) => (
  <PremiumButton
    {...props}
    variant="outline"
    icon={<X className="w-4 h-4" />}
  >
    {text}
  </PremiumButton>
);

export const DeleteButton: React.FC<Omit<PremiumButtonProps, 'variant'> & { 
  text?: string;
  loadingText?: string;
}> = ({ 
  text = "Supprimer", 
  loadingText = "Suppression...",
  loading,
  ...props 
}) => (
  <PremiumButton
    {...props}
    variant="destructive"
    loading={loading}
    icon={<Trash2 className="w-4 h-4" />}
  >
    {loading ? loadingText : text}
  </PremiumButton>
);

// Import des icônes nécessaires
import { Save, X, Trash2 } from 'lucide-react'; 