import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar,
  ShoppingCart,
  Eye,
  Share2,
  Download,
  MessageSquare,
  Activity,
  Clock
} from "lucide-react";
import { formatCurrency, formatCurrencyAsync } from "@/utils/format";
import { CURRENCY_CHANGE_EVENT } from "@/components/settings/CurrencySelector";
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { useLanguage } from '@/hooks/useLanguage';

interface Activity {
  id: string;
  type: 'view' | 'order' | 'appointment' | 'share' | 'download' | 'message';
  cardName: string;
  description: string;
  date: string;
  metadata?: {
    amount?: number;
    customerName?: string | null;
    productName?: string;
  };
}

interface RecentActivityProps {
  activities: Activity[];
}

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'view':
      return Eye;
    case 'order':
      return ShoppingCart;
    case 'appointment':
      return Calendar;
    case 'share':
      return Share2;
    case 'download':
      return Download;
    case 'message':
      return MessageSquare;
    default:
      return Eye;
  }
};

const getActivityColor = (type: Activity['type']) => {
  const colors = {
    view: 'bg-gray-100 text-gray-600 border-gray-200',
    order: 'bg-gray-100 text-gray-600 border-gray-200',
    appointment: 'bg-gray-100 text-gray-600 border-gray-200',
    share: 'bg-gray-100 text-gray-600 border-gray-200',
    download: 'bg-gray-100 text-gray-600 border-gray-200',
    message: 'bg-gray-100 text-gray-600 border-gray-200'
  };
  return colors[type];
};

const formatDate = (dateString: string, locale: string): string => {
  try {
    const date = parseISO(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5; // 36e5 is the number of milliseconds in an hour
    const dateLocale = locale === 'fr' ? fr : enUS;

    // Si la date est dans les dernières 24 heures, afficher "il y a X heures/minutes"
    if (diffInHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true, locale: dateLocale });
    }
    
    // Sinon, afficher la date complète
    const formatStr = locale === 'fr' ? 'dd MMMM yyyy à HH:mm' : 'MMMM dd, yyyy at HH:mm';
    return format(date, formatStr, { locale: dateLocale });
  } catch (error) {
    // Error log removed
    return locale === 'fr' ? 'Date invalide' : 'Invalid date';
  }
};

const getTypeBadge = (type: Activity['type'], t: any) => {
  const map = {
    view: { label: t('dashboard.activity.types.view'), color: 'bg-gray-100 text-gray-700 border-gray-200' },
    order: { label: t('dashboard.activity.types.order'), color: 'bg-gray-100 text-gray-700 border-gray-200' },
    appointment: { label: t('dashboard.activity.types.appointment'), color: 'bg-gray-100 text-gray-700 border-gray-200' },
    share: { label: t('dashboard.activity.types.share'), color: 'bg-gray-100 text-gray-700 border-gray-200' },
    download: { label: t('dashboard.activity.types.download'), color: 'bg-gray-100 text-gray-700 border-gray-200' },
    message: { label: t('dashboard.activity.types.message'), color: 'bg-gray-100 text-gray-700 border-gray-200' },
  };
  return map[type] || map['view'];
};

const ActivityIcon = ({ type }: { type: Activity['type'] }) => {
  const Icon = getActivityIcon(type);

  return (
    <motion.div
      className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300"
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.25, type: "tween" }}
    >
      <Icon className="h-6 w-6 text-gray-600" />
    </motion.div>
  );
};

const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  const { t, currentLanguage } = useLanguage();
  const [formattedAmounts, setFormattedAmounts] = useState<Record<string, string>>({});

  const updateAmounts = async () => {
    const newFormattedAmounts: Record<string, string> = {};
    for (const activity of activities) {
      if (activity.metadata?.amount) {
        newFormattedAmounts[activity.id] = await formatCurrencyAsync(activity.metadata.amount);
      }
    }
    setFormattedAmounts(newFormattedAmounts);
  };

  useEffect(() => {
    updateAmounts();
    const handleCurrencyChange = () => { updateAmounts(); };
    window.addEventListener(CURRENCY_CHANGE_EVENT, handleCurrencyChange);
    return () => { window.removeEventListener(CURRENCY_CHANGE_EVENT, handleCurrencyChange); };
  }, [activities]);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Header Ultra-Moderne */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-4">
          <motion.div
            className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            whileHover={{ scale: 1.05 }}
          >
            <Activity className="h-6 w-6 md:h-7 md:w-7 text-gray-600" />
          </motion.div>
          <h2 className="font-light text-2xl md:text-3xl text-gray-900 tracking-tight"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
              letterSpacing: '-0.02em',
            }}
          >
            {t('dashboard.activity.title')}
          </h2>
        </div>
      </motion.div>
      
      {/* Timeline verticale animée Ultra-Moderne avec scroll */}
      <div 
        className="relative pl-8 max-h-[500px] lg:max-h-[700px] overflow-y-auto overflow-x-hidden pr-2"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.05)'
        }}
      >
        <style>{`
          div::-webkit-scrollbar {
            width: 6px;
          }
          div::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.05);
            border-radius: 10px;
          }
          div::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 10px;
          }
          div::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 0, 0, 0.3);
          }
        `}</style>
        <motion.div
          className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200 rounded-full"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
        <div className="flex flex-col gap-4 pb-4">
          {activities.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-gray-500 py-12"
            >
              <div className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-gray-500 font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                  fontWeight: 300,
                }}
              >{t('dashboard.activity.noActivity')}</p>
            </motion.div>
          )}
          {activities.map((activity, i) => {
            const badge = getTypeBadge(activity.type, t);
            const uniqueKey = `${activity.type}-${activity.id}-${i}`;
            return (
              <motion.div
                key={uniqueKey}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ scale: 1.02, y: -4 }}
                className="relative group"
                tabIndex={0}
              >
                {/* Carte d'activité - Apple Minimal */}
                <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 px-6 py-5 overflow-hidden">
                  <div className="relative z-10 flex items-start gap-4">
                {/* Timeline point */}
                    <motion.span
                      className="absolute left-[-30px] top-7 w-3 h-3 rounded-full bg-gray-900 border border-white z-20"
                      whileHover={{ scale: 1.2 }}
                      transition={{ duration: 0.3 }}
                    />
                    
                    {/* Icône contextuelle - Apple Minimal */}
                    <div className="flex-shrink-0">
                      <ActivityIcon type={activity.type} />
                      <motion.span
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 + 0.2 }}
                        className={`mt-2 block px-2.5 py-1 text-xs font-light rounded-lg border ${badge.color} text-center`}
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {badge.label}
                      </motion.span>
                  </div>
                    
                {/* Infos activité */}
                <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <span className="font-light text-base sm:text-lg text-gray-900 truncate tracking-tight"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                            fontWeight: 300,
                            letterSpacing: '-0.02em',
                          }}
                        >
                          {activity.cardName}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-light text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >
                          <Clock className="h-3.5 w-3.5" />
                      <time>{formatDate(activity.date, currentLanguage)}</time>
                    </span>
                  </div>
                      <div className="text-gray-500 text-sm mb-2 font-light"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >
                        {activity.description}
                      </div>
                  {activity.metadata && (
                        <div className="flex flex-wrap gap-2 mt-2">
                      {activity.metadata.customerName && (
                            <span className="text-xs bg-white text-gray-700 px-3 py-1.5 rounded-lg font-light border border-gray-200 shadow-sm"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              {t('dashboard.activity.labels.client')} {activity.metadata.customerName}
                            </span>
                      )}
                      {activity.metadata.productName && (
                            <span className="text-xs bg-white text-gray-700 px-3 py-1.5 rounded-lg font-light border border-gray-200 shadow-sm"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              {t('dashboard.activity.labels.product')} {activity.metadata.productName}
                            </span>
                      )}
                      {activity.metadata.amount && formattedAmounts[activity.id] && (
                            <span className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg font-light border border-gray-800 shadow-sm"
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                fontWeight: 300,
                              }}
                            >
                              {t('dashboard.activity.labels.amount')} {formattedAmounts[activity.id]}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RecentActivity;
