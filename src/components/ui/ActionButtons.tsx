import React from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

export interface ActionButton {
  id: string;
  label?: string;
  icon: LucideIcon;
  variant?: 'primary' | 'secondary' | 'outline';
  color?: 'blue' | 'purple' | 'green' | 'red' | 'gray';
  onClick: () => void;
  className?: string;
}

interface ActionButtonsProps {
  buttons: ActionButton[];
  className?: string;
}

const getButtonStyles = (variant: string, color: string) => {
  const baseStyles = "transition-all duration-200";
  
  switch (variant) {
    case 'primary':
      return `${baseStyles} bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold px-6 py-2 rounded-xl shadow-xl hover:shadow-2xl`;
    
    case 'secondary':
      const secondaryColors = {
        blue: 'border-blue-200 text-blue-600 hover:bg-blue-50',
        purple: 'border-purple-200 text-purple-600 hover:bg-purple-50',
        green: 'border-green-200 text-green-600 hover:bg-green-50',
        red: 'border-red-200 text-red-600 hover:bg-red-50',
        gray: 'border-gray-200 text-gray-600 hover:bg-gray-50'
      };
      return `${baseStyles} border-2 ${secondaryColors[color as keyof typeof secondaryColors] || secondaryColors.gray}`;
    
    case 'outline':
    default:
      const outlineColors = {
        blue: 'border-blue-200 text-blue-600 hover:bg-blue-50',
        purple: 'border-purple-200 text-purple-600 hover:bg-purple-50',
        green: 'border-green-200 text-green-600 hover:bg-green-50',
        red: 'border-red-200 text-red-600 hover:bg-red-50',
        gray: 'border-gray-200 text-gray-600 hover:bg-gray-50'
      };
      return `${baseStyles} border-2 ${outlineColors[color as keyof typeof outlineColors] || outlineColors.gray}`;
  }
};

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  buttons,
  className = ""
}) => {
  return (
    <div className={`flex gap-3 ${className}`}>
      {buttons.map((button) => {
        const Icon = button.icon;
        const variant = button.variant || 'outline';
        const color = button.color || 'gray';
        
        return (
          <Button
            key={button.id}
            onClick={button.onClick}
            variant={variant === 'primary' ? 'default' : 'outline'}
            className={getButtonStyles(variant, color)}
          >
            <Icon className="w-4 h-4" />
            {button.label && <span className="ml-2">{button.label}</span>}
          </Button>
        );
      })}
    </div>
  );
};
