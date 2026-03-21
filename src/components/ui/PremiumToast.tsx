import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PremiumToastProps {
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose?: () => void;
  duration?: number;
  className?: string;
}

export const PremiumToast: React.FC<PremiumToastProps> = ({
  title,
  description,
  type = 'info',
  onClose,
  duration = 5000,
  className
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300); // Attendre la fin de l'animation
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-black" />;
      default:
        return <Info className="w-5 h-5 text-black" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50/90 backdrop-blur-xl',
          border: 'border-green-200/50',
          shadow: 'shadow-lg shadow-green-100/30',
          title: 'text-green-800',
          description: 'text-green-600'
        };
      case 'error':
        return {
          bg: 'bg-red-50/90 backdrop-blur-xl',
          border: 'border-red-200/50',
          shadow: 'shadow-lg shadow-red-100/30',
          title: 'text-red-800',
          description: 'text-red-600'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50/90 backdrop-blur-xl',
          border: 'border-yellow-200/50',
          shadow: 'shadow-lg shadow-yellow-100/30',
          title: 'text-yellow-800',
          description: 'text-yellow-600'
        };
      case 'info':
        return {
          bg: 'bg-blue-50/90 backdrop-blur-xl',
          border: 'border-blue-200/50',
          shadow: 'shadow-lg shadow-blue-100/30',
          title: 'text-blue-800',
          description: 'text-blue-600'
        };
      default:
        return {
          bg: 'bg-blue-50/90 backdrop-blur-xl',
          border: 'border-blue-200/50',
          shadow: 'shadow-lg shadow-blue-100/30',
          title: 'text-blue-800',
          description: 'text-blue-600'
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 max-w-sm w-full",
        "transform transition-all duration-300 ease-out",
        isVisible 
          ? "translate-x-0 opacity-100 scale-100" 
          : "translate-x-full opacity-0 scale-95",
        className
      )}
    >
      <div
        className={cn(
          "rounded-2xl p-4 border-2",
          "animate-in slide-in-from-right-2 duration-300",
          styles.bg,
          styles.border,
          styles.shadow
        )}
      >
        <div className="flex items-start gap-3">
          {/* Icône */}
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          
          {/* Contenu */}
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "text-sm font-semibold leading-5",
              styles.title
            )}>
              {title}
            </h3>
            {description && (
              <p className={cn(
                "mt-1 text-sm leading-4",
                styles.description
              )}>
                {description}
              </p>
            )}
          </div>
          
          {/* Bouton fermer */}
          <button
            onClick={handleClose}
            className={cn(
              "flex-shrink-0 ml-2 p-1 rounded-full",
              "transition-all duration-200",
              "hover:bg-black/5 active:scale-95",
              "focus:outline-none focus:ring-2 focus:ring-black/50"
            )}
          >
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
        
        {/* Barre de progression */}
        {duration > 0 && (
          <div className="mt-3 h-1 bg-black/10 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-300 ease-linear",
                type === 'success' && "bg-green-500",
                type === 'error' && "bg-red-500",
                type === 'warning' && "bg-yellow-500",
                type === 'info' && "bg-black"
              )}
              style={{
                width: isVisible ? '100%' : '0%',
                transitionDuration: `${duration}ms`
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Hook pour gérer les toasts
export const usePremiumToast = () => {
  const [toasts, setToasts] = React.useState<Array<PremiumToastProps & { id: string }>>([]);

  const addToast = (toast: Omit<PremiumToastProps, 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const success = (title: string, description?: string) => {
    addToast({ title, description, type: 'success' });
  };

  const error = (title: string, description?: string) => {
    addToast({ title, description, type: 'error' });
  };

  const warning = (title: string, description?: string) => {
    addToast({ title, description, type: 'warning' });
  };

  const info = (title: string, description?: string) => {
    addToast({ title, description, type: 'info' });
  };

  return {
    toasts,
    success,
    error,
    warning,
    info,
    removeToast
  };
};

// Composant conteneur pour afficher tous les toasts
export const PremiumToastContainer: React.FC = () => {
  const { toasts, removeToast } = usePremiumToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <PremiumToast
          key={toast.id}
          {...toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}; 