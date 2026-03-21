import React, { useState, useEffect, useRef } from "react";
import { CardContent } from "@/components/ui/card";
import {
  Users,
  Eye,
  Calendar,
  ShoppingCart,
  TrendingUp,
  Share2
} from "lucide-react";
import { formatCurrencyAsync } from "@/utils/format";
import { CURRENCY_CHANGE_EVENT } from "@/components/settings/CurrencySelector";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { useLanguage } from '@/hooks/useLanguage';

interface DashboardStatsProps {
  totalViews: number;
  totalAppointments: number;
  totalOrders: number;
  totalRevenue: number;
  totalShares: number;
  activeCards: number;
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: string;
  delay?: number;
  spark?: number[];
  tooltip?: string;
  goal?: number;
}

function useCountUp(value: number, duration = 1200) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>();
  useEffect(() => {
    let start = 0;
    let startTime: number | null = null;
    function animate(ts: number) {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setDisplay(Math.floor(start + (value - start) * progress));
      if (progress < 1) {
        ref.current = requestAnimationFrame(animate);
      } else {
        setDisplay(value);
      }
    }
    ref.current = requestAnimationFrame(animate);
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
  }, [value, duration]);
  return display;
}

// Fake sparkline data pour l'effet visuel
const sparklineData = [
  [10, 20, 30, 25, 40, 35, 50],
  [5, 8, 12, 10, 15, 18, 20],
  [2, 4, 6, 8, 10, 12, 14],
  [100, 200, 300, 250, 400, 350, 500],
  [1, 3, 2, 5, 4, 6, 8],
  [1, 2, 3, 4, 5, 6, 7],
];

// Tooltips will be translated in the component

const statGoals = [1000, 10, 10, 100000, 20, 2]; // Seuils pour badge "Objectif atteint"

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, trend, color, delay = 0, spark = [], tooltip, goal }) => {
  const animatedValue = typeof value === 'number' ? useCountUp(value) : value;
  const reachedGoal = typeof value === 'number' && goal && value >= goal;
  const { t } = useLanguage();
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              duration: 0.6, 
              delay: delay / 1000,
              type: "spring",
              stiffness: 200,
              damping: 20
            }}
            whileHover={{ 
              scale: 1.05, 
              y: -8,
              transition: { duration: 0.3 }
            }}
            className="group relative"
            tabIndex={0}
          >
            {/* Carte principale - Apple Minimal */}
            <div className="relative h-full min-h-[200px] md:min-h-[220px] lg:min-h-[240px] bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6 lg:p-8 overflow-hidden transform-gpu group/card">
              {/* Contenu organisé */}
              <div className="relative z-10 h-full flex flex-col">
                {/* Header avec icône et label */}
                <div className="flex items-start justify-between mb-4">
                  {/* Icon Container - Apple Minimal */}
                  <motion.div
                    className="relative w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 group-hover/card:scale-105 transition-transform duration-300"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.25, type: "tween" }}
                  >
                    <Icon className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-gray-600 relative z-10" />
                  </motion.div>
                  
                  {/* Trend badge en haut à droite */}
                  {trend && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: delay / 1000 + 0.3 }}
                      className={`text-xs font-light px-2.5 py-1.5 rounded-lg border ${
                        trend.isPositive 
                          ? 'text-gray-700 bg-gray-50 border-gray-200' 
                          : 'text-gray-700 bg-gray-50 border-gray-200'
                      }`}
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {trend.isPositive ? '↑' : '↓'} {trend.value}%
                    </motion.div>
                  )}
                </div>
                
                {/* Valeur principale */}
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-[10px] md:text-xs font-light text-gray-500 uppercase tracking-wider mb-2 md:mb-3"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {label}
                  </p>
                  <motion.p
                    className="text-xl md:text-2xl lg:text-2xl xl:text-3xl font-light text-gray-900 leading-none mb-3 md:mb-4 tracking-tight"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: delay / 1000 + 0.2, type: "spring", stiffness: 200 }}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {animatedValue}
                  </motion.p>
                </div>
                
                {/* Footer avec Goal */}
                {reachedGoal && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: delay / 1000 + 0.4, type: "spring" }}
                    className="mt-auto pt-3 border-t border-gray-200"
                  >
                    <div className="flex items-center gap-2">
                      <motion.div
                        className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center shadow-sm"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <span className="text-white text-xs font-light"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            fontWeight: 300,
                          }}
                        >✓</span>
                      </motion.div>
                      <span className="text-xs font-light text-gray-700"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                          fontWeight: 300,
                        }}
                      >{t('dashboard.stats.goalReached')}</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent className="bg-white border border-gray-200 shadow-lg rounded-lg font-light"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            fontWeight: 300,
          }}
        >
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const DashboardStats: React.FC<DashboardStatsProps> = ({
  totalViews,
  totalAppointments,
  totalOrders,
  totalRevenue,
  totalShares,
  activeCards,
}) => {
  const { t } = useLanguage();
  const [formattedRevenue, setFormattedRevenue] = useState<string>('0');

  const updateRevenue = async () => {
    try {
      // Log removed
      const formatted = await formatCurrencyAsync(totalRevenue);
      // Log removed
      setFormattedRevenue(formatted);
    } catch (error) {
      // Error log removed
      setFormattedRevenue('0');
    }
  };

  useEffect(() => {
    updateRevenue();

    // Écouter les changements de devise
    const handleCurrencyChange = () => {
      updateRevenue();
    };

    window.addEventListener(CURRENCY_CHANGE_EVENT, handleCurrencyChange);
    return () => {
      window.removeEventListener(CURRENCY_CHANGE_EVENT, handleCurrencyChange);
    };
  }, [totalRevenue]);

  return (
    <div className="relative mb-8 p-0">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex items-center gap-4 mb-8"
      >
        <motion.div
          className="relative w-12 h-12 md:w-14 md:h-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.25, type: "tween" }}
        >
          <TrendingUp className="w-6 h-6 md:w-7 md:h-7 text-gray-600" />
        </motion.div>
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl md:text-3xl font-light text-gray-900 tracking-tight"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
              letterSpacing: '-0.02em',
            }}
          >
            {t('dashboard.stats.title')}
          </h2>
          <span className="inline-flex items-center gap-2 text-xs md:text-sm font-light text-gray-500"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            <motion.span
              className="w-2 h-2 rounded-full bg-gray-600"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {t('dashboard.stats.realTime')}
          </span>
        </div>
      </motion.div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
        <div className="col-span-1">
        <StatCard icon={Eye} label={t('dashboard.stats.totalViews')} value={totalViews} trend={{ value: 12.5, isPositive: true }} color="bg-gray-900" delay={0} spark={sparklineData[0]} tooltip={t('dashboard.stats.tooltips.totalViews')} goal={statGoals[0]} />
        </div>
        <div className="col-span-1">
          <StatCard icon={TrendingUp} label={t('dashboard.stats.revenue')} value={formattedRevenue} trend={{ value: 15.8, isPositive: true }} color="bg-gray-900" delay={300} spark={sparklineData[3]} tooltip={t('dashboard.stats.tooltips.revenue')} goal={statGoals[3]} />
        </div>
        <div className="col-span-1">
        <StatCard icon={Calendar} label={t('dashboard.stats.appointments')} value={totalAppointments} trend={{ value: 8.2, isPositive: true }} color="bg-gray-900" delay={100} spark={sparklineData[1]} tooltip={t('dashboard.stats.tooltips.appointments')} goal={statGoals[1]} />
        </div>
        <div className="col-span-1">
        <StatCard icon={ShoppingCart} label={t('dashboard.stats.orders')} value={totalOrders} trend={{ value: 5.3, isPositive: true }} color="bg-gray-900" delay={200} spark={sparklineData[2]} tooltip={t('dashboard.stats.tooltips.orders')} goal={statGoals[2]} />
        </div>
        <div className="col-span-1">
        <StatCard icon={Share2} label={t('dashboard.stats.shares')} value={totalShares} trend={{ value: 23.4, isPositive: true }} color="bg-gray-900" delay={400} spark={sparklineData[4]} tooltip={t('dashboard.stats.tooltips.shares')} goal={statGoals[4]} />
        </div>
        <div className="col-span-1">
        <StatCard icon={Users} label={t('dashboard.stats.activeCards')} value={activeCards} color="bg-gray-900" delay={500} spark={sparklineData[5]} tooltip={t('dashboard.stats.tooltips.activeCards')} goal={statGoals[5]} />
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
