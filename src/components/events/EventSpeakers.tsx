import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Linkedin, Twitter, Globe } from 'lucide-react';

interface Speaker {
    name: string;
    role: string;
    company?: string;
    bio?: string;
    avatar_url?: string;
    socials?: {
        linkedin?: string;
        twitter?: string;
        website?: string;
    };
}

interface EventSpeakersProps {
    speakers?: Speaker[];
}

export const EventSpeakers: React.FC<EventSpeakersProps> = ({ speakers }) => {
    if (!speakers || speakers.length === 0) return null;

    return (
        <div className="py-8">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 w-1.5 h-6 rounded-full" />
                Speakers
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {speakers.map((speaker, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                        <Card className="h-full border-none bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
                            <CardContent className="p-6 flex flex-col items-center text-center">
                                <div className="relative mb-4">
                                    <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg border-2 border-white group-hover:scale-105 transition-transform duration-300">
                                        <img
                                            src={speaker.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(speaker.name)}&background=random`}
                                            alt={speaker.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full shadow-sm">
                                        {speaker.socials?.linkedin && (
                                            <a href={speaker.socials.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600 transition-colors">
                                                <Linkedin className="w-4 h-4" />
                                            </a>
                                        )}
                                        {speaker.socials?.twitter && (
                                            <a href={speaker.socials.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-400 transition-colors">
                                                <Twitter className="w-4 h-4" />
                                            </a>
                                        )}
                                        {speaker.socials?.website && (
                                            <a href={speaker.socials.website} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-purple-600 transition-colors">
                                                <Globe className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <h4 className="text-lg font-bold text-gray-900 mb-1">{speaker.name}</h4>
                                <p className="text-sm font-medium text-purple-600 mb-1">{speaker.role}</p>
                                {speaker.company && (
                                    <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide">{speaker.company}</p>
                                )}

                                {speaker.bio && (
                                    <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                                        {speaker.bio}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
