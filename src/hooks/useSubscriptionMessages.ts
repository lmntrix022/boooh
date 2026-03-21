import { useState, useCallback } from 'react';
import { usePremiumToast } from './usePremiumToast';
import SubscriptionMessagesService, { 
  SubscriptionMessage, 
  SubscriptionErrorContext 
} from '@/services/subscriptionMessages';

export interface SubscriptionMessageState {
  id: string;
  message: SubscriptionMessage;
  type: 'error' | 'warning' | 'info' | 'success';
  dismissible: boolean;
  timestamp: number;
}

export const useSubscriptionMessages = () => {
  const toast = usePremiumToast();
  const [messages, setMessages] = useState<SubscriptionMessageState[]>([]);

  /**
   * Display quota exceeded message
   */
  const showQuotaExceededMessage = useCallback((
    feature: string,
    currentCount: number,
    maxLimit: number,
    planType?: string
  ) => {
    const message = SubscriptionMessagesService.getQuotaExceededMessage(
      feature,
      currentCount,
      maxLimit,
      planType as any
    );

    // Show toast
    toast.warning(message.title, message.description);

    // Add to messages list
    const id = `quota-${feature}-${Date.now()}`;
    setMessages(prev => [...prev, {
      id,
      message,
      type: 'warning',
      dismissible: true,
      timestamp: Date.now(),
    }]);

    return id;
  }, [toast]);

  /**
   * Display feature not available message
   */
  const showFeatureNotAvailableMessage = useCallback((
    featureName: string,
    requiredPlan?: string
  ) => {
    const message = SubscriptionMessagesService.getFeatureNotAvailableMessage(
      featureName,
      requiredPlan
    );

    // Show toast
    toast.warning(message.title, message.description);

    // Add to messages list
    const id = `feature-${featureName}-${Date.now()}`;
    setMessages(prev => [...prev, {
      id,
      message,
      type: 'warning',
      dismissible: true,
      timestamp: Date.now(),
    }]);

    return id;
  }, [toast]);

  /**
   * Display upgrade suggestion message
   */
  const showUpgradeSuggestionMessage = useCallback((
    currentPlan: string,
    reason: string,
    nextPlan?: string
  ) => {
    const message = SubscriptionMessagesService.getUpgradeSuggestionMessage(
      currentPlan,
      reason,
      nextPlan
    );

    // Show toast
    toast.info(message.title, message.description);

    // Add to messages list
    const id = `upgrade-${reason}-${Date.now()}`;
    setMessages(prev => [...prev, {
      id,
      message,
      type: 'info',
      dismissible: true,
      timestamp: Date.now(),
    }]);

    return id;
  }, [toast]);

  /**
   * Display addon recommendation message
   */
  const showAddonRecommendationMessage = useCallback((
    addonType: string,
    benefit: string
  ) => {
    const message = SubscriptionMessagesService.getAddonRecommendationMessage(
      addonType,
      benefit
    );

    // Show toast
    toast.info(message.title, message.description);

    // Add to messages list
    const id = `addon-${addonType}-${Date.now()}`;
    setMessages(prev => [...prev, {
      id,
      message,
      type: 'info',
      dismissible: true,
      timestamp: Date.now(),
    }]);

    return id;
  }, [toast]);

  /**
   * Display payment error message
   */
  const showPaymentErrorMessage = useCallback((errorCode?: string) => {
    const message = SubscriptionMessagesService.getPaymentErrorMessage(errorCode);

    // Show toast
    toast.error(message.title, message.description);

    // Add to messages list
    const id = `payment-error-${errorCode || 'unknown'}-${Date.now()}`;
    setMessages(prev => [...prev, {
      id,
      message,
      type: 'error',
      dismissible: true,
      timestamp: Date.now(),
    }]);

    return id;
  }, [toast]);

  /**
   * Display subscription status message
   */
  const showSubscriptionStatusMessage = useCallback((
    status: string,
    planName?: string,
    renewalDate?: Date
  ) => {
    const message = SubscriptionMessagesService.getSubscriptionStatusMessage(
      status,
      planName,
      renewalDate
    );

    // Show toast
    const typeMap = {
      'active': 'success' as const,
      'pending': 'info' as const,
      'cancelled': 'warning' as const,
      'expired': 'error' as const,
      'past_due': 'error' as const,
    };

    const type = typeMap[status as keyof typeof typeMap] || 'info';
    if (type === 'success') {
      toast.success(message.title, message.description);
    } else if (type === 'error') {
      toast.error(message.title, message.description);
    } else if (type === 'warning') {
      toast.warning(message.title, message.description);
    } else {
      toast.info(message.title, message.description);
    }

    // Add to messages list
    const id = `status-${status}-${Date.now()}`;
    setMessages(prev => [...prev, {
      id,
      message,
      type,
      dismissible: true,
      timestamp: Date.now(),
    }]);

    return id;
  }, [toast]);

  /**
   * Display contextual message based on type and context
   */
  const showContextualMessage = useCallback((
    messageType: 'quota_exceeded' | 'feature_unavailable' | 'upgrade_suggested' | 'addon_recommended' | 'payment_error' | 'status_update',
    context: SubscriptionErrorContext & { [key: string]: any }
  ) => {
    const message = SubscriptionMessagesService.getContextualMessage(
      messageType,
      context
    );

    // Show toast
    const typeMap: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
      'quota_exceeded': 'warning',
      'feature_unavailable': 'warning',
      'upgrade_suggested': 'info',
      'addon_recommended': 'info',
      'payment_error': 'error',
      'status_update': 'info',
    };

    const type = typeMap[messageType];
    if (type === 'success') {
      toast.success(message.title, message.description);
    } else if (type === 'error') {
      toast.error(message.title, message.description);
    } else if (type === 'warning') {
      toast.warning(message.title, message.description);
    } else {
      toast.info(message.title, message.description);
    }

    // Add to messages list
    const id = `contextual-${messageType}-${Date.now()}`;
    setMessages(prev => [...prev, {
      id,
      message,
      type,
      dismissible: true,
      timestamp: Date.now(),
    }]);

    return id;
  }, [toast]);

  /**
   * Dismiss a message by ID
   */
  const dismissMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  }, []);

  /**
   * Dismiss all messages
   */
  const dismissAllMessages = useCallback(() => {
    setMessages([]);
  }, []);

  /**
   * Get messages of a specific type
   */
  const getMessagesByType = useCallback((type: string) => {
    return messages.filter(m => m.type === type);
  }, [messages]);

  return {
    messages,
    showQuotaExceededMessage,
    showFeatureNotAvailableMessage,
    showUpgradeSuggestionMessage,
    showAddonRecommendationMessage,
    showPaymentErrorMessage,
    showSubscriptionStatusMessage,
    showContextualMessage,
    dismissMessage,
    dismissAllMessages,
    getMessagesByType,
  };
};

export default useSubscriptionMessages;


