import React from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, Calendar, FileText, CreditCard, Mail, Target
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/useLanguage';

interface ContactActionsProps {
  suggestions: Array<{
    type: string;
    title: string;
    description: string;
    priority: string;
  }>;
  handleQuickAction: (actionType: 'appointment' | 'quote' | 'invoice' | 'email') => void;
  handleRecommendedAction: (suggestion: any) => void;
}

export const ContactActions: React.FC<ContactActionsProps> = ({
  suggestions,
  handleQuickAction,
  handleRecommendedAction
}) => {
  const { t } = useLanguage();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8"
    >
      {/* Actions Rapides */}
      <Card className="bg-white rounded-lg border border-gray-200 shadow-sm transition-all duration-200">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-light tracking-tight"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 300,
                letterSpacing: '-0.02em',
              }}
            >{t('crmDetail.contactActions.quickActions')}</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 gap-y-4 sm:gap-y-5">
            <Button
              onClick={() => handleQuickAction('appointment')}
              variant="outline"
              className="bg-white border border-gray-200 hover:bg-gray-50 h-auto p-3 sm:p-4 flex flex-col items-center gap-1 sm:gap-2 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              <span className="text-xs sm:text-sm text-gray-900">{t('crmDetail.contactActions.createAppointment')}</span>
            </Button>
            <Button
              onClick={() => handleQuickAction('quote')}
              variant="outline"
              className="bg-white border border-gray-200 hover:bg-gray-50 h-auto p-3 sm:p-4 flex flex-col items-center gap-1 sm:gap-2 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              <span className="text-xs sm:text-sm text-gray-900">{t('crmDetail.contactActions.createQuote')}</span>
            </Button>
            <Button
              onClick={() => handleQuickAction('invoice')}
              variant="outline"
              className="bg-white border border-gray-200 hover:bg-gray-50 h-auto p-3 sm:p-4 flex flex-col items-center gap-1 sm:gap-2 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              <span className="text-xs sm:text-sm text-gray-900">{t('crmDetail.contactActions.createInvoice')}</span>
            </Button>
            <Button
              onClick={() => handleQuickAction('email')}
              variant="outline"
              className="bg-white border border-gray-200 hover:bg-gray-50 h-auto p-3 sm:p-4 flex flex-col items-center gap-1 sm:gap-2 font-light"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                fontWeight: 300,
              }}
            >
              <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              <span className="text-xs sm:text-sm text-gray-900">{t('crmDetail.contactActions.sendEmail')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions Recommandées */}
      {suggestions.length > 0 && (
        <Card className="bg-white rounded-lg border border-gray-200 shadow-sm transition-all duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-light tracking-tight"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontWeight: 300,
                  letterSpacing: '-0.02em',
                }}
              >{t('crmDetail.contactActions.recommendedActions')}</h3>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all duration-200 gap-2">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                      <span className="font-light text-gray-900 text-sm sm:text-base tracking-tight"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                          fontWeight: 300,
                          letterSpacing: '-0.01em',
                        }}
                      >{suggestion.title}</span>
                      <Badge variant="outline" className={`text-xs bg-white border font-light ${
                        suggestion.priority === 'high' ? 'border-gray-300 text-gray-700 bg-gray-100' :
                        suggestion.priority === 'medium' ? 'border-gray-300 text-gray-700 bg-gray-100' :
                        'border-gray-200 text-gray-600 bg-white'
                      }`}
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {suggestion.priority === 'high' ? t('crmDetail.contactActions.urgent') : suggestion.priority === 'medium' ? t('crmDetail.contactActions.important') : t('crmDetail.contactActions.normal')}
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 font-light"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >{suggestion.description}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleRecommendedAction(suggestion)}
                    variant="outline"
                    className="bg-white border border-gray-200 hover:bg-gray-50 text-xs sm:text-sm px-3 py-1 sm:px-4 sm:py-2 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {t('crmDetail.contactActions.execute')}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};
