import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number | React.ReactNode;
  iconGradient?: string;
  delay?: number;
  percentage?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  iconGradient = "from-purple-500 via-pink-500 to-rose-500",
  delay = 0.1,
  percentage
}) => (
  <motion.div
    className="relative bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
  >
    <div className="relative z-10 p-5 md:p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-[10px] md:text-xs font-light text-gray-500 uppercase tracking-wider mb-2"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            {label}
          </p>
          <p className="text-xl md:text-2xl lg:text-2xl font-light text-gray-900 tracking-tight"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontWeight: 300,
              letterSpacing: '-0.02em',
            }}
          >
            {value}
          </p>
        </div>
        
        {/* Icon Container - Apple Minimal */}
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 md:w-7 md:h-7 text-gray-600" />
        </div>
      </div>
      
      {/* Barre de progression - Apple Minimal */}
      {percentage !== undefined && (
        <div className="relative h-1 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gray-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, delay: delay + 0.2 }}
          />
        </div>
      )}
    </div>
  </motion.div>
);
