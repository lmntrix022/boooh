import React from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface AgendaItem {
    time: string;
    endTime?: string;
    title: string;
    description?: string;
    location?: string;
    tag?: string;
}

interface EventAgendaProps {
    agenda?: AgendaItem[];
}

export const EventAgenda: React.FC<EventAgendaProps> = ({ agenda }) => {
    if (!agenda || agenda.length === 0) return null;

    return (
        <div className="py-8">
            <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
                <span className="bg-gradient-to-r from-blue-600 to-cyan-600 w-1.5 h-6 rounded-full" />
                Agenda
            </h3>

            <div className="relative border-l-2 border-gray-100 ml-4 md:ml-6 space-y-8">
                {agenda.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="relative pl-8 md:pl-10"
                    >
                        {/* Timeline Dot */}
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white bg-blue-500 shadow-sm" />

                        <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                            {/* Time Column */}
                            <div className="flex-shrink-0 w-32 pt-0.5">
                                <div className="flex items-center text-gray-900 font-bold text-lg">
                                    {item.time}
                                </div>
                                {item.endTime && (
                                    <div className="text-sm text-gray-500 font-medium">
                                        - {item.endTime}
                                    </div>
                                )}
                                {item.tag && (
                                    <Badge variant="secondary" className="mt-2 text-[10px] uppercase tracking-wider font-semibold rounded-md">
                                        {item.tag}
                                    </Badge>
                                )}
                            </div>

                            {/* Content Column */}
                            <div className="flex-1 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                                <h4 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h4>

                                {item.description && (
                                    <p className="text-gray-600 mb-3 leading-relaxed">
                                        {item.description}
                                    </p>
                                )}

                                {item.location && (
                                    <div className="flex items-center text-sm text-gray-500">
                                        <MapPin className="w-3.5 h-3.5 mr-1" />
                                        {item.location}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
