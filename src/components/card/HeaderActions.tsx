import React from 'react';
import { motion } from 'framer-motion';
import ActionButton from './ActionButton';
import { useHeaderActions } from '@/hooks/useHeaderActions';

interface HeaderActionsProps {
  phone?: string;
  email?: string;
  address?: string;
  socials?: {
    instagram?: string;
    linkedin?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
    whatsapp?: string;
    tiktok?: string;
  };
}

const HeaderActions: React.FC<HeaderActionsProps> = ({
  phone,
  email,
  address,
  socials
}) => {
  const { primaryActions, socialActions } = useHeaderActions(
    { phone, email, address },
    socials
  );

  const allActions = [...primaryActions, ...socialActions];

  if (allActions.length === 0) return null;

  return (
    <div className="flex justify-center gap-4 relative z-10 mb-6">
      {/* Cercles transparents en arrière-plan */}
      <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
        <div className="w-2 h-2 bg-white rounded-full absolute -left-8 animate-pulse"></div>
        <div className="w-1 h-1 bg-white rounded-full absolute -left-4 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="w-1.5 h-1.5 bg-white rounded-full absolute -right-6 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="w-1 h-1 bg-white rounded-full absolute -right-2 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>
      
      {/* Boutons d'action */}
      {allActions.map((action, index) => (
        <motion.div
          key={`${action.label}-${index}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 0.3, 
            delay: index * 0.1,
            ease: "easeOut" 
          }}
        >
          <ActionButton
            href={action.href}
            icon={action.icon}
            label={action.label}
            color={action.color}
            hoverColor={action.hoverColor}
            target={action.target}
            rel={action.rel}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default HeaderActions;
