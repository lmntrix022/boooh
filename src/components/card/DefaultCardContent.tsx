import React from 'react';
import { motion, AnimatePresence } from "framer-motion";
import BusinessCardMedia from "./BusinessCardMedia";
import BusinessCardActions from "./BusinessCardActions";
import { useLanguage } from '@/hooks/useLanguage';

interface DefaultCardContentProps {
    description?: string;
    showDescription: boolean;
    setShowDescription: (show: boolean) => void;
    shouldShowMediaSection: boolean;
    combinedMediaContent: any[];
    onSwitchToBoutique: () => void;
    onQRCodeClick: () => void;
    onVCardClick: () => void;
    onAppointmentClick: () => void;
    cardId?: string;
    trackClick: (params: any) => void;
    canBookAppointments: boolean;
    dbPartyTheme?: any;
}

const DefaultCardContent: React.FC<DefaultCardContentProps> = ({
    description,
    showDescription,
    setShowDescription,
    shouldShowMediaSection,
    combinedMediaContent,
    onSwitchToBoutique,
    onQRCodeClick,
    onVCardClick,
    onAppointmentClick,
    cardId,
    trackClick,
    canBookAppointments,
    dbPartyTheme
}) => {
    const { t } = useLanguage();

    return (
        <div className="px-6 pb-6 mt-4">
            <div className="absolute inset-0 pointer-events-none">
                <div
                    className="w-full h-full bg-cover bg-center bg-no-repeat "
                    style={{
                        backgroundImage: dbPartyTheme?.image_url
                            ? `url('${dbPartyTheme.image_url}')`
                            : "",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                    }}
                />
            </div>
            <div className="space-y-6 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-3 shadow-xl">
                {description && (
                    <div className="bg-white/10 backdrop-blur-lg border border-white/30 rounded-2xl p-3 shadow-xl">
                        <motion.button
                            onClick={() => setShowDescription(!showDescription)}
                            className="w-full flex items-center justify-between text-left"
                            style={{ willChange: 'transform' }}
                            whileHover={{ 
                                scale: 1.02,
                                transition: { 
                                    type: "spring", 
                                    stiffness: 400, 
                                    damping: 17,
                                    duration: 0.2
                                } 
                            }}
                            whileTap={{ 
                                scale: 0.98,
                                transition: { 
                                    type: "spring", 
                                    stiffness: 500, 
                                    damping: 20,
                                    duration: 0.15
                                }
                            }}
                        >
                            <span className="font-semibold text-gray-900 text-sm">
                                {t('businessCard.learnMore')}
                            </span>
                            <motion.div
                                animate={{ rotate: showDescription ? 45 : 0 }}
                                transition={{ 
                                    duration: 0.3,
                                    ease: [0.16, 1, 0.3, 1],
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 25
                                }}
                                style={{ willChange: 'transform' }}
                                className="w-6 h-6 flex items-center justify-center bg-white/30 backdrop-blur-sm rounded-full"
                            >
                                {showDescription ? (
                                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                )}
                            </motion.div>
                        </motion.button>

                        <AnimatePresence mode="wait">
                            {showDescription && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ 
                                        duration: 0.4,
                                        ease: [0.16, 1, 0.3, 1],
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 30
                                    }}
                                    style={{ willChange: 'transform, opacity' }}
                                    className="mt-4 overflow-hidden"
                                >
                                    <p className="text-gray-700 text-sm leading-relaxed text-justify">
                                        {description}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {shouldShowMediaSection && (
                    <div className="bg-white/10 backdrop-blur-lg border border-white/30 rounded-2xl p-3 shadow-xl">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Médias</h3>
                        <BusinessCardMedia
                            combinedMediaContent={combinedMediaContent}
                            onSwitchToBoutique={onSwitchToBoutique}
                        />
                    </div>
                )}

                <BusinessCardActions
                    onQRCodeClick={onQRCodeClick}
                    onVCardClick={onVCardClick}
                    onAppointmentClick={onAppointmentClick}
                    canBookAppointments={canBookAppointments}
                    variant="compact"
                />
            </div>
        </div>
    );
};

export default DefaultCardContent;
