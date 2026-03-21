import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface UpgradeButtonProps {
  tooltip?: {
    title: string;
    description: string;
    helpText?: string;
  };
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const UpgradeButton: React.FC<UpgradeButtonProps> = ({
  tooltip,
  side = 'top',
  className,
}) => {
  const navigate = useNavigate();
  const [isHovering, setIsHovering] = useState(false);

  const button = (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
      className={className}
    >
      <div className="relative">
        {/* Glow effect background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 rounded-xl blur-xl opacity-50"
          animate={{ scale: isHovering ? 1.1 : 1, opacity: isHovering ? 0.7 : 0.5 }}
          transition={{ duration: 0.3 }}
        />

        {/* Main button */}
        <Button
          onClick={() => navigate('/pricing')}
          className="relative px-7 py-3 rounded-xl font-bold text-white shadow-2xl hover:shadow-2xl hover:text-white transition-all duration-300 overflow-hidden group"
          style={{
            background: 'linear-gradient(135deg,rgb(0, 0, 0) 0%,rgb(0, 0, 0) 50%,rgb(0, 0, 0) 100%)',
          }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0"
            animate={{ x: isHovering ? 100 : -100, opacity: isHovering ? 0.3 : 0 }}
            transition={{ duration: 0.6 }}
          />

          {/* Content */}
          <span className="relative flex items-center gap-2 z-10 !text-white">
            <motion.div
              animate={{ rotate: isHovering ? 360 : 0 }}
              transition={{ duration: 0.6 }}
              className="!text-white"
            >
              <Sparkles className="h-5 w-5 !text-white" />
            </motion.div>
            <span className="text-lg !text-white">Upgrade maintenant</span>
            <motion.div
              animate={{ x: isHovering ? 4 : 0 }}
              transition={{ duration: 0.3 }}
              className="!text-white"
            >
              <ArrowRight className="h-5 w-5 !text-white" />
            </motion.div>
          </span>
        </Button>
      </div>
    </motion.div>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent side={side} className="max-w-xs bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 shadow-xl">
            <div className="space-y-3 py-2">
              <p className="font-bold !text-amber-300">{tooltip.title}</p>
              <p className="text-sm !text-white">{tooltip.description}</p>
              {tooltip.helpText && (
                <p className="text-xs !text-amber-200 italic border-t border-gray-700 pt-2 mt-2">
                  ✨ {tooltip.helpText}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
};

export default UpgradeButton;
