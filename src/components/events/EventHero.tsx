import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Calendar, MapPin, Share2, Heart, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, differenceInSeconds } from 'date-fns';
import { useTranslation } from 'react-i18next';
import type { Event } from '@/types/events';

interface EventHeroProps {
    event: Event;
    isFavorite: boolean;
    onToggleFavorite: () => void;
    onShare: () => void;
}

export const EventHero: React.FC<EventHeroProps> = ({
    event,
    isFavorite,
    onToggleFavorite,
    onShare
}) => {
    const { t } = useTranslation();
    const { scrollY } = useScroll();
    const y = useTransform(scrollY, [0, 500], [0, 150]);
    const opacity = useTransform(scrollY, [0, 300], [1, 0]);

    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = differenceInSeconds(new Date(event.start_date), new Date());

            if (difference > 0) {
                return {
                    days: Math.floor(difference / (3600 * 24)),
                    hours: Math.floor((difference % (3600 * 24)) / 3600),
                    minutes: Math.floor((difference % 3600) / 60),
                    seconds: Math.floor(difference % 60)
                };
            }
            return null;
        };

        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [event.start_date]);

    // Generate deterministic random avatars based on event ID for social proof
    const avatarIds = event.id.split('').filter(c => !isNaN(parseInt(c))).slice(0, 4);

    return (
        <div className="relative h-[85vh] min-h-[700px] w-full overflow-hidden rounded-b-[40px] shadow-2xl">
            {/* Parallax Background Image */}
            <motion.div
                style={{ y }}
                className="absolute inset-0 w-full h-full"
            >
                <img
                    src={event.cover_image_url || '/placeholder-event.jpg'}
                    alt={event.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80" />
            </motion.div>

            {/* Content Overlay */}
            <motion.div
                style={{ opacity }}
                className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 pb-20 max-w-7xl mx-auto w-full"
            >
                <div className="space-y-8">
                    {/* Top Badges */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-wrap gap-3"
                    >
                        <Badge className="bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20 px-4 py-1.5 text-xs font-light tracking-widest uppercase rounded-full">
                            {event.event_type === 'online' ? t('events.detail.online') : event.event_type === 'physical' ? t('events.detail.inPerson') : t('events.detail.hybrid')}
                        </Badge>
                        {event.category && (
                            <Badge variant="outline" className="text-white border-white/30 px-4 py-1.5 text-xs font-light tracking-widest uppercase rounded-full">
                                {event.category}
                            </Badge>
                        )}
                    </motion.div>

                    {/* Title & Description */}
                    <div className="space-y-4 max-w-5xl">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-5xl md:text-7xl lg:text-8xl font-light text-white tracking-tighter leading-[0.9]"
                            style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                fontWeight: 200,
                            }}
                        >
                            {event.title}
                        </motion.h1>
                        {event.description && (
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-lg md:text-2xl text-white/80 font-light line-clamp-2 max-w-3xl leading-relaxed tracking-tight"
                            >
                                {event.description}
                            </motion.p>
                        )}
                    </div>

                    {/* Info Grid - Minimal */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-8 border-t border-white/10">
                        {/* Date */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="group"
                        >
                            <div className="flex items-center gap-3 mb-2 opacity-60">
                                <Calendar className="w-4 h-4 text-white" />
                                <span className="text-white text-xs uppercase tracking-widest font-medium">{t('events.detail.date')}</span>
                            </div>
                            <p className="text-white text-xl md:text-2xl font-light tracking-tight">{format(new Date(event.start_date), 'MMMM d')}</p>
                            <p className="text-white/60 font-light">{format(new Date(event.start_date), 'h:mm a')} — {format(new Date(event.end_date), 'h:mm a')}</p>
                        </motion.div>

                        {/* Location */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="group"
                        >
                            <div className="flex items-center gap-3 mb-2 opacity-60">
                                <MapPin className="w-4 h-4 text-white" />
                                <span className="text-white text-xs uppercase tracking-widest font-medium">{t('events.detail.location')}</span>
                            </div>
                            <p className="text-white text-xl md:text-2xl font-light tracking-tight truncate">{event.location_name || 'Online'}</p>
                            <p className="text-white/60 font-light truncate">{event.location_address || 'Virtual Event'}</p>
                        </motion.div>

                        {/* Countdown */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="group"
                        >
                            <div className="flex items-center gap-3 mb-2 opacity-60">
                                <Clock className="w-4 h-4 text-white" />
                                <span className="text-white text-xs uppercase tracking-widest font-medium">{timeLeft ? "STARTS IN" : "STATUS"}</span>
                            </div>
                            {timeLeft ? (
                                <div className="flex gap-1 text-white text-xl md:text-2xl font-light tracking-tight font-mono">
                                    <span>{String(timeLeft.days).padStart(2, '0')}d</span>
                                    <span className="opacity-50">:</span>
                                    <span>{String(timeLeft.hours).padStart(2, '0')}h</span>
                                    <span className="opacity-50">:</span>
                                    <span>{String(timeLeft.minutes).padStart(2, '0')}m</span>
                                </div>
                            ) : (
                                <p className="text-white text-xl md:text-2xl font-light tracking-tight">
                                    {new Date() > new Date(event.end_date) ? t('events.detail.ended') : t('events.detail.happeningNow')}
                                </p>
                            )}
                        </motion.div>

                        {/* Social Proof */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="hidden md:block group"
                        >
                            <div className="flex items-center gap-3 mb-2 opacity-60">
                                <Users className="w-4 h-4 text-white" />
                                <span className="text-white text-xs uppercase tracking-widest font-medium">ATTENDING</span>
                            </div>
                            <div className="flex items-center pt-1">
                                <div className="flex -space-x-3 mr-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-gray-800 overflow-hidden relative z-0 hover:z-10 hover:scale-110 transition-transform">
                                            <img src={`https://i.pravatar.cc/100?u=${event.id}${i}`} alt="Attendee" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                                <span className="text-white text-lg font-light tracking-tight">
                                    {event.current_attendees > 10 ? `+${event.current_attendees - 3}` : event.current_attendees}
                                </span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Action Buttons (Mobile/Top) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="flex gap-4 pt-6"
                    >
                        <Button
                            size="lg"
                            className="bg-white text-black hover:bg-white/90 rounded-full px-10 h-14 font-medium text-lg shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 transition-all duration-300"
                            onClick={() => document.getElementById('ticketing-widget')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            {t('events.ticketing.getTickets')}
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={onToggleFavorite}
                            className={`h-14 w-14 rounded-full border-white/20 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white ${isFavorite ? 'bg-white/20 text-rose-400 border-rose-400/30' : ''}`}
                        >
                            <Heart className={`h-6 w-6 ${isFavorite ? 'fill-current' : ''}`} />
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={onShare}
                            className="h-14 w-14 rounded-full border-white/20 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white"
                        >
                            <Share2 className="h-6 w-6" />
                        </Button>
                    </motion.div>

                </div>
            </motion.div>
        </div>
    );
};
