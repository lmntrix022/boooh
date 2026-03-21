/**
 * BusinessCardActions Component
 * 
 * Composant modulaire pour les boutons d'action (QR Code, vCard, RDV)
 * Extrait de BusinessCardModern.tsx pour améliorer la maintenabilité
 */

import React from 'react';
import { motion } from 'framer-motion';
import { QrCode, Download, Calendar } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface BusinessCardActionsProps {
  onQRCodeClick: () => void;
  onVCardClick: () => void;
  onAppointmentClick: () => void;
  variant?: 'default' | 'compact';
  canBookAppointments?: boolean;
}

export const BusinessCardActions: React.FC<BusinessCardActionsProps> = ({
  onQRCodeClick,
  onVCardClick,
  onAppointmentClick,
  variant = 'default',
  canBookAppointments = false
}) => {
  const { t } = useLanguage();

  if (variant === 'compact') {
    const actions = [
      {
        onClick: onQRCodeClick,
        icon: <QrCode className="h-6 w-6 text-blue-600" />,
        bgColor: "bg-blue-500/10",
        label: t('businessCard.scanQR')
      },
      {
        onClick: onVCardClick,
        icon: <Download className="h-6 w-6 text-purple-600" />,
        bgColor: "bg-purple-500/20",
        label: t('businessCard.saveContact')
      }
    ];

    // Ajouter le bouton RDV seulement si l'utilisateur peut prendre des RDV
    if (canBookAppointments) {
      actions.push({
        onClick: onAppointmentClick,
        icon: <Calendar className="h-6 w-6 text-green-600" />,
        bgColor: "bg-green-500/20",
        label: t('businessCard.bookAppointment')
      });
    }

    return (
      <div className={`grid gap-3 mt-4 ${actions.length === 3 ? 'grid-cols-3' : actions.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {actions.map((action, index) => (
          <motion.button
            key={index}
            onClick={action.onClick}
            className="bg-white/10 backdrop-blur-sm border border-gray-200/80 rounded-2xl p-3 hover:shadow-md flex flex-col items-center gap-1 shadow-md"
            style={{ willChange: 'transform' }}
            whileHover={{ 
              scale: 1.03, 
              y: -3,
              transition: { 
                type: "spring", 
                stiffness: 400, 
                damping: 17,
                duration: 0.2
              } 
            }}
            whileTap={{ 
              scale: 0.97,
              transition: { 
                type: "spring", 
                stiffness: 500, 
                damping: 20,
                duration: 0.15
              }
            }}
          >
            <div className={`w-10 h-10 ${action.bgColor} backdrop-blur-sm rounded-xl flex items-center justify-center mb-1`}>
              {action.icon}
            </div>
            <span className="text-sm font-medium text-gray-900">{action.label}</span>
          </motion.button>
        ))}
      </div>
    );
  }

  const actions = [
    {
      onClick: onQRCodeClick,
      icon: <QrCode className="w-5 h-5 text-white" />,
      label: t('businessCard.scanQR'),
      delay: 0.3
    },
    {
      onClick: onVCardClick,
      icon: <Download className="w-5 h-5 text-white" />,
      label: t('businessCard.saveContact'),
      delay: 0.35
    }
  ];

  // Ajouter le bouton RDV seulement si l'utilisateur peut prendre des RDV
  if (canBookAppointments) {
    actions.push({
      onClick: onAppointmentClick,
      icon: <Calendar className="w-5 h-5 text-white" />,
      label: t('businessCard.bookAppointment'),
      delay: 0.4
    });
  }

  return (
    <div className={`grid gap-3 mt-6 ${actions.length === 3 ? 'grid-cols-3' : actions.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {actions.map((action, index) => (
        <motion.button
          key={index}
          onClick={action.onClick}
          className="bg-white/95 backdrop-blur-sm border border-gray-200/80 rounded-2xl p-3 hover:bg-white hover:shadow-md flex flex-col items-center gap-1 shadow-md"
          style={{ willChange: 'transform, opacity' }}
          whileHover={{ 
            scale: 1.03, 
            y: -3,
            transition: { 
              type: "spring", 
              stiffness: 400, 
              damping: 17,
              duration: 0.2
            } 
          }}
          whileTap={{ 
            scale: 0.97,
            transition: { 
              type: "spring", 
              stiffness: 500, 
              damping: 20,
              duration: 0.15
            }
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: action.delay,
            type: "spring",
            stiffness: 300,
            damping: 25,
            duration: 0.4
          }}
        >
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            {action.icon}
          </div>
          <span className="text-xs font-medium text-gray-900">{action.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default BusinessCardActions;
