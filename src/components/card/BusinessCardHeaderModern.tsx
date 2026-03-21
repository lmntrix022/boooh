import React from 'react';
import { Phone, Mail, Instagram, Linkedin, Facebook, Twitter, Youtube } from "lucide-react";
import { motion } from "framer-motion";
import CardImageOptimizer from "@/components/utils/CardImageOptimizer";
import { useLanguage } from '@/hooks/useLanguage';

interface BusinessCardHeaderModernProps {
    name: string;
    initials: string;
    avatar?: string;
    avatarUrl: string;
    coverImageUrl?: string;
    company?: string;
    companyLogo?: string;
    phone?: string;
    email?: string;
    socials?: {
        instagram?: string;
        linkedin?: string;
        facebook?: string;
        twitter?: string;
        youtube?: string;
        whatsapp?: string;
        tiktok?: string;
    };
    cardId?: string;
    trackClick: (params: any) => void;
    dbPartyTheme?: any;
    shouldShowSlider: boolean;
    activeSlider: 'liens' | 'boutique';
    setActiveSlider: (slider: 'liens' | 'boutique') => void;
    getPublicUrl: (path: string, bucket?: string) => string;
}

const BusinessCardHeaderModern: React.FC<BusinessCardHeaderModernProps> = ({
    name,
    initials,
    avatar,
    avatarUrl,
    coverImageUrl,
    company,
    companyLogo,
    phone,
    email,
    socials,
    cardId,
    trackClick,
    dbPartyTheme,
    shouldShowSlider,
    activeSlider,
    setActiveSlider,
    getPublicUrl
}) => {
    const { t } = useLanguage();

    return (
        <div className="relative h-82 pt-6 pb-4 overflow-hidden">
            {/* Contenu du header - pas de voile pour laisser le fond visible */}
            <div className="relative z-20 flex flex-col items-center pt-8 pb-4">
                {/* Avatar Premium avec effet de ring gradient et glow */}
                <motion.div
                    className="flex justify-center mb-5"
                    style={{ willChange: 'transform, opacity' }}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ 
                        duration: 0.6, 
                        ease: [0.16, 1, 0.3, 1],
                        type: "spring",
                        stiffness: 200,
                        damping: 20
                    }}
                >
                    <div className="relative">
                        {/* Glow effect derrière l'avatar */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 via-white/20 to-transparent blur-2xl scale-110" />

                        {/* Triple ring effect */}
                        <div className="relative">
                            {/* Outer ring - gradient animé */}
                            <motion.div
                                className="absolute -inset-1 rounded-full bg-gradient-to-br from-white/60 via-white/40 to-white/20 blur-sm"
                                animate={{
                                    scale: [1, 1.05, 1],
                                    opacity: [0.6, 0.8, 0.6]
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            />

                            {/* Middle ring */}
                            <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-white/80 to-white/40" />

                            {/* Inner container */}
                            <div className="relative w-24 h-24 rounded-full overflow-hidden border-[3px] border-white shadow-2xl ring-4 ring-white/20">
                                {avatar ? (
                                    <CardImageOptimizer
                                        src={avatarUrl}
                                        alt={name}
                                        className="w-full h-full object-cover"
                                        type="avatar"
                                        priority={true}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                        <span className="text-2xl font-bold text-white drop-shadow-lg">{initials}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Nom avec typographie premium */}
                <motion.h1
                    className="text-white text-[28px] font-extrabold text-center mb-2 tracking-tight"
                    style={{
                        textShadow: '0 2px 10px rgba(0,0,0,0.3), 0 4px 20px rgba(0,0,0,0.2)',
                        willChange: 'transform, opacity'
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                        delay: 0.2, 
                        duration: 0.6,
                        ease: [0.16, 1, 0.3, 1],
                        type: "spring",
                        stiffness: 300,
                        damping: 25
                    }}
                >
                    {name}
                </motion.h1>

                {/* Entreprise avec badge premium */}
                {company && (
                    <motion.div
                        className="flex items-center justify-center gap-2 mb-4"
                        style={{ willChange: 'transform, opacity' }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                            delay: 0.3, 
                            duration: 0.6,
                            ease: [0.16, 1, 0.3, 1],
                            type: "spring",
                            stiffness: 300,
                            damping: 25
                        }}
                    >
                        {companyLogo && (
                            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/60 shadow-lg ring-2 ring-white/20">
                                <CardImageOptimizer
                                    src={getPublicUrl(companyLogo, 'avatars')}
                                    alt={company || 'Company'}
                                    className="w-full h-full object-cover"
                                    type="logo"
                                />
                            </div>
                        )}
                        <span className="text-white text-[15px] font-semibold px-4 py-1.5 rounded-full bg-gradient-to-r from-white/25 to-white/15 backdrop-blur-md border border-white/30 shadow-lg">
                            {company}
                        </span>
                    </motion.div>
                )}

                {/* Actions et réseaux sociaux premium avec glassmorphisme */}
                <motion.div
                    className="flex justify-center gap-2.5 mb-5 flex-wrap px-4"
                    style={{ willChange: 'transform, opacity' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                        delay: 0.4, 
                        duration: 0.6,
                        ease: [0.16, 1, 0.3, 1],
                        type: "spring",
                        stiffness: 300,
                        damping: 25
                    }}
                >
                    {phone && (
                        <motion.a
                            href={`tel:${phone}`}
                            className="group relative w-11 h-11 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-lg overflow-hidden"
                            style={{ willChange: 'transform' }}
                            title="Appeler"
                            onClick={() => cardId && trackClick({ cardId, linkType: 'phone', linkLabel: 'phone' })}
                            whileHover={{ 
                                scale: 1.15, 
                                y: -2,
                                transition: { 
                                    type: "spring", 
                                    stiffness: 400, 
                                    damping: 17,
                                    duration: 0.2
                                } 
                            }}
                            whileTap={{ 
                                scale: 0.95,
                                transition: { 
                                    type: "spring", 
                                    stiffness: 500, 
                                    damping: 20,
                                    duration: 0.15
                                }
                            }}
                        >
                            {/* Gradient glow on hover */}
                            <motion.div 
                                className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent"
                                initial={{ opacity: 0 }}
                                whileHover={{ opacity: 1 }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                            />
                            <Phone className="w-5 h-5 text-white relative z-10 drop-shadow-md" />
                        </motion.a>
                    )}

                    {email && (
                        <motion.a
                            href={`mailto:${email}`}
                            className="group relative w-11 h-11 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-lg overflow-hidden"
                            style={{ willChange: 'transform' }}
                            title="Envoyer un email"
                            onClick={() => cardId && trackClick({ cardId, linkType: 'email', linkLabel: 'email' })}
                            whileHover={{ 
                                scale: 1.15, 
                                y: -2,
                                transition: { 
                                    type: "spring", 
                                    stiffness: 400, 
                                    damping: 17,
                                    duration: 0.2
                                } 
                            }}
                            whileTap={{ 
                                scale: 0.95,
                                transition: { 
                                    type: "spring", 
                                    stiffness: 500, 
                                    damping: 20,
                                    duration: 0.15
                                }
                            }}
                        >
                            <motion.div 
                                className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent"
                                initial={{ opacity: 0 }}
                                whileHover={{ opacity: 1 }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                            />
                            <Mail className="w-5 h-5 text-white relative z-10 drop-shadow-md" />
                        </motion.a>
                    )}

                    {socials?.instagram && (
                        <motion.a
                            href={socials.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative w-11 h-11 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-lg overflow-hidden"
                            style={{ willChange: 'transform' }}
                            title="Instagram"
                            onClick={() => cardId && trackClick({ cardId, linkType: 'social', linkLabel: 'instagram', linkUrl: socials.instagram })}
                            whileHover={{ 
                                scale: 1.15, 
                                y: -2,
                                transition: { 
                                    type: "spring", 
                                    stiffness: 400, 
                                    damping: 17,
                                    duration: 0.2
                                } 
                            }}
                            whileTap={{ 
                                scale: 0.95,
                                transition: { 
                                    type: "spring", 
                                    stiffness: 500, 
                                    damping: 20,
                                    duration: 0.15
                                }
                            }}
                        >
                            <motion.div 
                                className="absolute inset-0 bg-gradient-to-br from-pink-500/50 to-purple-500/50"
                                initial={{ opacity: 0 }}
                                whileHover={{ opacity: 1 }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                            />
                            <Instagram className="w-5 h-5 text-white relative z-10 drop-shadow-md" />
                        </motion.a>
                    )}

                    {socials?.linkedin && (
                        <motion.a
                            href={socials.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative w-11 h-11 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-lg overflow-hidden"
                            style={{ willChange: 'transform' }}
                            title="LinkedIn"
                            onClick={() => cardId && trackClick({ cardId, linkType: 'social', linkLabel: 'linkedin', linkUrl: socials.linkedin })}
                            whileHover={{ 
                                scale: 1.15, 
                                y: -2,
                                transition: { 
                                    type: "spring", 
                                    stiffness: 400, 
                                    damping: 17,
                                    duration: 0.2
                                } 
                            }}
                            whileTap={{ 
                                scale: 0.95,
                                transition: { 
                                    type: "spring", 
                                    stiffness: 500, 
                                    damping: 20,
                                    duration: 0.15
                                }
                            }}
                        >
                            <motion.div 
                                className="absolute inset-0 bg-gradient-to-br from-blue-600/60 to-blue-500/60"
                                initial={{ opacity: 0 }}
                                whileHover={{ opacity: 1 }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                            />
                            <Linkedin className="w-5 h-5 text-white relative z-10 drop-shadow-md" />
                        </motion.a>
                    )}

                    {socials?.facebook && (
                        <motion.a
                            href={socials.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative w-11 h-11 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-lg overflow-hidden"
                            style={{ willChange: 'transform' }}
                            title="Facebook"
                            onClick={() => cardId && trackClick({ cardId, linkType: 'social', linkLabel: 'facebook', linkUrl: socials.facebook })}
                            whileHover={{ 
                                scale: 1.15, 
                                y: -2,
                                transition: { 
                                    type: "spring", 
                                    stiffness: 400, 
                                    damping: 17,
                                    duration: 0.2
                                } 
                            }}
                            whileTap={{ 
                                scale: 0.95,
                                transition: { 
                                    type: "spring", 
                                    stiffness: 500, 
                                    damping: 20,
                                    duration: 0.15
                                }
                            }}
                        >
                            <motion.div 
                                className="absolute inset-0 bg-gradient-to-br from-blue-700/60 to-blue-600/60"
                                initial={{ opacity: 0 }}
                                whileHover={{ opacity: 1 }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                            />
                            <Facebook className="w-5 h-5 text-white relative z-10 drop-shadow-md" />
                        </motion.a>
                    )}

                    {socials?.twitter && (
                        <motion.a
                            href={socials.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative w-11 h-11 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-lg overflow-hidden"
                            style={{ willChange: 'transform' }}
                            title="Twitter"
                            onClick={() => cardId && trackClick({ cardId, linkType: 'social', linkLabel: 'twitter', linkUrl: socials.twitter })}
                            whileHover={{ 
                                scale: 1.15, 
                                y: -2,
                                transition: { 
                                    type: "spring", 
                                    stiffness: 400, 
                                    damping: 17,
                                    duration: 0.2
                                } 
                            }}
                            whileTap={{ 
                                scale: 0.95,
                                transition: { 
                                    type: "spring", 
                                    stiffness: 500, 
                                    damping: 20,
                                    duration: 0.15
                                }
                            }}
                        >
                            <motion.div 
                                className="absolute inset-0 bg-gradient-to-br from-blue-400/60 to-blue-300/60"
                                initial={{ opacity: 0 }}
                                whileHover={{ opacity: 1 }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                            />
                            <Twitter className="w-5 h-5 text-white relative z-10 drop-shadow-md" />
                        </motion.a>
                    )}

                    {socials?.youtube && (
                        <motion.a
                            href={socials.youtube}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative w-11 h-11 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-lg overflow-hidden"
                            title="YouTube"
                            whileHover={{ scale: 1.15, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-red-600/60 to-red-500/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <Youtube className="w-5 h-5 text-white relative z-10 drop-shadow-md" />
                        </motion.a>
                    )}
                </motion.div>

                {/* Toggle Liens / Boutique - design épuré, bascule claire */}
                {shouldShowSlider && (
                    <motion.div
                        className="relative inline-flex rounded-full p-1 gap-0"
                        style={{ background: 'rgba(0,0,0,0.2)' }}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, duration: 0.35 }}
                    >
                        {/* Indicateur glissant */}
                        <motion.div
                            className="absolute top-1 bottom-1 rounded-full bg-white shadow-md"
                            style={{ width: 'calc(50% - 4px)', left: 4 }}
                            initial={false}
                            animate={{
                                x: activeSlider === 'liens' ? 0 : 'calc(100% + 4px)'
                            }}
                            transition={{
                                type: 'spring',
                                stiffness: 400,
                                damping: 32
                            }}
                        />

                        <button
                            type="button"
                            onClick={() => setActiveSlider('liens')}
                            className={`relative z-10 min-w-[72px] px-5 py-2.5 rounded-full text-[14px] font-semibold transition-colors duration-200 ${activeSlider === 'liens'
                                ? 'text-gray-900'
                                : 'text-white/95 hover:text-white'
                            }`}
                        >
                            {t('businessCard.links')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveSlider('boutique')}
                            className={`relative z-10 min-w-[72px] px-5 py-2.5 rounded-full text-[14px] font-semibold transition-colors duration-200 ${activeSlider === 'boutique'
                                ? 'text-gray-900'
                                : 'text-white/95 hover:text-white'
                            }`}
                        >
                            {t('businessCard.store')}
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default BusinessCardHeaderModern;
