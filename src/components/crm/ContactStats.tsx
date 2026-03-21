import React from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, ShoppingCart, Calendar, TrendingUp, Target 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/hooks/useLanguage';

interface ContactStatsProps {
  stats: {
    totalRevenue: number;
    totalOrders: number;
    totalAppointments: number;
    conversionRate: number;
    leadScore: number;
  };
  getScoreColor: (score: number) => string;
}

export const ContactStats: React.FC<ContactStatsProps> = ({
  stats,
  getScoreColor
}) => {
  const { t } = useLanguage();
  
  return (
    <motion.div 
      className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8 mt-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-white rounded-lg border border-gray-200 shadow-sm transition-all duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-gray-500 mb-1 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >{t('crmDetail.contactStats.totalRevenue')}</p>
                <p className="text-xl sm:text-2xl font-light text-gray-900 tracking-tight"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {(stats.totalRevenue / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-gray-500 mt-1 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >{t('crmDetail.contactStats.currency')}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full border border-gray-200 flex items-center justify-center">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-white rounded-lg border border-gray-200 shadow-sm transition-all duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-gray-500 mb-1 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >{t('crmDetail.contactStats.orders')}</p>
                <p className="text-xl sm:text-2xl font-light text-gray-900 tracking-tight"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                    letterSpacing: '-0.02em',
                  }}
                >{stats.totalOrders}</p>
                <p className="text-xs text-gray-500 mt-1 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >{t('crmDetail.contactStats.total')}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full border border-gray-200 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-white rounded-lg border border-gray-200 shadow-sm transition-all duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-gray-500 mb-1 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >{t('crmDetail.contactStats.appointments')}</p>
                <p className="text-xl sm:text-2xl font-light text-gray-900 tracking-tight"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                    letterSpacing: '-0.02em',
                  }}
                >{stats.totalAppointments}</p>
                <p className="text-xs text-gray-500 mt-1 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >{t('crmDetail.contactStats.scheduled')}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full border border-gray-200 flex items-center justify-center">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="bg-white rounded-lg border border-gray-200 shadow-sm transition-all duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-gray-500 mb-1 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >{t('crmDetail.contactStats.conversion')}</p>
                <p className="text-xl sm:text-2xl font-light text-gray-900 tracking-tight"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                    letterSpacing: '-0.02em',
                  }}
                >{stats.conversionRate.toFixed(0)}%</p>
                <p className="text-xs text-gray-500 mt-1 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >{t('crmDetail.contactStats.quoteToSale')}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full border border-gray-200 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="bg-white rounded-lg border border-gray-200 shadow-sm transition-all duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-gray-500 mb-1 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >{t('crmDetail.contactStats.leadScore')}</p>
                <p className="text-xl sm:text-2xl font-light text-gray-900 tracking-tight"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                    fontWeight: 300,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {stats.leadScore}/100
                </p>
                <p className="text-xs text-gray-500 mt-1 font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                    fontWeight: 300,
                  }}
                >{t('crmDetail.contactStats.quality')}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full border border-gray-200 flex items-center justify-center">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};
