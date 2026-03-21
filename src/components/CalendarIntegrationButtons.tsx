import React from 'react';
import { CalendarCheck, Mail, Download } from "lucide-react";
import { motion } from "framer-motion";
import { type CalendarEvent, generateGoogleCalendarUrl, generateOutlookCalendarUrl, downloadICalFile } from '@/utils/calendarUtils';

interface CalendarIntegrationButtonsProps {
  event: CalendarEvent;
}

const CalendarIntegrationButtons: React.FC<CalendarIntegrationButtonsProps> = ({ event }) => {
  const handleGoogleCalendar = () => {
    window.open(generateGoogleCalendarUrl(event), '_blank');
  };

  const handleOutlookCalendar = () => {
    window.open(generateOutlookCalendarUrl(event), '_blank');
  };

  const handleICalDownload = () => {
    downloadICalFile(event);
  };

  const buttons = [
    {
      id: 'google',
      label: 'Google Calendar',
      icon: CalendarCheck,
      onClick: handleGoogleCalendar,
    },
    {
      id: 'outlook',
      label: 'Outlook',
      icon: Mail,
      onClick: handleOutlookCalendar,
    },
    {
      id: 'download',
      label: 'Télécharger .ics',
      icon: Download,
      onClick: handleICalDownload,
    },
  ];

  return (
    <div className="flex flex-row gap-2.5 w-full">
      {buttons.map((button, index) => {
        const Icon = button.icon;
        return (
          <motion.button
            key={button.id}
            onClick={button.onClick}
            className="group relative overflow-hidden bg-white border border-black/8 rounded-xl px-3 py-3.5 flex-1 flex items-center justify-center transition-all duration-300 hover:border-black/15 hover:bg-gray-50/80 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:ring-offset-1 active:scale-[0.98]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.4, 
              delay: index * 0.06,
              ease: [0.16, 1, 0.3, 1]
            }}
            whileHover={{ 
              scale: 1.01,
              transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] }
            }}
            whileTap={{ 
              scale: 0.98,
              transition: { duration: 0.1 }
            }}
            title={button.label}
          >
            {/* Subtle shine effect on hover */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100"
              initial={{ x: '-100%' }}
              whileHover={{ x: '200%' }}
              transition={{ duration: 0.7, ease: 'easeInOut' }}
            />
            
            {/* Icon container with subtle background on hover */}
            <div className="relative flex items-center justify-center">
              <Icon className="w-5 h-5 text-black/70 group-hover:text-black transition-all duration-300 relative z-10" />
            </div>
            
            {/* Label - hidden everywhere, only shown in tooltip */}
            <span className="sr-only">{button.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default CalendarIntegrationButtons; 