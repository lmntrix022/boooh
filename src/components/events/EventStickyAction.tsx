import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import type { Event } from '@/types/events';

interface EventStickyActionProps {
    event: Event;
    onTicketClick: () => void;
}

export const EventStickyAction: React.FC<EventStickyActionProps> = ({ event, onTicketClick }) => {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Show when scrolled past 600px (hero height)
            const shouldShow = window.scrollY > 600;
            setIsVisible(shouldShow);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 pointer-events-none"
                >
                    <div className="max-w-4xl mx-auto pointer-events-auto">
                        <div className="bg-white/95 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-2xl p-3 sm:p-4">
                            {/* Desktop Layout */}
                            <div className="hidden md:flex items-center justify-between gap-4">
                                <div>
                                    <h4 className="font-bold text-gray-900 truncate max-w-xs">{event.title}</h4>
                                    <div className="flex items-center text-sm text-gray-500">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {format(new Date(event.start_date), 'MMM d, h:mm a')}
                                    </div>
                                </div>
                                <Button
                                    onClick={onTicketClick}
                                    className="bg-black text-white hover:bg-gray-800 rounded-xl shadow-lg px-8 h-12"
                                >
                                    {t('events.ticketing.getTickets')}
                                </Button>
                            </div>

                            {/* Mobile Layout */}
                            <div className="md:hidden space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-gray-900 truncate">{event.title}</p>
                                        <div className="flex items-center text-xs text-gray-500">
                                            <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                                            <span className="truncate">{format(new Date(event.start_date), 'MMM d, h:mm a')}</span>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    onClick={onTicketClick}
                                    className="w-full bg-black text-white hover:bg-gray-800 rounded-xl shadow-lg h-12 text-sm sm:text-base font-medium"
                                >
                                    {t('events.ticketing.getTickets')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
