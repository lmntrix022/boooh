import React from 'react';
import { AlertCircle, Info, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SubscriptionMessage } from '@/services/subscriptionMessages';

export interface SubscriptionMessageCardProps {
  message: SubscriptionMessage;
  type?: 'error' | 'warning' | 'info' | 'success';
  onAction?: () => void;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export const SubscriptionMessageCard: React.FC<SubscriptionMessageCardProps> = ({
  message,
  type = 'warning',
  onAction,
  dismissible = false,
  onDismiss,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-amber-600" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'info':
      default:
        return <Info className="w-6 h-6 text-blue-600" />;
    }
  };

  const getStyleClasses = () => {
    const baseClasses = 'rounded-lg border p-4 sm:p-6';
    switch (type) {
      case 'error':
        return `${baseClasses} bg-red-50 border-red-200`;
      case 'warning':
        return `${baseClasses} bg-amber-50 border-amber-200`;
      case 'success':
        return `${baseClasses} bg-green-50 border-green-200`;
      case 'info':
      default:
        return `${baseClasses} bg-blue-50 border-blue-200`;
    }
  };

  const getTitleClasses = () => {
    switch (type) {
      case 'error':
        return 'text-red-900';
      case 'warning':
        return 'text-amber-900';
      case 'success':
        return 'text-green-900';
      case 'info':
      default:
        return 'text-blue-900';
    }
  };

  const getDescriptionClasses = () => {
    switch (type) {
      case 'error':
        return 'text-red-700';
      case 'warning':
        return 'text-amber-700';
      case 'success':
        return 'text-green-700';
      case 'info':
      default:
        return 'text-blue-700';
    }
  };

  const getHelpTextClasses = () => {
    switch (type) {
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-amber-600';
      case 'success':
        return 'text-green-600';
      case 'info':
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className={getStyleClasses()}>
      <div className="flex gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 flex pt-0.5">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className={`text-lg font-semibold mb-2 ${getTitleClasses()}`}>
            {message.title}
          </h3>

          {/* Description */}
          <p className={`text-sm mb-3 ${getDescriptionClasses()}`}>
            {message.description}
          </p>

          {/* Help Text */}
          {message.helpText && (
            <p className={`text-xs mb-4 italic ${getHelpTextClasses()}`}>
              💡 {message.helpText}
            </p>
          )}

          {/* Action Button */}
          {(message.actionLabel || onAction) && (
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={onAction}
                className="gap-2"
                variant={type === 'error' ? 'destructive' : 'default'}
              >
                {message.actionLabel || 'Voir plus'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Dismiss Button */}
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fermer"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export interface SubscriptionMessageListProps {
  messages: (SubscriptionMessage & { id: string; type?: 'error' | 'warning' | 'info' | 'success' })[];
  onDismiss?: (id: string) => void;
  onAction?: (id: string) => void;
  className?: string;
}

export const SubscriptionMessageList: React.FC<SubscriptionMessageListProps> = ({
  messages,
  onDismiss,
  onAction,
  className = '',
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {messages.map((message) => (
        <SubscriptionMessageCard
          key={message.id}
          message={message}
          type={message.type || 'warning'}
          dismissible={!!onDismiss}
          onDismiss={() => onDismiss?.(message.id)}
          onAction={() => onAction?.(message.id)}
        />
      ))}
    </div>
  );
};

export default SubscriptionMessageCard;


