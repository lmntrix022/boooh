import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export interface ViewToggleOption {
  id: string;
  label?: string;
  icon: React.ElementType;
}

interface ViewToggleProps {
  options: ViewToggleOption[];
  activeView: string;
  onViewChange: (view: string) => void;
  className?: string;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({
  options,
  activeView,
  onViewChange,
  className = ""
}) => {
  return (
    <div className={`flex gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = activeView === option.id;
        
        return (
          <Button
            key={option.id}
            onClick={() => onViewChange(option.id)}
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            className={isActive
              ? 'bg-gray-900 text-white hover:bg-gray-800 font-light rounded-lg'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-light rounded-lg'
            }
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              fontWeight: 300,
            }}
          >
            <Icon className="w-4 h-4" />
            {option.label && <span className="ml-2">{option.label}</span>}
          </Button>
        );
      })}
    </div>
  );
};
