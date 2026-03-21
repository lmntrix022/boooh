/**
 * ContactTimeline Component
 * 
 * Composant modulaire pour la timeline des activités d'un contact
 * Extrait de ContactCRMDetail.tsx pour améliorer la maintenabilité
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

interface ContactTimelineProps {
  activities: Activity[];
  onActivityClick: (activity: Activity) => void;
  getActivityIcon: (type: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  cardId?: string | null;
}

export const ContactTimeline: React.FC<ContactTimelineProps> = ({
  activities,
  onActivityClick,
  getActivityIcon,
  getStatusColor,
  cardId
}) => {
  const { t, currentLanguage } = useLanguage();

  // Fonction utilitaire pour formater les dates de manière sécurisée
  const formatDateSafe = (dateString: string | null | undefined, formatStr: string = 'PPP'): string => {
    if (!dateString) return t('crmDetail.timeline.noDate') || 'Date inconnue';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return t('crmDetail.timeline.noDate') || 'Date inconnue';
      }
      return format(date, formatStr, { 
        locale: currentLanguage === 'fr' ? fr : enUS 
      });
    } catch (error) {
      return t('crmDetail.timeline.noDate') || 'Date inconnue';
    }
  };

  const getActivityLink = (activity: Activity) => {
    switch (activity.type) {
      case 'order_physical':
      case 'order_digital':
        return cardId ? `/cards/${cardId}/orders` : `/orders`;
      case 'purchase_digital':
        return `/my-purchases`;
      case 'appointment':
        return cardId ? `/cards/${cardId}/appointments` : `/appointments`;
      case 'quote':
        return `/portfolio/projects`;
      case 'invoice':
        return `/facture`;
      default:
        return '#';
    }
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500 bg-white rounded-lg border border-gray-200 shadow-sm p-8">
        <Activity className="w-16 h-16 mx-auto mb-4 opacity-50 text-gray-400" />
        <p className="text-lg font-light tracking-tight"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            fontWeight: 300,
            letterSpacing: '-0.02em',
          }}
        >{t('crmDetail.timeline.empty')}</p>
        <p className="text-sm mt-2 font-light"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            fontWeight: 300,
          }}
        >{t('crmDetail.timeline.emptyDescription')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {activities.map((activity, index) => {
        const activityLink = getActivityLink(activity);
        const isClickable = activityLink !== '#';

        return (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex gap-4 p-5 bg-white rounded-lg border border-gray-200 transition-all duration-200 hover:shadow-sm ${
              isClickable 
                ? 'cursor-pointer group' 
                : ''
            }`}
            onClick={() => {
              if (isClickable) {
                onActivityClick(activity);
              }
            }}
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 border border-gray-200">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-light text-lg text-gray-900 tracking-tight"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {activity.title}
                  </h4>
                  <p className="text-gray-500 font-light"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >{activity.description}</p>
                </div>
                <Badge className={cn(getStatusColor(activity.status), "font-light")}
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >
                  {t(`crmDetail.status.${activity.status}`) || activity.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDateSafe(activity.created_at)}
                </span>
                {isClickable && (
                  <span className="flex items-center gap-1 text-gray-600 group-hover:text-gray-900">
                    <Eye className="w-4 h-4" />
                    {t('crmDetail.timeline.viewDetails')}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ContactTimeline;
